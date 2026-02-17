import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  CheckCircle2, 
  Activity, 
  Flame, 
  MessageSquare, 
  CalendarCheck, 
  CalendarX,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/api/notificationApi';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  
  // Use real notification store with WebSocket
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchNotifications();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    await markAllAsRead();
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case NotificationType.ACHIEVEMENT: 
        return <CheckCircle2 className={iconClass} />;
      case NotificationType.WORKOUT: 
        return <Activity className={iconClass} />;
      case NotificationType.STREAK: 
        return <Flame className={iconClass} />;
      case NotificationType.SYSTEM: 
        return <Bell className={iconClass} />;
      case NotificationType.REMINDER: 
        return <Zap className={iconClass} />;
      case NotificationType.SOCIAL: 
        return <Users className={iconClass} />;
      case NotificationType.COACH_MESSAGE: 
        return <MessageSquare className={iconClass} />;
      case NotificationType.BOOKING_CONFIRMED:
        return <CalendarCheck className={iconClass} />;
      case NotificationType.BOOKING_CANCELLED:
        return <CalendarX className={iconClass} />;
      case NotificationType.PROGRAM_UPDATE:
        return <FileText className={iconClass} />;
      default: 
        return <Bell className={iconClass} />;
    }
  };

  const getNotificationGradient = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ACHIEVEMENT: 
        return 'from-yellow-400 to-orange-500';
      case NotificationType.WORKOUT: 
        return 'from-green-400 to-emerald-500';
      case NotificationType.STREAK: 
        return 'from-orange-400 to-red-500';
      case NotificationType.BOOKING_CONFIRMED:
        return 'from-blue-400 to-cyan-500';
      case NotificationType.BOOKING_CANCELLED:
        return 'from-red-400 to-rose-500';
      case NotificationType.COACH_MESSAGE:
        return 'from-purple-400 to-pink-500';
      case NotificationType.PROGRAM_UPDATE:
        return 'from-indigo-400 to-blue-500';
      default: 
        return 'from-gray-400 to-slate-500';
    }
  };

  if (loading) {
    return <LoadingState message="Đang tải thông báo..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg">
                  <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Thông Báo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Quản lý tất cả thông báo của bạn
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={loading || unreadCount === 0}
                variant="outline"
                className="border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{notifications.length}</p>
                <p className="text-sm text-blue-100">Tổng thông báo</p>
              </div>
            </Card>
            
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <X className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{unreadCount}</p>
                <p className="text-sm text-orange-100">Chưa đọc</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {["All", "Unread"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {tab === 'All' ? 'Tất cả' : 'Chưa đọc'}
                {tab === 'Unread' && unreadCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab 
                      ? "bg-white/20 text-white" 
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="text-center py-16 px-4">
                <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-3xl mb-4">
                  <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {activeTab === 'Unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {activeTab === 'Unread' 
                    ? 'Bạn đã đọc hết tất cả thông báo. Tuyệt vời!' 
                    : 'Thông báo mới sẽ xuất hiện ở đây khi có cập nhật'}
                </p>
              </div>
            </Card>
          ) : (
            filteredNotifications.map((n) => (
              <Card
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  n.isRead 
                    ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800" 
                    : "bg-gradient-to-r from-orange-50/80 to-pink-50/80 dark:from-orange-950/30 dark:to-pink-950/30 border-l-4 border-orange-500 dark:border-orange-400 shadow-lg"
                }`}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Icon */}
                  <div className={`relative flex-shrink-0`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${getNotificationGradient(n.type)} rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${getNotificationGradient(n.type)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {getNotificationIcon(n.type)}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 dark:bg-orange-400 rounded-full border-2 border-white dark:border-gray-800 shadow-lg animate-pulse"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-base leading-relaxed mb-1.5 ${
                      n.isRead 
                        ? "text-gray-700 dark:text-gray-300" 
                        : "font-semibold text-gray-900 dark:text-white"
                    }`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full">
                          Mới
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all"
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(n.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Xóa thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
