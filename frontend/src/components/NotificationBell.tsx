import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { FaCalendarCheck, FaCalendarTimes, FaBell } from 'react-icons/fa';
import { wsService } from '@/services/websocket';
import type { BookingNotificationResponse } from '@/types/booking';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<BookingNotificationResponse[]>(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('coach_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    const saved = localStorage.getItem('coach_notifications');
    return saved ? JSON.parse(saved).length : 0;
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to booking notifications
    const unsubscribe = wsService.onNotification((notification) => {
      console.log('[NotificationBell] Received notification:', notification);
      
      setNotifications(prev => {
        // Avoid duplicates
        const exists = prev.some(n => n.bookingId === notification.bookingId && n.timestamp === notification.timestamp);
        if (exists) return prev;
        
        const newNotifications = [notification, ...prev];
        // Save to localStorage
        localStorage.setItem('coach_notifications', JSON.stringify(newNotifications));
        setUnreadCount(newNotifications.length);
        
        // Show toast for new notification
        toast.info(notification.message, {
          description: `${notification.clientName} - ${formatTimeSlot(notification.timeSlotInfo)}`,
          duration: 5000,
        });
        
        return newNotifications;
      });
    });

    return () => unsubscribe();
  }, [user]);

  const removeNotification = (index: number) => {
    setNotifications(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Save to localStorage
      localStorage.setItem('coach_notifications', JSON.stringify(updated));
      setUnreadCount(updated.length);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    // Clear localStorage
    localStorage.removeItem('coach_notifications');
    toast.success('Đã xóa tất cả thông báo');
  };

  const formatTimeSlot = (timeSlotInfo: string) => {
    try {
      // Format: "2025-12-27T14:54 - 2025-12-28T14:54"
      const parts = timeSlotInfo.split(' - ');
      if (parts.length === 2) {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        
        const dateStr = start.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const startTime = start.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const endTime = end.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `${dateStr}, ${startTime} - ${endTime}`;
      }
      return timeSlotInfo;
    } catch (error) {
      return timeSlotInfo;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_BOOKING':
        return <FaCalendarCheck className="w-5 h-5" />;
      case 'BOOKING_CANCELLED':
        return <FaCalendarTimes className="w-5 h-5" />;
      default:
        return <FaBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'NEW_BOOKING':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'BOOKING_CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 bg-white border-2 border-slate-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs text-slate-600 hover:text-slate-900 h-7"
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Chưa có thông báo</p>
              <p className="text-sm text-slate-400 mt-1">Thông báo mới sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification, index) => (
                <div
                  key={`${notification.bookingId}-${notification.timestamp}-${index}`}
                  className="p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-900 mb-1">
                            {notification.type === 'NEW_BOOKING' ? 'Lịch hẹn mới' : 'Lịch hẹn bị hủy'}
                          </p>
                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-medium">Khách hàng:</span>
                              <span>{notification.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-medium">Thời gian:</span>
                              <span>{formatTimeSlot(notification.timeSlotInfo)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
