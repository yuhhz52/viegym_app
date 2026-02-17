import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotificationType } from '@/services/api';

interface NotificationCardProps {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  onPress: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

export function NotificationCard({
  type,
  message,
  isRead,
  createdAt,
  onPress,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const colorScheme = useColorScheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getNotificationIcon = () => {
    switch (type) {
      case NotificationType.ACHIEVEMENT: return '🏆';
      case NotificationType.WORKOUT: return '💪';
      case NotificationType.STREAK: return '🔥';
      case NotificationType.SYSTEM: return '⚙️';
      case NotificationType.REMINDER: return '⏰';
      case NotificationType.SOCIAL: return '👥';
      case NotificationType.COACH_MESSAGE: return '💬';
      case NotificationType.BOOKING_CONFIRMED: return '✅';
      case NotificationType.BOOKING_CANCELLED: return '❌';
      case NotificationType.PROGRAM_UPDATE: return '📋';
      default: return '🔔';
    }
  };

  const getNotificationColor = () => {
    const colors = Colors[colorScheme ?? 'light'];
    switch (type) {
      case NotificationType.ACHIEVEMENT: return '#F59E0B';
      case NotificationType.WORKOUT: return colors.success;
      case NotificationType.STREAK: return colors.warning;
      case NotificationType.BOOKING_CONFIRMED: return colors.info;
      case NotificationType.BOOKING_CANCELLED: return colors.error;
      default: return colors.primary;
    }
  };

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

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: isRead ? colors.notificationBg : colors.notificationUnread,
            borderColor: colors.notificationBorder,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor() + '20' }]}>
          <Text style={styles.icon}>{getNotificationIcon()}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.message,
              { color: colors.text },
              !isRead && styles.unreadText,
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
          <Text style={[styles.time, { color: colors.tabIconDefault }]}>
            {getRelativeTime(createdAt)}
          </Text>
        </View>

        {/* Unread indicator */}
        {!isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    // Lyft-style shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
