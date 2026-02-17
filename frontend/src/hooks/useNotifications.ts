import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to manage WebSocket connection for real-time notifications
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const { connect, disconnect, fetchNotifications, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Wait for user to be ready
    // WebSocket sẽ tự động gửi cookie (browser tự động làm)
    if (user?.id) {
      console.log('[useNotifications] Connecting WebSocket for user:', user.id);
      
      // Connect to WebSocket
      connect(user.id);
      
      // Fetch initial data
      fetchNotifications();
      fetchUnreadCount();

      // Cleanup on unmount
      return () => {
        disconnect();
      };
    } else {
      console.log('[useNotifications] Waiting for user...', { userId: user?.id });
    }
  }, [user?.id, connect, disconnect, fetchNotifications, fetchUnreadCount]);

  return useNotificationStore();
};
