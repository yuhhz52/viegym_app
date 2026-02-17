import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { workoutApi, type WorkoutProgramResponse, type ExerciseResponse, type CoachResponse } from '@/services/api';
import { ProgramCard } from '@/components/dashboard/ProgramCard';
import { router } from 'expo-router';

type TabType = 'exercises' | 'programs' | 'coaches';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<TabType>('exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Exercises state
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  
  // Programs state
  const [programs, setPrograms] = useState<WorkoutProgramResponse[]>([]);
  
  // Coaches state
  const [coaches, setCoaches] = useState<CoachResponse[]>([]);

  const muscleGroups = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'CHEST', label: 'Ngực' },
    { id: 'BACK', label: 'Lưng' },
    { id: 'LEGS', label: 'Chân' },
    { id: 'SHOULDERS', label: 'Vai' },
    { id: 'ARMS', label: 'Tay' },
    { id: 'ABS', label: 'Bụng' },
  ];

  const difficulties = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'BEGINNER', label: 'Mới bắt đầu' },
    { id: 'INTERMEDIATE', label: 'Trung bình' },
    { id: 'ADVANCED', label: 'Nâng cao' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, selectedMuscleGroup, selectedDifficulty]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'exercises') {
        const params: any = { page: 0, size: 50 };
        if (selectedMuscleGroup !== 'ALL') params.muscleGroup = selectedMuscleGroup;
        if (selectedDifficulty !== 'ALL') params.difficulty = selectedDifficulty;
        
        const response = await workoutApi.getExercises(params);
        console.log('[Explore] Exercises response:', response);
        setExercises(response.data || []);
      } else if (activeTab === 'programs') {
        const data = await workoutApi.getAllPrograms();
        setPrograms(data || []);
      } else if (activeTab === 'coaches') {
        const data = await workoutApi.getCoaches();
        setCoaches(data || []);
      }
    } catch (error) {
      console.error('[Explore] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs.filter((prog) =>
    (prog.title || prog.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoaches = coaches.filter((coach) =>
    coach.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get placeholder image for exercise
  const getExercisePlaceholder = (muscleGroup?: string) => {
    const placeholders: { [key: string]: string } = {
      'CHEST': '🏋️',
      'BACK': '💪',
      'LEGS': '🦵',
      'SHOULDERS': '🤸',
      'ARMS': '💪',
      'ABS': '🔥',
    };
    return placeholders[muscleGroup || ''] || '💪';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header with Actions */}
      <View style={styles.compactHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Khám phá</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={20} color={colors.text} />
          </Pressable>
          {activeTab === 'exercises' && (
            <Pressable 
              style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={20} color={colors.text} />
              {(selectedMuscleGroup !== 'ALL' || selectedDifficulty !== 'ALL') && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs - Compact */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'exercises' && { backgroundColor: colors.primary },
            activeTab !== 'exercises' && { backgroundColor: colors.cardBackground }
          ]}
          onPress={() => setActiveTab('exercises')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'exercises' ? '#FFFFFF' : colors.text }
          ]}>
            Bài tập
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.tab,
            activeTab === 'programs' && { backgroundColor: colors.primary },
            activeTab !== 'programs' && { backgroundColor: colors.cardBackground }
          ]}
          onPress={() => setActiveTab('programs')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'programs' ? '#FFFFFF' : colors.text }
          ]}>
            Chương trình
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.tab,
            activeTab === 'coaches' && { backgroundColor: colors.primary },
            activeTab !== 'coaches' && { backgroundColor: colors.cardBackground }
          ]}
          onPress={() => setActiveTab('coaches')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'coaches' ? '#FFFFFF' : colors.text }
          ]}>
            HLV
          </Text>
        </Pressable>
      </View>

      {/* Collapsible Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }]}>
            <Ionicons name="search" size={18} color={colors.tabIconDefault} style={styles.searchIconNew} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Tìm ${activeTab === 'exercises' ? 'bài tập' : activeTab === 'programs' ? 'chương trình' : 'HLV'}...`}
              placeholderTextColor={colors.tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.tabIconDefault} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Active Filters Display */}
      {activeTab === 'exercises' && (selectedMuscleGroup !== 'ALL' || selectedDifficulty !== 'ALL') && !showFilters && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
            {selectedMuscleGroup !== 'ALL' && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {muscleGroups.find(g => g.id === selectedMuscleGroup)?.label}
                </Text>
                <Pressable onPress={() => setSelectedMuscleGroup('ALL')}>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {selectedDifficulty !== 'ALL' && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {difficulties.find(d => d.id === selectedDifficulty)?.label}
                </Text>
                <Pressable onPress={() => setSelectedDifficulty('ALL')}>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFilters(false)} />
          <View style={[styles.filterModal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Bộ lọc</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Muscle Group Filter */}
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Nhóm cơ</Text>
              <View style={styles.filterGrid}>
                {muscleGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    onPress={() => setSelectedMuscleGroup(group.id)}
                    style={[
                      styles.filterGridItem,
                      {
                        backgroundColor: selectedMuscleGroup === group.id 
                          ? colors.primary 
                          : colors.cardBackground,
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.filterGridText,
                      { color: selectedMuscleGroup === group.id ? '#FFFFFF' : colors.text }
                    ]}>
                      {group.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Difficulty Filter */}
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Độ khó</Text>
              <View style={styles.filterGrid}>
                {difficulties.map((diff) => (
                  <Pressable
                    key={diff.id}
                    onPress={() => setSelectedDifficulty(diff.id)}
                    style={[
                      styles.filterGridItem,
                      {
                        backgroundColor: selectedDifficulty === diff.id 
                          ? colors.primary 
                          : colors.cardBackground,
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.filterGridText,
                      { color: selectedDifficulty === diff.id ? '#FFFFFF' : colors.text }
                    ]}>
                      {diff.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.resetButton, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedMuscleGroup('ALL');
                  setSelectedDifficulty('ALL');
                }}
              >
                <Text style={[styles.resetButtonText, { color: colors.text }]}>Xóa bộ lọc</Text>
              </Pressable>
              <Pressable
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Đang tải...</Text>
        ) : (
          <>
            {/* Exercises List - Horizontal Cards */}
            {activeTab === 'exercises' && (
              <View style={styles.listContainer}>
                {filteredExercises.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                    Không tìm thấy bài tập nào
                  </Text>
                ) : (
                  filteredExercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      style={[styles.exerciseCardHorizontal, { 
                        backgroundColor: colors.cardBackground, 
                        borderColor: colors.border 
                      }]}
                      onPress={() => {
                        console.log('[Explore] Navigating to exercise:', exercise.id);
                        // Use dynamic route format like community-post-[id]
                        router.push({
                          pathname: '/exercise-detail-[id]',
                          params: { id: exercise.id }
                        } as any);
                      }}
                    >
                      {/* Exercise Image - Compact */}
                      {exercise.thumbnailUrl || exercise.mediaList?.[0]?.url ? (
                        <Image 
                          source={{ uri: exercise.thumbnailUrl || exercise.mediaList[0].url }} 
                          style={styles.exerciseImageHorizontal}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.exercisePlaceholderHorizontal, { 
                          backgroundColor: colors.primary + '15',
                        }]}>
                          <Text style={styles.exercisePlaceholderTextHorizontal}>
                            {getExercisePlaceholder(exercise.muscleGroup)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.cardContentHorizontal}>
                        <View style={styles.cardInfo}>
                          <Text style={[styles.cardTitleHorizontal, { color: colors.text }]} numberOfLines={1}>
                            {exercise.name}
                          </Text>
                          {exercise.description && (
                            <Text 
                              style={[styles.cardDescriptionHorizontal, { color: colors.tabIconDefault }]}
                              numberOfLines={2}
                            >
                              {exercise.description}
                            </Text>
                          )}
                        </View>
                        <View style={styles.cardTagsHorizontal}>
                          {exercise.muscleGroup && (
                            <View style={[styles.tagSmall, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.tagTextSmall, { color: colors.primary }]}>
                                {exercise.muscleGroup}
                              </Text>
                            </View>
                          )}
                          {exercise.difficulty && (
                            <View style={[styles.tagSmall, { backgroundColor: colors.border }]}>
                              <Text style={[styles.tagTextSmall, { color: colors.text }]}>
                                {exercise.difficulty}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {/* Programs List */}
            {activeTab === 'programs' && (
              <View style={styles.listContainer}>
                {filteredPrograms.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                    Không tìm thấy chương trình nào
                  </Text>
                ) : (
                  filteredPrograms.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      variant="horizontal"
                      onPress={() => {
                        console.log('[Explore] Navigating to program:', program.id);
                        try {
                          // Try using href string format
                          const href = `/program-detail?id=${program.id}` as any;
                          console.log('[Explore] Using href:', href);
                          router.push(href);
                        } catch (error) {
                          console.error('[Explore] Navigation error:', error);
                          // Fallback: try object format
                          router.push({
                            pathname: '/program-detail',
                            params: { id: program.id }
                          } as any);
                        }
                      }}
                    />
                  ))
                )}
              </View>
            )}

            {/* Coaches List */}
            {activeTab === 'coaches' && (
              <View style={styles.listContainer}>
                {filteredCoaches.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                    Không tìm thấy huấn luyện viên nào
                  </Text>
                ) : (
                  filteredCoaches.map((coach) => (
                    <Pressable
                      key={coach.id}
                      style={[styles.coachCard, { 
                        backgroundColor: colors.cardBackground, 
                        borderColor: colors.border 
                      }]}
                      onPress={() => {
                        // Navigate to coach detail
                      }}
                    >
                      <View style={styles.coachAvatar}>
                        {coach.avatarUrl ? (
                          <Image 
                            source={{ uri: coach.avatarUrl }} 
                            style={styles.coachAvatarImage}
                          />
                        ) : (
                          <View style={[styles.coachAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.coachAvatarText}>
                              {coach.fullName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.coachInfo}>
                        <Text style={[styles.coachName, { color: colors.text }]}>
                          {coach.fullName}
                        </Text>
                        {coach.specialization && (
                          <Text style={[styles.coachSpec, { color: colors.tabIconDefault }]}>
                            {coach.specialization}
                          </Text>
                        )}
                        {coach.bio && (
                          <Text 
                            style={[styles.coachBio, { color: colors.tabIconDefault }]}
                            numberOfLines={2}
                          >
                            {coach.bio}
                          </Text>
                        )}
                        <View style={styles.coachStats}>
                          {coach.experienceYears !== undefined && (
                            <Text style={[styles.coachStat, { color: colors.primary }]}>
                              {coach.experienceYears} năm kinh nghiệm
                            </Text>
                          )}
                          {coach.clientCount !== undefined && (
                            <Text style={[styles.coachStat, { color: colors.tabIconDefault }]}>
                              • {coach.clientCount} học viên
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIconNew: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  activeFiltersBar: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  // Horizontal Exercise Cards
  exerciseCardHorizontal: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    height: 100,
  },
  exerciseImageHorizontal: {
    width: 100,
    height: 100,
  },
  exercisePlaceholderHorizontal: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePlaceholderTextHorizontal: {
    fontSize: 32,
  },
  cardContentHorizontal: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleHorizontal: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescriptionHorizontal: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  cardTagsHorizontal: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingTop: 4,
  },
  tagSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Filter Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterGridItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterGridText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coachCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  coachAvatar: {
    marginRight: 12,
  },
  coachAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  coachAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  coachSpec: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  coachBio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  coachStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachStat: {
    fontSize: 11,
    fontWeight: '500',
  },
});
