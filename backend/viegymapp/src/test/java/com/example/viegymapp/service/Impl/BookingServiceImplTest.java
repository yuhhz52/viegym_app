package com.example.viegymapp.service.Impl;

import com.example.viegymapp.dto.request.BookingRequest;
import com.example.viegymapp.dto.response.BookingResponse;
import com.example.viegymapp.entity.BookingSession;
import com.example.viegymapp.entity.CoachTimeSlot;
import com.example.viegymapp.entity.Enum.PaymentStatus;
import com.example.viegymapp.entity.Notification;
import com.example.viegymapp.entity.Payment;
import com.example.viegymapp.entity.User;
import com.example.viegymapp.exception.AppException;
import com.example.viegymapp.exception.ErrorCode;
import com.example.viegymapp.mapper.BookingMapper;
import com.example.viegymapp.mapper.TimeSlotMapper;
import com.example.viegymapp.repository.BookingSessionRepository;
import com.example.viegymapp.repository.CoachTimeSlotRepository;
import com.example.viegymapp.repository.PaymentRepository;
import com.example.viegymapp.repository.UserRepository;
import com.example.viegymapp.service.AsyncNotificationService;
import com.example.viegymapp.service.CoachBalanceService;
import com.example.viegymapp.service.PaymentService;
import com.example.viegymapp.service.RefundPolicyService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private CoachTimeSlotRepository timeSlotRepository;
    @Mock
    private BookingSessionRepository bookingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TimeSlotMapper timeSlotMapper;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private AsyncNotificationService asyncNotificationService;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentService paymentService;
    @Mock
    private CoachBalanceService coachBalanceService;
    @Mock
    private RefundPolicyService refundPolicyService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private UUID clientId;
    private UUID coachId;
    private UUID slotId;
    private UUID bookingId;
    private User client;
    private User coach;

    @BeforeEach
    void setUp() {
        clientId = UUID.randomUUID();
        coachId = UUID.randomUUID();
        slotId = UUID.randomUUID();
        bookingId = UUID.randomUUID();

        client = User.builder()
                .id(clientId)
                .email("client@test.com")
                .fullName("Client")
                .build();

        coach = User.builder()
                .id(coachId)
                .email("coach@test.com")
                .fullName("Coach")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("client@test.com", "pwd")
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createBooking_whenValidRequest_shouldCreatePendingBookingAndReturnResponse() {
        BookingRequest request = BookingRequest.builder()
                .coachId(coachId)
                .timeSlotId(slotId)
                .clientNotes("Need strength training")
                .build();

        CoachTimeSlot slot = CoachTimeSlot.builder()
                .id(slotId)
                .coach(coach)
                .startTime(LocalDateTime.now().plusHours(2))
                .endTime(LocalDateTime.now().plusHours(3))
                .status(CoachTimeSlot.SlotStatus.AVAILABLE)
                .capacity(1)
                .bookedCount(0)
                .price(new BigDecimal("200000"))
                .build();

        BookingSession mappedBooking = new BookingSession();
        BookingSession savedBooking = new BookingSession();
        savedBooking.setId(bookingId);
        savedBooking.setCoach(coach);
        savedBooking.setClient(client);
        savedBooking.setTimeSlot(slot);
        savedBooking.setBookingTime(slot.getStartTime());
        savedBooking.setStatus(BookingSession.BookingStatus.PENDING);

        BookingResponse expectedResponse = BookingResponse.builder()
                .id(bookingId)
                .coachId(coachId)
                .clientId(clientId)
                .status(BookingSession.BookingStatus.PENDING)
                .build();

        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(client));
        when(bookingRepository.countByClientAndCreatedAtAfter(eq(client), any(OffsetDateTime.class))).thenReturn(0L);
        when(timeSlotRepository.findById(slotId)).thenReturn(Optional.of(slot));
        when(userRepository.findById(coachId)).thenReturn(Optional.of(coach));
        when(bookingMapper.toEntity(request)).thenReturn(mappedBooking);
        when(bookingRepository.save(mappedBooking)).thenReturn(savedBooking);
        when(bookingMapper.toResponse(savedBooking)).thenReturn(expectedResponse);

        BookingResponse response = bookingService.createBooking(request);

        assertEquals(bookingId, response.getId());
        assertEquals(BookingSession.BookingStatus.PENDING, response.getStatus());

        ArgumentCaptor<BookingSession> bookingCaptor = ArgumentCaptor.forClass(BookingSession.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        BookingSession savedArg = bookingCaptor.getValue();
        assertEquals(clientId, savedArg.getClient().getId());
        assertEquals(coachId, savedArg.getCoach().getId());
        assertTrue(savedArg.getRequiresPayment());
        assertEquals(new BigDecimal("200000"), savedArg.getAmount());

        verify(asyncNotificationService).publishBookingNotification(
                eq(clientId),
                eq("Coach"),
                any(String.class),
                eq(Notification.NotificationType.BOOKING_CONFIRMED)
        );
    }

    @Test
    void createBooking_whenRateLimitExceeded_shouldThrowTooManyBookings() {
        BookingRequest request = BookingRequest.builder()
                .coachId(coachId)
                .timeSlotId(slotId)
                .build();

        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(client));
        when(bookingRepository.countByClientAndCreatedAtAfter(eq(client), any(OffsetDateTime.class))).thenReturn(5L);

        AppException ex = assertThrows(AppException.class, () -> bookingService.createBooking(request));

        assertEquals(ErrorCode.TOO_MANY_BOOKINGS, ex.getErrorCode());
        verify(timeSlotRepository, never()).findById(any(UUID.class));
    }

    @Test
    void createBooking_whenCoachDoesNotMatchSlot_shouldThrowInvalidCoachForSlot() {
        UUID anotherCoachId = UUID.randomUUID();
        User anotherCoach = User.builder().id(anotherCoachId).email("another@test.com").build();

        BookingRequest request = BookingRequest.builder()
                .coachId(anotherCoachId)
                .timeSlotId(slotId)
                .build();

        CoachTimeSlot slot = CoachTimeSlot.builder()
                .id(slotId)
                .coach(coach)
                .startTime(LocalDateTime.now().plusHours(2))
                .status(CoachTimeSlot.SlotStatus.AVAILABLE)
                .capacity(1)
                .bookedCount(0)
                .build();

        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(client));
        when(bookingRepository.countByClientAndCreatedAtAfter(eq(client), any(OffsetDateTime.class))).thenReturn(0L);
        when(timeSlotRepository.findById(slotId)).thenReturn(Optional.of(slot));
        when(userRepository.findById(anotherCoachId)).thenReturn(Optional.of(anotherCoach));

        AppException ex = assertThrows(AppException.class, () -> bookingService.createBooking(request));

        assertEquals(ErrorCode.INVALID_COACH_FOR_SLOT, ex.getErrorCode());
    }

    @Test
    void cancelBooking_whenCoachCancelsPaidBooking_shouldThrowCannotCancelPaidBooking() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("coach@test.com", "pwd")
        );

        BookingSession booking = new BookingSession();
        booking.setId(bookingId);
        booking.setCoach(coach);
        booking.setClient(client);
        booking.setStatus(BookingSession.BookingStatus.CONFIRMED);

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setStatus(PaymentStatus.COMPLETED);

        when(userRepository.findByEmail("coach@test.com")).thenReturn(Optional.of(coach));
        when(bookingRepository.countByClientAndStatusAndUpdatedAtAfter(eq(coach), eq(BookingSession.BookingStatus.CANCELLED), any(OffsetDateTime.class)))
                .thenReturn(0L);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingSessionId(bookingId)).thenReturn(Optional.of(payment));

        AppException ex = assertThrows(AppException.class, () -> bookingService.cancelBooking(bookingId));

        assertEquals(ErrorCode.CANNOT_CANCEL_PAID_BOOKING, ex.getErrorCode());
        verify(bookingRepository, never()).save(any(BookingSession.class));
    }

    @Test
    void cancelBooking_whenClientCancelsConfirmedBooking_shouldDecrementSlotAndCallRefund() {
        CoachTimeSlot slot = CoachTimeSlot.builder()
                .id(slotId)
                .coach(coach)
                .status(CoachTimeSlot.SlotStatus.FULL)
                .capacity(1)
                .bookedCount(1)
                .startTime(LocalDateTime.now().plusHours(2))
                .endTime(LocalDateTime.now().plusHours(3))
                .build();

        BookingSession booking = new BookingSession();
        booking.setId(bookingId);
        booking.setCoach(coach);
        booking.setClient(client);
        booking.setStatus(BookingSession.BookingStatus.CONFIRMED);
        booking.setTimeSlot(slot);
        booking.setBookingTime(LocalDateTime.now().plusHours(2));

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setAmount(new BigDecimal("100000"));
        payment.setBookingSession(booking);

        BookingResponse expectedResponse = BookingResponse.builder()
                .id(bookingId)
                .status(BookingSession.BookingStatus.CANCELLED)
                .build();

        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(client));
        when(bookingRepository.countByClientAndStatusAndUpdatedAtAfter(eq(client), eq(BookingSession.BookingStatus.CANCELLED), any(OffsetDateTime.class)))
                .thenReturn(0L);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingSessionId(bookingId)).thenReturn(Optional.of(payment));
        when(refundPolicyService.calculateRefundAmount(booking, payment)).thenReturn(new BigDecimal("50000"));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.toResponse(booking)).thenReturn(expectedResponse);

        BookingResponse response = bookingService.cancelBooking(bookingId);

        assertEquals(BookingSession.BookingStatus.CANCELLED, response.getStatus());
        assertEquals(0, slot.getBookedCount());
        assertEquals(CoachTimeSlot.SlotStatus.AVAILABLE, slot.getStatus());
        verify(timeSlotRepository).save(slot);
        verify(paymentService).refundPayment(eq(payment.getId()), any(String.class));
        verify(asyncNotificationService).publishBookingNotification(
                eq(clientId),
                eq("Coach"),
                any(String.class),
                eq(Notification.NotificationType.BOOKING_CANCELLED)
        );
    }
}
