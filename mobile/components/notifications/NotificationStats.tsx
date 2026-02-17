import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NotificationStatsProps {
  total: number;
  unread: number;
  achievements: number;
}

export function NotificationStats({ total, unread, achievements }: NotificationStatsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const stats = [
    {
      icon: '🔔',
      value: total,
      label: 'Tổng số',
      color: colors.info,
    },
    {
      icon: '📬',
      value: unread,
      label: 'Chưa đọc',
      color: colors.primary,
    },
    {
      icon: '🏆',
      value: achievements,
      label: 'Thành tựu',
      color: colors.warning,
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: stat.color + '20' }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
          <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    // Lyft-style shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
