import { StyleSheet, ScrollView, View, Text, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { workoutApi, type WorkoutSessionResponse, type SessionExerciseLogResponse } from '@/services/api';

const { width } = Dimensions.get('window');

interface ProgressStats {
  totalVolume: number;
  totalWorkouts: number;
  totalDuration: number;
  avgDuration: number;
  weeklyProgress: { week: string; volume: number; workouts: number; duration: number }[];
  recentSessions: WorkoutSessionResponse[];
  topExercises: { name: string; volume: number; frequency: number }[];
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedPeriod, setSelectedPeriod] = useState('3 Months');
  const [activeTab, setActiveTab] = useState('Volume');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [allLogs, setAllLogs] = useState<SessionExerciseLogResponse[]>([]);
  const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadProgressData();
  }, [selectedPeriod]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      console.log('[Progress] Loading data...');
      
      // Fetch all sessions
      const allSessions = await workoutApi.getAllSessions();
      console.log('[Progress] Total sessions:', allSessions.length);
      
      // Filter sessions based on time range
      const filteredSessions = filterSessionsByTimeRange(allSessions, selectedPeriod);
      console.log('[Progress] Filtered sessions:', filteredSessions.length);

      // Fetch logs for filtered sessions
      const logsPromises = filteredSessions.map(session => 
        workoutApi.getLogsBySession(session.id).catch(() => [])
      );
      const logsArrays = await Promise.all(logsPromises);
      const flatLogs = logsArrays.flat();
      setAllLogs(flatLogs);
      console.log('[Progress] Total logs:', flatLogs.length);

      // Fetch exercise names for better display
      try {
        const exercises = await workoutApi.getAllExercises();
        const namesMap: { [key: string]: string } = {};
        exercises.forEach(ex => {
          namesMap[ex.id] = ex.name;
        });
        setExerciseNames(namesMap);
        console.log('[Progress] Loaded exercise names:', Object.keys(namesMap).length);
      } catch (error) {
        console.error('[Progress] Failed to load exercise names:', error);
      }

      // Calculate statistics
      const calculatedStats = calculateProgressStats(filteredSessions, flatLogs);
      setStats(calculatedStats);
      console.log('[Progress] Stats calculated:', calculatedStats);
    } catch (error) {
      console.error('[Progress] Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessionsByTimeRange = (sessions: WorkoutSessionResponse[], range: string): WorkoutSessionResponse[] => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (range) {
      case '1 Month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3 Months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6 Months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1 Year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    
    return sessions.filter(session => new Date(session.sessionDate) >= cutoffDate);
  };

  const calculateProgressStats = (sessions: WorkoutSessionResponse[], logs: SessionExerciseLogResponse[]): ProgressStats => {
    const totalVolume = logs.reduce((sum, log) => sum + (log.volume || 0), 0);
    const totalWorkouts = sessions.length;
    const totalDuration = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Weekly progress (last 12 weeks)
    const weeklyProgress = generateWeeklyProgress(sessions, logs);
    
    // Recent sessions (last 10)
    const recentSessions = sessions
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(0, 10);

    // Top exercises by volume
    const topExercises = calculateTopExercises(logs);

    return {
      totalVolume,
      totalWorkouts,
      totalDuration,
      avgDuration,
      weeklyProgress,
      recentSessions,
      topExercises
    };
  };

  const generateWeeklyProgress = (sessions: WorkoutSessionResponse[], logs: SessionExerciseLogResponse[]) => {
    const weeks: { [key: string]: { volume: number; workouts: number; duration: number } } = {};
    
    sessions.forEach(session => {
      const date = new Date(session.sessionDate);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { volume: 0, workouts: 0, duration: 0 };
      }
      
      const sessionLogs = logs.filter(log => log.sessionId === session.id);
      const sessionVolume = sessionLogs.reduce((sum, log) => sum + (log.volume || 0), 0);
      
      weeks[weekKey].volume += sessionVolume;
      weeks[weekKey].workouts += 1;
      weeks[weekKey].duration += session.durationMinutes;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        ...data
      }));
  };

  const calculateTopExercises = (logs: SessionExerciseLogResponse[]) => {
    const exerciseStats: { [id: string]: { volume: number; frequency: number } } = {};
    
    logs.forEach(log => {
      if (!exerciseStats[log.exerciseId]) {
        exerciseStats[log.exerciseId] = { volume: 0, frequency: 0 };
      }
      exerciseStats[log.exerciseId].volume += log.volume || 0;
      exerciseStats[log.exerciseId].frequency += 1;
    });

    return Object.entries(exerciseStats)
      .map(([id, stats]) => ({
        name: exerciseNames[id] || `Bài tập`,
        volume: stats.volume,
        frequency: stats.frequency
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Tiến Độ Luyện Tập
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
          Theo dõi và phân tích kết quả tập luyện của bạn
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRangeScroll}>
            {['1 Month', '3 Months', '6 Months', '1 Year'].map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.timeRangeButton,
                  {
                    backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                    borderColor: selectedPeriod === period ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[
                  styles.timeRangeText,
                  { color: selectedPeriod === period ? '#FFFFFF' : colors.text }
                ]}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Đang tải dữ liệu tiến độ...
          </Text>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="barbell" size={24} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatVolume(stats?.totalVolume || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Tổng Volume (kg)
                </Text>
              </View>

              <View style={[styles.statCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#10B981' + '20' }]}>
                  <Ionicons name="fitness" size={24} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.totalWorkouts || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Buổi Tập
                </Text>
              </View>

              <View style={[styles.statCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Ionicons name="time" size={24} color="#8B5CF6" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDuration(stats?.totalDuration || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Tổng Thời Gian
                </Text>
              </View>

              <View style={[styles.statCard, { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B' + '20' }]}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  0
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  Chuỗi Ngày
                </Text>
              </View>
            </View>

            {/* Chart Tabs */}
            <View style={styles.chartTabsContainer}>
              <View style={[styles.chartTabs, { backgroundColor: colors.cardBackground }]}>
                {['Volume', 'Workouts', 'Duration'].map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.chartTab,
                      activeTab === tab && { backgroundColor: colors.background }
                    ]}
                  >
                    <Text style={[
                      styles.chartTabText,
                      { color: activeTab === tab ? colors.primary : colors.tabIconDefault }
                    ]}>
                      {tab}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Chart Placeholder */}
            <View style={[styles.chartCard, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {activeTab} Theo Tuần
              </Text>
              <View style={[styles.chartPlaceholder, { borderColor: colors.border }]}>
                <Text style={[styles.chartPlaceholderText, { color: colors.tabIconDefault }]}>
                  {stats?.weeklyProgress && stats.weeklyProgress.length > 0 
                    ? `${stats.weeklyProgress.length} tuần dữ liệu` 
                    : 'Chưa có dữ liệu'}
                </Text>
              </View>
            </View>

            {/* Top Exercises */}
            <View style={[styles.topExercisesCard, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Top Bài Tập
                </Text>
              </View>
              {stats?.topExercises && stats.topExercises.length > 0 ? (
                stats.topExercises.map((exercise, index) => (
                  <View key={exercise.name + index} style={[styles.exerciseRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.exerciseRank}>
                      <View style={[styles.rankBadge, { 
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.border 
                      }]}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {exercise.name}
                      </Text>
                      <Text style={[styles.exerciseStats, { color: colors.tabIconDefault }]}>
                        {exercise.frequency} lần • {formatVolume(exercise.volume)}kg
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={48} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                    Chưa có dữ liệu bài tập
                  </Text>
                </View>
              )}
            </View>

            {/* Recent Sessions */}
            <View style={[styles.recentSessionsCard, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Buổi Tập Gần Đây
                </Text>
              </View>
              {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                stats.recentSessions.map((session) => {
                  const sessionVolume = allLogs
                    .filter(log => log.sessionId === session.id)
                    .reduce((sum, log) => sum + (log.volume || 0), 0);
                  
                  return (
                    <View key={session.id} style={[styles.sessionRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.sessionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="fitness" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={[styles.sessionDate, { color: colors.text }]}>
                          {new Date(session.sessionDate).toLocaleDateString('vi-VN', { 
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </Text>
                        <Text style={[styles.sessionDetails, { color: colors.tabIconDefault }]}>
                          {formatDuration(session.durationMinutes)} • {formatVolume(sessionVolume)}kg
                        </Text>
                        {session.notes && (
                          <Text style={[styles.sessionNotes, { color: colors.tabIconDefault }]} numberOfLines={1}>
                            {session.notes}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                    Chưa có buổi tập nào
                  </Text>
                </View>
              )}
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  timeRangeContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  timeRangeScroll: {
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartTabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chartTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  chartTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  chartPlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  topExercisesCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  exerciseRank: {
    width: 32,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseStats: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentSessionsCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionNotes: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
  },
});