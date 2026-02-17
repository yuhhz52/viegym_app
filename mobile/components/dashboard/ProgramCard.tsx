import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutProgramResponse } from '@/services/api';

interface ProgramCardProps {
  program: WorkoutProgramResponse;
  onPress?: () => void;
  width?: number | string;
  variant?: 'horizontal' | 'vertical';
}

export function ProgramCard({ program, onPress, width, variant = 'vertical' }: ProgramCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const programTitle = program?.title || program?.name || 'Chương trình tập';
  const exerciseCount = program?.exercises?.length || 0;
  const duration = program?.duration || program?.durationWeeks || 4;
  const difficulty = program?.difficulty || program?.level || 'Medium';

  // Get placeholder gradient color
  const getPlaceholderColor = () => {
    const colorOptions = [
      { bg: '#FF6B6B', icon: '🔥' },
      { bg: '#4ECDC4', icon: '💪' },
      { bg: '#45B7D1', icon: '🏋️' },
      { bg: '#FFA07A', icon: '⚡' },
      { bg: '#98D8C8', icon: '🎯' },
      { bg: '#F7DC6F', icon: '⭐' },
    ];
    const index = programTitle.length % colorOptions.length;
    return colorOptions[index];
  };

  // Get image URL - same as web (check mediaList first)
  const imageUrl = program?.mediaList?.[0]?.url || program?.imageUrl || program?.thumbnailUrl;
  const placeholder = getPlaceholderColor();

  if (variant === 'horizontal') {
    return (
      <Pressable 
        style={[styles.horizontalCard, { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        }]}
        onPress={onPress}
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }}
            style={styles.horizontalImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.horizontalPlaceholder, { backgroundColor: placeholder.bg }]}>
            <Text style={styles.placeholderEmoji}>
              {placeholder.icon}
            </Text>
          </View>
        )}
        <View style={styles.horizontalContent}>
          <Text style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
            {programTitle}
          </Text>
          {program?.description && (
            <Text style={[styles.horizontalDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
              {program.description}
            </Text>
          )}
          <View style={styles.horizontalMeta}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { color: colors.tabIconDefault }]}>
                {exerciseCount} bài tập
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { color: colors.tabIconDefault }]}>
                {duration} tuần
              </Text>
            </View>
            <View style={[styles.difficultyBadge, { 
              backgroundColor: difficulty === 'ADVANCED' ? colors.error + '20' : 
                              difficulty === 'BEGINNER' ? colors.success + '20' : 
                              colors.warning + '20'
            }]}>
              <Text style={[styles.difficultyText, { 
                color: difficulty === 'ADVANCED' ? colors.error : 
                       difficulty === 'BEGINNER' ? colors.success : 
                       colors.warning
              }]}>
                {difficulty}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  // Vertical variant (default)
  const cardStyles: any[] = [
    styles.card,
    { backgroundColor: colors.cardBackground, borderColor: colors.border },
  ];

  if (width) {
    cardStyles.push({ width });
  }

  return (
    <Pressable style={cardStyles} onPress={onPress}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: placeholder.bg }]}>
          <Text style={styles.placeholderEmoji}>
            {placeholder.icon}
          </Text>
          <Text style={styles.placeholderTitle} numberOfLines={2}>
            {programTitle}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {programTitle}
        </Text>
        {program?.description && (
          <Text style={[styles.description, { color: colors.tabIconDefault }]} numberOfLines={2}>
            {program.description}
          </Text>
        )}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.stat, { color: colors.tabIconDefault }]}>
              {exerciseCount} bài tập • {duration} tuần
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    gap: 4,
  },
  stat: {
    fontSize: 11,
    fontWeight: '500',
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
    height: 120,
  },
  horizontalImage: {
    width: 120,
    height: 120,
  },
  horizontalPlaceholder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  horizontalDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
