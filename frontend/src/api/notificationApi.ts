import apiClient from './apiClient';

// ============ NOTIFICATION TYPES ============

export const NotificationType = {
  ACHIEVEMENT: 'ACHIEVEMENT',
  WORKOUT: 'WORKOUT',
  STREAK: 'STREAK',
  SYSTEM: 'SYSTEM',
  REMINDER: 'REMINDER',
  SOCIAL: 'SOCIAL',
  COACH_MESSAGE: 'COACH_MESSAGE',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  PROGRAM_UPDATE: 'PROGRAM_UPDATE'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface ApiResponse<T> {
  code?: number;
  message?: string;
  result: T;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: string;
}

export interface NotificationPreference {
  id: string;
  emailEnabled: boolean;
  emailAchievements: boolean;
  emailWorkouts: boolean;
  emailReminders: boolean;
  emailSocial: boolean;
  emailCoach: boolean;
  emailBooking: boolean;
  pushEnabled: boolean;
  pushAchievements: boolean;
  pushWorkouts: boolean;
  pushReminders: boolean;
  pushSocial: boolean;
  pushCoach: boolean;
  pushBooking: boolean;
  reminderTime?: string;
  dailyReminder: boolean;
}

export interface NotificationPreferenceRequest {
  emailEnabled?: boolean;
  emailAchievements?: boolean;
  emailWorkouts?: boolean;
  emailReminders?: boolean;
  emailSocial?: boolean;
  emailCoach?: boolean;
  emailBooking?: boolean;
  pushEnabled?: boolean;
  pushAchievements?: boolean;
  pushWorkouts?: boolean;
  pushReminders?: boolean;
  pushSocial?: boolean;
  pushCoach?: boolean;
  pushBooking?: boolean;
  reminderTime?: string;
  dailyReminder?: boolean;
}

export interface PaginatedNotifications {
  content: Notification[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ============ API CALLS ============

/**
 * Get paginated notifications
 */
export const getNotifications = async (
  page: number = 0,
  size: number = 20
): Promise<PaginatedNotifications> => {
  const response = await apiClient.get<ApiResponse<PaginatedNotifications>>(
    '/api/notifications',
    { params: { page, size } }
  );
  return response.data.result;
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get<ApiResponse<Notification[]>>(
    '/api/notifications/unread'
  );
  return response.data.result;
};

/**
 * Get unread count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<number>>(
    '/api/notifications/unread/count'
  );
  return response.data.result;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await apiClient.put<ApiResponse<Notification>>(
    `/api/notifications/${id}/read`
  );
  return response.data.result;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.put('/api/notifications/read-all');
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notifications/${id}`);
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (): Promise<void> => {
  await apiClient.delete('/api/notifications');
};

/**
 * Get notification preferences
 */
export const getPreferences = async (): Promise<NotificationPreference> => {
  const response = await apiClient.get<ApiResponse<NotificationPreference>>(
    '/api/notifications/preferences'
  );
  return response.data.result;
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
  data: NotificationPreferenceRequest
): Promise<NotificationPreference> => {
  const response = await apiClient.put<ApiResponse<NotificationPreference>>(
    '/api/notifications/preferences',
    data
  );
  return response.data.result;
};
