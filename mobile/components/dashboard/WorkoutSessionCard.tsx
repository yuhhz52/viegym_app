import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WorkoutSessionCardProps {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: number;
  volume: number;
  onPress?: () => void;
}

export function WorkoutSessionCard({ 
  name, 
  date, 
  duration, 
  exercises, 
  volume,
  onPress 
}: WorkoutSessionCardProps) {
  const colorScheme = useColorScheme();

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <Text style={styles.iconText}>💪</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.date, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {date}
          </Text>
        </View>
        <Text style={[styles.arrow, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          →
        </Text>
      </View>
      
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {duration}m
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Thời gian
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {exercises}
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Bài tập
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {(volume / 1000).toFixed(1)}K
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Volume
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  arrow: {
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
});
