package com.example.viegymapp.service.Impl;

import com.example.viegymapp.entity.BookingSession;
import com.example.viegymapp.entity.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RefundPolicyServiceImplTest {

    private RefundPolicyServiceImpl refundPolicyService;

    @BeforeEach
    void setUp() {
        refundPolicyService = new RefundPolicyServiceImpl();
    }

    @Test
    void calculateRefundAmount_whenCancelledMoreThan24HoursBefore_shouldReturn100Percent() {
        BookingSession booking = createBooking(LocalDateTime.now().plusHours(30), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("100000.00", refund);
    }

    @Test
    void calculateRefundAmount_whenCancelledBetween12And24HoursBefore_shouldReturn75Percent() {
        BookingSession booking = createBooking(LocalDateTime.now().plusHours(15), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("75000.00", refund);
    }

    @Test
    void calculateRefundAmount_whenCancelledBetween2And12HoursBefore_shouldReturn50Percent() {
        BookingSession booking = createBooking(LocalDateTime.now().plusHours(5), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("50000.00", refund);
    }

    @Test
    void calculateRefundAmount_whenCancelledBetween1And2HoursBefore_shouldReturn25Percent() {
        BookingSession booking = createBooking(LocalDateTime.now().plusMinutes(90), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("25000.00", refund);
    }

    @Test
    void calculateRefundAmount_whenCancelledLessThan1HourBefore_shouldReturnZero() {
        BookingSession booking = createBooking(LocalDateTime.now().plusMinutes(30), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("0", refund);
    }

    @Test
    void calculateRefundAmount_whenBookingTimeAlreadyPassed_shouldReturnZero() {
        BookingSession booking = createBooking(LocalDateTime.now().minusMinutes(5), BookingSession.BookingStatus.CONFIRMED);
        Payment payment = createPayment(new BigDecimal("100000"));

        BigDecimal refund = refundPolicyService.calculateRefundAmount(booking, payment);

        assertAmountEquals("0", refund);
    }

    @Test
    void getRefundPercentage_shouldReturnExpectedValuesForBoundaries() {
        assertEquals(100, refundPolicyService.getRefundPercentage(24));
        assertEquals(75, refundPolicyService.getRefundPercentage(12));
        assertEquals(50, refundPolicyService.getRefundPercentage(2));
        assertEquals(25, refundPolicyService.getRefundPercentage(1));
        assertEquals(0, refundPolicyService.getRefundPercentage(0));
    }

    @Test
    void isRefundAllowed_whenStatusPendingOrConfirmed_shouldReturnTrue() {
        BookingSession pendingBooking = createBooking(LocalDateTime.now().plusHours(6), BookingSession.BookingStatus.PENDING);
        BookingSession confirmedBooking = createBooking(LocalDateTime.now().plusHours(6), BookingSession.BookingStatus.CONFIRMED);

        assertTrue(refundPolicyService.isRefundAllowed(pendingBooking));
        assertTrue(refundPolicyService.isRefundAllowed(confirmedBooking));
    }

    @Test
    void isRefundAllowed_whenStatusIsNotPendingOrConfirmed_shouldReturnFalse() {
        BookingSession completedBooking = createBooking(LocalDateTime.now().plusHours(6), BookingSession.BookingStatus.COMPLETED);
        BookingSession cancelledBooking = createBooking(LocalDateTime.now().plusHours(6), BookingSession.BookingStatus.CANCELLED);

        assertFalse(refundPolicyService.isRefundAllowed(completedBooking));
        assertFalse(refundPolicyService.isRefundAllowed(cancelledBooking));
    }

    @Test
    void getRefundPolicyDescription_whenBookingTimeIsNull_shouldReturnDefaultDescription() {
        String description = refundPolicyService.getRefundPolicyDescription(null);

        assertEquals("Chính sách hoàn tiền áp dụng theo thời gian hủy lịch", description);
    }

    @Test
    void getRefundPolicyDescription_whenWithin12To24Hours_shouldReturn75PercentMessage() {
        String description = refundPolicyService.getRefundPolicyDescription(LocalDateTime.now().plusHours(18));

        assertEquals("Hoàn lại 75% nếu hủy ngay", description);
    }

    private BookingSession createBooking(LocalDateTime bookingTime, BookingSession.BookingStatus status) {
        BookingSession booking = new BookingSession();
        booking.setId(UUID.randomUUID());
        booking.setBookingTime(bookingTime);
        booking.setStatus(status);
        return booking;
    }

    private Payment createPayment(BigDecimal amount) {
        Payment payment = new Payment();
        payment.setAmount(amount);
        return payment;
    }

    private void assertAmountEquals(String expected, BigDecimal actual) {
        assertTrue(new BigDecimal(expected).compareTo(actual) == 0,
                "Expected amount " + expected + " but was " + actual);
    }
}
