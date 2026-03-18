package com.example.viegymapp.service.Impl;

import com.example.viegymapp.dto.response.PaymentResponse;
import com.example.viegymapp.entity.BookingSession;
import com.example.viegymapp.entity.Enum.PaymentStatus;
import com.example.viegymapp.entity.Payment;
import com.example.viegymapp.exception.BusinessException;
import com.example.viegymapp.exception.ErrorCode;
import com.example.viegymapp.repository.BookingSessionRepository;
import com.example.viegymapp.repository.CoachTimeSlotRepository;
import com.example.viegymapp.repository.PaymentRepository;
import com.example.viegymapp.repository.UserRepository;
import com.example.viegymapp.service.CoachBalanceService;
import com.example.viegymapp.service.RefundPolicyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private BookingSessionRepository bookingSessionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CoachTimeSlotRepository coachTimeSlotRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private CoachBalanceService coachBalanceService;
    @Mock
    private RefundPolicyService refundPolicyService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private UUID paymentId;
    private UUID bookingId;

    @BeforeEach
    void setUp() {
        paymentId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
    }

    @Test
    void checkPaymentStatus_whenPaymentExists_shouldReturnMappedResponse() {
        Payment payment = buildPayment(PaymentStatus.COMPLETED);
        payment.setOrderId("ORD-001");

        when(paymentRepository.findByOrderId("ORD-001")).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.checkPaymentStatus("ORD-001");

        assertEquals(paymentId, response.getId());
        assertEquals(bookingId, response.getBookingSessionId());
        assertEquals(PaymentStatus.COMPLETED, response.getStatus());
    }

    @Test
    void checkPaymentStatus_whenPaymentNotFound_shouldThrowAppException() {
        when(paymentRepository.findByOrderId("NOT_FOUND")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> paymentService.checkPaymentStatus("NOT_FOUND"));

        assertEquals(ErrorCode.PAYMENT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void refundPayment_whenPaymentCompleted_shouldMarkRefundedAndProcessCoachRefund() {
        Payment payment = buildPayment(PaymentStatus.COMPLETED);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(refundPolicyService.calculateRefundAmount(payment.getBookingSession(), payment)).thenReturn(new BigDecimal("50000"));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = paymentService.refundPayment(paymentId, "User request");

        assertEquals(PaymentStatus.REFUNDED, response.getStatus());
        assertEquals("User request", payment.getFailureReason());
        verify(coachBalanceService).processRefund(payment, new BigDecimal("50000"), "User request");
        verify(paymentRepository).save(payment);
    }

    @Test
    void refundPayment_whenPaymentNotCompleted_shouldThrowAndNotProcessCoachRefund() {
        Payment payment = buildPayment(PaymentStatus.PENDING);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        BusinessException ex = assertThrows(BusinessException.class, () -> paymentService.refundPayment(paymentId, "reason"));

        assertEquals(ErrorCode.PAYMENT_NOT_COMPLETED, ex.getErrorCode());
        verify(coachBalanceService, never()).processRefund(payment, BigDecimal.ZERO, "reason");
    }

    private Payment buildPayment(PaymentStatus status) {
        BookingSession booking = new BookingSession();
        booking.setId(bookingId);

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setBookingSession(booking);
        payment.setAmount(new BigDecimal("100000"));
        payment.setStatus(status);
        return payment;
    }
}
