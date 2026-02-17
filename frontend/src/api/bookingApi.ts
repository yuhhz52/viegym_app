import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth";

// ===== TYPES =====

export interface TimeSlotRequest {
  startTime: string; // ISO string
  endTime: string;
  notes?: string;
  location?: string;
  price?: number;
}

export interface TimeSlotResponse {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatarUrl?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
  location?: string;
  status: "AVAILABLE" | "FULL" | "DISABLED";
  price?: number;
  capacity?: number;
  bookedCount?: number;
  createdAt: string;
}

export interface BookingRequest {
  timeSlotId: string;
  coachId: string;
  clientNotes?: string;
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NO_SHOW";
}

export interface BookingResponse {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatarUrl?: string;
  clientId: string;
  clientName: string;
  timeSlot: TimeSlotResponse;
  bookingTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NO_SHOW";
  clientNotes?: string;
  coachNotes?: string;
  createdAt: string;
  expiredAt?: string; // For PENDING bookings - when they expire if not paid
}

// ===== TIME SLOTS APIs =====

export const createTimeSlotAPI = async (data: TimeSlotRequest): Promise<TimeSlotResponse> => {
  const res = await apiClient.post<ApiResponse<TimeSlotResponse>>("/api/bookings/time-slots", data);
  return res.data.result;
};

export const getMyTimeSlotsAPI = async (): Promise<TimeSlotResponse[]> => {
  const res = await apiClient.get<ApiResponse<TimeSlotResponse[]>>("/api/bookings/time-slots/my");
  return res.data.result;
};

export const getAllAvailableSlotsAPI = async (): Promise<TimeSlotResponse[]> => {
  const res = await apiClient.get<ApiResponse<TimeSlotResponse[]>>("/api/bookings/time-slots/available");
  return res.data.result;
};

export const getAvailableSlotsByCoachAPI = async (coachId: string): Promise<TimeSlotResponse[]> => {
  const res = await apiClient.get<ApiResponse<TimeSlotResponse[]>>(`/api/bookings/time-slots/coach/${coachId}`);
  return res.data.result;
};

export const updateTimeSlotAPI = async (slotId: string, data: TimeSlotRequest): Promise<TimeSlotResponse> => {
  const res = await apiClient.put<ApiResponse<TimeSlotResponse>>(`/api/bookings/time-slots/${slotId}`, data);
  return res.data.result;
};

export const deleteTimeSlotAPI = async (slotId: string): Promise<void> => {
  await apiClient.delete(`/api/bookings/time-slots/${slotId}`);
};

// ===== BOOKINGS APIs =====

export const createBookingAPI = async (data: BookingRequest): Promise<BookingResponse> => {
  const res = await apiClient.post<ApiResponse<BookingResponse>>("/api/bookings", data);
  return res.data.result;
};

export const getMyBookingsAPI = async (): Promise<BookingResponse[]> => {
  const res = await apiClient.get<ApiResponse<BookingResponse[]>>("/api/bookings/my");
  return res.data.result;
};

export const getCoachBookingsAPI = async (): Promise<BookingResponse[]> => {
  const res = await apiClient.get<ApiResponse<BookingResponse[]>>("/api/bookings/coach");
  return res.data.result;
};

export const getBookingByIdAPI = async (bookingId: string): Promise<BookingResponse> => {
  const res = await apiClient.get<ApiResponse<BookingResponse>>(`/api/bookings/${bookingId}`);
  return res.data.result;
};

export const confirmBookingAPI = async (bookingId: string): Promise<BookingResponse> => {
  const res = await apiClient.put<ApiResponse<BookingResponse>>(`/api/bookings/${bookingId}/confirm`);
  return res.data.result;
};

export const cancelBookingAPI = async (bookingId: string): Promise<BookingResponse> => {
  const res = await apiClient.put<ApiResponse<BookingResponse>>(`/api/bookings/${bookingId}/cancel`);
  return res.data.result;
};

export const completeBookingAPI = async (bookingId: string, coachNotes?: string): Promise<BookingResponse> => {
  const res = await apiClient.put<ApiResponse<BookingResponse>>(
    `/api/bookings/${bookingId}/complete${coachNotes ? `?coachNotes=${encodeURIComponent(coachNotes)}` : ""}`
  );
  return res.data.result;
};

export const getBookingsByDateRangeAPI = async (start: string, end: string): Promise<BookingResponse[]> => {
  const res = await apiClient.get<ApiResponse<BookingResponse[]>>(
    `/api/bookings/date-range?start=${start}&end=${end}`
  );
  return res.data.result;
};
