import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Notification } from '@/api/notificationApi';
import * as notificationApi from '@/api/notificationApi';
import { toast } from 'sonner';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  client: Client | null;
  
  // Actions
  connect: (userId: string) => void;
  disconnect: () => void;
  fetchNotifications: (page?: number, size?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

// Dynamic WebSocket URL (local: ws://, production: wss://)
const getWebSocketURL = (): string => {
  if (typeof window === 'undefined') return 'ws://localhost:8080/ws';
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    return 'http://localhost:8080/ws'; // Local: HTTP SockJS
  } else {
    // Production: use backend domain with WSS
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://viegym-backend.onrender.com';
    return backendUrl.replace(/^http/, 'ws') + '/ws';
  }
};

const WEBSOCKET_URL = getWebSocketURL();

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  client: null,

  connect: (userId: string) => {
    // WebSocket sẽ tự động gửi cookie (browser tự động làm)
    // Backend sẽ đọc token từ cookie header (WebSocketConfig có fallback)
    console.log('[WebSocket] Connecting for user:', userId);
    console.log('[WebSocket] Browser sẽ tự động gửi cookie HttpOnly trong WebSocket connection');

    const client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      // Không cần Authorization header, backend sẽ đọc từ cookie
      connectHeaders: {},
      debug: (str) => {
        console.log('[WebSocket Debug]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        set({ isConnected: true });

        // Subscribe to user-specific notifications
        client.subscribe(`/user/${userId}/queue/notifications`, (message) => {
          try {
            const notification: Notification = JSON.parse(message.body);
            console.log('Received notification:', notification);
            
            // Add to store
            get().addNotification(notification);
            
            // Show toast
            toast.success(notification.title, {
              description: notification.message,
              duration: 5000,
            });
            
            // Play sound (optional)
            playNotificationSound();
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
        set({ isConnected: false });
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        set({ isConnected: false });
      },
    });

    client.activate();
    set({ client });
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.deactivate();
      set({ client: null, isConnected: false });
    }
  },

  fetchNotifications: async (page = 0, size = 20) => {
    try {
      const data = await notificationApi.getNotifications(page, size);
      console.log('[fetchNotifications] Full response:', data);
      console.log('[fetchNotifications] First notification:', data.content?.[0]);
      
      if (data && data.content) {
        set({ notifications: data.content });
        
        // Calculate unread count from notifications
        const unreadCount = data.content.filter((n: any) => !n.isRead).length;
        console.log('[fetchNotifications] Calculated unread:', unreadCount);
        console.log('[fetchNotifications] Sample isRead values:', data.content.slice(0, 3).map((n: any) => ({ id: n.id, isRead: n.isRead })));
        set({ unreadCount });
      } else {
        console.warn('[fetchNotifications] No content in response:', data);
        set({ notifications: [], unreadCount: 0 });
      }
    } catch (error) {
      console.error('[fetchNotifications] Failed:', error);
      set({ notifications: [], unreadCount: 0 });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.isRead 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

// Helper function to play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((e) => console.log('Could not play sound:', e));
  } catch (error) {
    // Ignore sound errors
  }
}
