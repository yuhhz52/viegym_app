import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { workoutApi, type WorkoutSessionResponse, type SessionExerciseLogResponse, type WorkoutSessionRequest } from '@/services/api';
import { router } from 'expo-router';

type TabType = 'history' | 'active';

export default function WorkoutSessionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [sessions, setSessions] = useState<WorkoutSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStartWorkout, setShowStartWorkout] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSessionResponse | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchSessions = async () => {
    try {
      console.log('[WorkoutSessions] Fetching sessions...');
      const data = await workoutApi.getAllSessions();
      setSessions(data || []);
      console.log('[WorkoutSessions] Loaded', data?.length || 0, 'sessions');
    } catch (error) {
      console.error('[WorkoutSessions] Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, []);

  const handleStartWorkout = async () => {
    try {
      const newSession: WorkoutSessionRequest = {
        sessionDate: new Date().toISOString(),
        durationMinutes: 0,
        notes: workoutNotes.trim() || undefined,
      };

      console.log('[WorkoutSessions] Creating new session:', newSession);
      const createdSession = await workoutApi.createSession(newSession);
      console.log('[WorkoutSessions] Session created:', createdSession);

      // Save to AsyncStorage (like web uses localStorage)
      await AsyncStorage.setItem('activeWorkout', JSON.stringify(createdSession));
      await AsyncStorage.setItem('workoutStartTime', Date.now().toString());

      setActiveWorkout(createdSession);
      setActiveTab('active');
      setShowStartWorkout(false);
      setWorkoutNotes('');
      await fetchSessions();

      // Navigate to active workout screen
      router.push('/active-workout');
    } catch (error) {
      console.error('[WorkoutSessions] Error creating session:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu buổi tập. Vui lòng thử lại.');
    }
  };

  const handleSelectSession = (session: WorkoutSessionResponse) => {
    console.log('[WorkoutSessions] Selected session:', session);
    setSelectedSession(session);
    // TODO: Navigate to workout detail view
    router.push(`/workout-detail/${session.id}` as any);
  };

  const handleDeleteSession = async (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa buổi tập này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutApi.deleteSession(id);
              await fetchSessions();
              if (selectedSession?.id === id) {
                setSelectedSession(null);
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa buổi tập');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
      });
    }
  };

  const generateWorkoutName = (session: WorkoutSessionResponse) => {
    const sessionDate = new Date(session.sessionDate);
    const timeOfDay = sessionDate.getHours();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = dayNames[sessionDate.getDay()];
    
    let timePrefix = '';
    if (timeOfDay >= 5 && timeOfDay < 12) {
      timePrefix = 'Sáng';
    } else if (timeOfDay >= 12 && timeOfDay < 17) {
      timePrefix = 'Chiều';
    } else if (timeOfDay >= 17 && timeOfDay < 21) {
      timePrefix = 'Tối';
    } else {
      timePrefix = 'Đêm';
    }

    if (session.notes && session.notes.trim().length > 0) {
      return `${session.notes} - ${timePrefix}`;
    }

    return `${timePrefix} ${dayName}`;
  };

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: WorkoutSessionResponse[] } = {};
    sessions.forEach(session => {
      const dateKey = formatDate(session.sessionDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  };

  const todaySessions = sessions.filter(s => 
    new Date(s.sessionDate).toDateString() === new Date().toDateString()
  );
  
  const last7DaysSessions = sessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    const now = new Date();
    const diff = now.getTime() - sessionDate.getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Buổi Tập
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
            Ghi lại hành trình thể hình của bạn
          </Text>
        </View>
        <Pressable
          onPress={() => setShowStartWorkout(true)}
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          disabled={!!activeWorkout}
        >
          <Text style={styles.startButtonText}>
            {activeWorkout ? 'Đang Tập...' : 'Bắt Đầu Tập'}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'history' ? colors.primary : colors.tabIconDefault }
          ]}>
            Lịch Sử
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'active' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'active' ? colors.primary : colors.tabIconDefault }
          ]}>
            Đang Hoạt Động
          </Text>
        </Pressable>
      </View>

      {/* Quick Stats */}
      {activeTab === 'history' && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{todaySessions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Hôm nay</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{last7DaysSessions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>7 ngày qua</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{sessions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Tổng số</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Đang tải...
          </Text>
        ) : activeTab === 'history' ? (
          sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { color: colors.tabIconDefault }]}>[D]</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Chưa có buổi tập nào
              </Text>
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                Bắt đầu ghi lại hành trình thể hình của bạn
              </Text>
              <Pressable
                onPress={() => setShowStartWorkout(true)}
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyButtonText}>Tạo Buổi Tập Đầu Tiên</Text>
              </Pressable>
            </View>
          ) : (
            Object.entries(groupSessionsByDate())
              .sort(([dateA], [dateB]) => {
                const sessionsA = groupSessionsByDate()[dateA];
                const sessionsB = groupSessionsByDate()[dateB];
                return new Date(sessionsB[0].sessionDate).getTime() - new Date(sessionsA[0].sessionDate).getTime();
              })
              .map(([dateKey, dateSessions]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <Text style={[styles.dateHeader, { color: colors.tabIconDefault }]}>
                    {dateKey}
                  </Text>
                  {dateSessions.map((session) => (
                    <Pressable
                      key={session.id}
                      onPress={() => handleSelectSession(session)}
                      style={[styles.sessionCard, { 
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      }]}
                    >
                      <View style={styles.sessionHeader}>
                        <View style={[styles.sessionIcon, { backgroundColor: colors.primary }]}>
                          <Ionicons name="fitness" size={24} color="#FFFFFF" />
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={[styles.sessionName, { color: colors.text }]}>
                            {generateWorkoutName(session)}
                          </Text>
                          <Text style={[styles.sessionTime, { color: colors.tabIconDefault }]}>
                            {new Date(session.sessionDate).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.sessionStats}>
                        <View style={styles.sessionStat}>
                          <Text style={[styles.sessionStatValue, { color: colors.text }]}>
                            {session.durationMinutes}
                          </Text>
                          <Text style={[styles.sessionStatLabel, { color: colors.tabIconDefault }]}>
                            phút
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))
          )
        ) : (
          activeWorkout ? (
            <View style={[styles.activeWorkoutCard, { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.activeWorkoutTitle, { color: colors.text }]}>
                {generateWorkoutName(activeWorkout)}
              </Text>
              <Text style={[styles.activeWorkoutSubtitle, { color: colors.tabIconDefault }]}>
                Đang tiến hành
              </Text>
              <Pressable
                onPress={() => router.push('/active-workout')}
                style={[styles.continueButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.continueButtonText}>Tiếp Tục Tập</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyIcon, { color: colors.tabIconDefault }]}>[W]</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Không có buổi tập nào đang hoạt động
              </Text>
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                Bắt đầu buổi tập mới để theo dõi tiến độ
              </Text>
            </View>
          )
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Start Workout Modal */}
      <Modal
        visible={showStartWorkout}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartWorkout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Bắt Đầu Buổi Tập Mới
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              Thêm ghi chú cho buổi tập (tùy chọn)
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              }]}
              placeholder="Ví dụ: Upper Body, Push Day..."
              placeholderTextColor={colors.tabIconDefault}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowStartWorkout(false);
                  setWorkoutNotes('');
                }}
                style={[styles.modalButton, { backgroundColor: colors.border }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Hủy</Text>
              </Pressable>
              <Pressable
                onPress={handleStartWorkout}
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Bắt Đầu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  sessionStatValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeWorkoutCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeWorkoutSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
