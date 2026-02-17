import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface NotificationManagerProps {
  children: React.ReactNode;
}

// NotificationManager now just ensures WebSocket connection
// Notifications are handled by NotificationBell component
export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('[NotificationManager] User:', user?.id);
    
    if (!user) {
      console.log('[NotificationManager] No user, skipping WebSocket connection');
      return;
    }

    console.log('[NotificationManager] ✅ WebSocket will be managed by individual layouts');
  }, [user]);

  return <>{children}</>;
};

export default NotificationManager;