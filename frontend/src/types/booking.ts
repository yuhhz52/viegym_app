export interface BookingNotificationResponse {
  bookingId: string;
  coachId: string;
  clientName: string;
  clientEmail: string;
  bookingTime: string;
  timeSlotInfo: string;
  message: string;
  type: 'NEW_BOOKING' | 'BOOKING_CANCELLED';
  timestamp: string;
}