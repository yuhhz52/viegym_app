import { StyleSheet, ScrollView, View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { workoutApi, type WorkoutProgramResponse } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProgramDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ id: string | string[] }>();
  // Handle id as string or array
  const programId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [program, setProgram] = useState<WorkoutProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    if (!programId) {
      console.error('[ProgramDetail] No program ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[ProgramDetail] Loading program:', programId);
      const data = await workoutApi.getProgram(programId);
      console.log('[ProgramDetail] Loaded:', data);
      setProgram(data);
    } catch (error) {
      console.error('[ProgramDetail] Error:', error);
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

  if (!program) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.tabIconDefault }]}>
            Không tìm thấy chương trình
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết chương trình</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {program.imageUrl || program.mediaList?.[0]?.url ? (
          <Image 
            source={{ uri: program.imageUrl || program.mediaList[0].url }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="fitness" size={64} color={colors.primary} />
          </View>
        )}

        {/* Content */}
        <View style={styles.contentPadding}>
          {/* Title & Tags */}
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              {program.title || program.name}
            </Text>
            
            <View style={styles.tags}>
              {program.difficulty && (
                <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {program.difficulty}
                  </Text>
                </View>
              )}
              {program.level && (
                <View style={[styles.tag, { backgroundColor: colors.secondary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.secondary }]}>
                    {program.level}
                  </Text>
                </View>
              )}
              {program.goal && (
                <View style={[styles.tag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {program.goal}
                  </Text>
                </View>
              )}
              {program.durationWeeks && (
                <View style={[styles.tag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {program.durationWeeks} tuần
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {program.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {program.description}
              </Text>
            </View>
          )}

          {/* Creator Info */}
          {(program.creatorName || program.createdByName) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Người tạo</Text>
              <Text style={[styles.description, { color: colors.tabIconDefault }]}>
                {program.creatorName || program.createdByName}
              </Text>
            </View>
          )}

          {/* Exercises List */}
          {program.exercises && program.exercises.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Bài tập ({program.exercises.length})
              </Text>
              {program.exercises.map((exercise, index) => (
                <Pressable
                  key={exercise.id || index}
                  style={[styles.exerciseItem, { 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border 
                  }]}
                  onPress={() => {
                    if (exercise.id) {
                      router.push({
                        pathname: '/exercise-detail',
                        params: { id: exercise.id }
                      } as any);
                    }
                  }}
                >
                  <View style={styles.exerciseItemContent}>
                    <View style={styles.exerciseItemInfo}>
                      <Text style={[styles.exerciseItemName, { color: colors.text }]}>
                        {exercise.name}
                      </Text>
                      {exercise.muscleGroup && (
                        <Text style={[styles.exerciseItemMuscle, { color: colors.tabIconDefault }]}>
                          {exercise.muscleGroup}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Media Gallery */}
          {program.mediaList && program.mediaList.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Hình ảnh</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                {program.mediaList.map((media, index) => (
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
  exerciseItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseItemMuscle: {
    fontSize: 12,
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
