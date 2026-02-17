import { StyleSheet, ScrollView, View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { workoutApi, type ExerciseResponse } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ExerciseDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ id: string | string[] }>();
  
  console.log('🔍 [ExerciseDetail] ========== Component mounted ==========');
  console.log('🔍 [ExerciseDetail] Raw params:', JSON.stringify(params, null, 2));
  console.log('🔍 [ExerciseDetail] All params keys:', Object.keys(params));
  
  // Handle id as string or array
  const exerciseId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  console.log('🔍 [ExerciseDetail] Extracted id:', exerciseId);
  console.log('🔍 [ExerciseDetail] id type:', typeof exerciseId);
  console.log('🔍 [ExerciseDetail] id is undefined?', exerciseId === undefined);
  console.log('🔍 [ExerciseDetail] id is null?', exerciseId === null);
  
  const [exercise, setExercise] = useState<ExerciseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [ExerciseDetail] useEffect triggered, exerciseId:', exerciseId);
    if (exerciseId) {
      loadExercise();
    } else {
      console.warn('⚠️ [ExerciseDetail] No exerciseId, setting loading to false');
      setLoading(false);
    }
  }, [exerciseId]);

  const loadExercise = async () => {
    if (!exerciseId) {
      console.error('[ExerciseDetail] No exercise ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[ExerciseDetail] Loading exercise:', exerciseId);
      const data = await workoutApi.getExercise(exerciseId);
      console.log('[ExerciseDetail] Loaded:', data);
      setExercise(data);
    } catch (error) {
      console.error('[ExerciseDetail] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.tabIconDefault }]}>
            Không tìm thấy bài tập
          </Text>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.headerButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết bài tập</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {exercise.mediaList?.[0]?.url ? (
          <Image 
            source={{ uri: exercise.mediaList[0].url }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.heroPlaceholderText, { color: colors.primary }]}>
              {exercise.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentPadding}>
          {/* Title & Tags */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>{exercise.name}</Text>
            
            <View style={styles.tags}>
              {exercise.muscleGroup && (
                <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {exercise.muscleGroup}
                  </Text>
                </View>
              )}
              {exercise.difficulty && (
                <View style={[styles.tag, { backgroundColor: colors.secondary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.secondary }]}>
                    {exercise.difficulty}
                  </Text>
                </View>
              )}
              {exercise.equipment && (
                <View style={[styles.tag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {exercise.equipment}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {exercise.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {exercise.description}
              </Text>
            </View>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Hướng dẫn</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {exercise.instructions}
              </Text>
            </View>
          )}

          {/* Media Gallery */}
          {exercise.mediaList && exercise.mediaList.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Hình ảnh</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                {exercise.mediaList.map((media, index) => (
                  <Image 
                    key={index}
                    source={{ uri: media.url }} 
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  heroPlaceholder: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 64,
    fontWeight: '700',
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  gallery: {
    marginTop: 8,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
  },
});
