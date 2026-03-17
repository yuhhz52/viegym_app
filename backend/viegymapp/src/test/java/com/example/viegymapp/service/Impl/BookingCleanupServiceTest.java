package com.example.viegymapp.service.Impl;

import com.example.viegymapp.entity.BookingSession;
import com.example.viegymapp.repository.BookingSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingCleanupServiceTest {

    @Mock
    private BookingSessionRepository bookingRepository;

    @InjectMocks
    private BookingCleanupService bookingCleanupService;

    @Test
    void expirePendingBookings_whenFoundExpiredBookings_shouldMarkAsExpiredAndSave() {
        BookingSession booking1 = buildPendingBooking();
        BookingSession booking2 = buildPendingBooking();

        when(bookingRepository.findExpiredPendingBookings(any(LocalDateTime.class)))
                .thenReturn(List.of(booking1, booking2));

        bookingCleanupService.expirePendingBookings();

        assertEquals(BookingSession.BookingStatus.EXPIRED, booking1.getStatus());
        assertEquals(BookingSession.BookingStatus.EXPIRED, booking2.getStatus());
        verify(bookingRepository).save(booking1);
        verify(bookingRepository).save(booking2);
    }

    @Test
    void expirePendingBookings_whenSaveOneBookingFails_shouldContinueProcessingOthers() {
        BookingSession booking1 = buildPendingBooking();
        BookingSession booking2 = buildPendingBooking();

        when(bookingRepository.findExpiredPendingBookings(any(LocalDateTime.class)))
                .thenReturn(List.of(booking1, booking2));
        doThrow(new RuntimeException("db error")).when(bookingRepository).save(booking1);

        bookingCleanupService.expirePendingBookings();

        assertEquals(BookingSession.BookingStatus.EXPIRED, booking1.getStatus());
        assertEquals(BookingSession.BookingStatus.EXPIRED, booking2.getStatus());
        verify(bookingRepository).save(booking1);
        verify(bookingRepository).save(booking2);
    }

    @Test
    void expirePendingBookings_whenNoExpiredBookings_shouldNotSaveAnything() {
        when(bookingRepository.findExpiredPendingBookings(any(LocalDateTime.class)))
                .thenReturn(List.of());

        bookingCleanupService.expirePendingBookings();

        verify(bookingRepository, never()).save(any(BookingSession.class));
    }

    private BookingSession buildPendingBooking() {
        BookingSession booking = new BookingSession();
        booking.setId(UUID.randomUUID());
        booking.setStatus(BookingSession.BookingStatus.PENDING);
        booking.setExpiredAt(LocalDateTime.now().minusMinutes(15));
        return booking;
    }
}
