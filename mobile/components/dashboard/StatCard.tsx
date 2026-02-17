import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const accentColor = color || colors.primary;

  return (
    <View style={[styles.card, { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      shadowColor: colors.shadowColor,
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.tabIconDefault }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
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
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
