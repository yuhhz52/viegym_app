import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { workoutApi, type WorkoutSessionResponse, type SessionExerciseLogResponse, type ExerciseResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ActiveWorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [session, setSession] = useState<WorkoutSessionResponse | null>(null);
  const [logs, setLogs] = useState<SessionExerciseLogResponse[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);
  const [editingLogs, setEditingLogs] = useState<{ [logId: string]: SessionExerciseLogResponse }>({});
  const [updatingLogs, setUpdatingLogs] = useState<Set<string>>(new Set());
  const updateTimeouts = React.useRef<{ [logId: string]: number }>({});
  const [exerciseNames, setExerciseNames] = useState<{ [exerciseId: string]: string }>({});

  // Load active workout from storage
  useEffect(() => {
    loadActiveWorkout();
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const loadActiveWorkout = async () => {
    try {
      setLoading(true);
      
      // Try to load from AsyncStorage
      const savedWorkout = await AsyncStorage.getItem('activeWorkout');
      const savedStartTime = await AsyncStorage.getItem('workoutStartTime');
      
      if (savedWorkout && savedStartTime) {
        const workoutData = JSON.parse(savedWorkout);
        const startTimeValue = parseInt(savedStartTime);
        
        // Verify session still exists on server
        try {
          const serverSession = await workoutApi.getSessionById(workoutData.id);
          setSession(serverSession);
          setStartTime(startTimeValue);
          
          // Load logs
          await loadLogs(serverSession.id);
        } catch (err) {
          console.error('Active workout no longer accessible:', err);
          // Clear invalid workout
          await AsyncStorage.multiRemove(['activeWorkout', 'workoutStartTime']);
          Alert.alert('Thông báo', 'Buổi tập trước đó không còn khả dụng. Vui lòng bắt đầu buổi tập mới.');
          router.back();
        }
      } else {
        // No active workout, go back
        Alert.alert('Thông báo', 'Không có buổi tập đang hoạt động.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading active workout:', error);
      Alert.alert('Lỗi', 'Không thể tải buổi tập.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (sessionId: string) => {
    try {
      const logsData = await workoutApi.getLogsBySession(sessionId);
      setLogs(logsData || []);
      
      // Fetch exercise names if we have logs
      if (logsData && logsData.length > 0) {
        await loadExerciseNames(logsData);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    }
  };

  const loadExerciseNames = async (logsData: SessionExerciseLogResponse[]) => {
    try {
      // Get unique exercise IDs
      const exerciseIds = [...new Set(logsData.map(log => log.exerciseId))];
      
      // Check if we already have names for all exercises
      const missingIds = exerciseIds.filter(id => !exerciseNames[id] && !logsData.find(l => l.exerciseId === id && l.exercise?.name));
      
      if (missingIds.length > 0) {
        // Fetch all exercises to get names
        const allExercises = await workoutApi.getAllExercises();
        const names: { [key: string]: string } = { ...exerciseNames };
        
        allExercises.forEach(ex => {
          if (exerciseIds.includes(ex.id)) {
            names[ex.id] = ex.name;
          }
        });
        
        // Also use names from logs if available
        logsData.forEach(log => {
          if (log.exercise?.name && !names[log.exerciseId]) {
            names[log.exerciseId] = log.exercise.name;
          }
        });
        
        setExerciseNames(names);
      } else {
        // Use names from logs
        const names: { [key: string]: string } = { ...exerciseNames };
        logsData.forEach(log => {
          if (log.exercise?.name && !names[log.exerciseId]) {
            names[log.exerciseId] = log.exercise.name;
          }
        });
        setExerciseNames(names);
      }
    } catch (error) {
      console.error('Error loading exercise names:', error);
      // Fallback: use names from logs
      const names: { [key: string]: string } = { ...exerciseNames };
      logsData.forEach(log => {
        if (log.exercise?.name && !names[log.exerciseId]) {
          names[log.exerciseId] = log.exercise.name;
        }
      });
      setExerciseNames(names);
    }
  };

  const loadExercises = async () => {
    try {
      const data = await workoutApi.getAllExercises();
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setExercises([]);
    }
  };

  const handleAddExercise = async () => {
    if (!session || !selectedExercise) {
      Alert.alert('Lỗi', 'Vui lòng chọn bài tập');
      return;
    }

    try {
      setAddingExercise(true);
      
      // Get existing logs to determine next set number
      const existingLogs = await workoutApi.getLogsBySession(session.id);
      const exerciseLogs = existingLogs.filter(log => log.exerciseId === selectedExercise);
      const nextSetNumber = exerciseLogs.length > 0 
        ? (exerciseLogs[exerciseLogs.length - 1].setNumber || 0) + 1 
        : 1;

      // Create log with default values
      console.log('[ActiveWorkout] Creating log for exercise:', selectedExercise, 'setNumber:', nextSetNumber);
      await workoutApi.createLog(session.id, {
        exerciseId: selectedExercise,
        setNumber: nextSetNumber,
        repsDone: 0,
        weightUsed: 0,
        completed: false,
      });
      console.log('[ActiveWorkout] Exercise log created successfully');

      // Reload logs
      await loadLogs(session.id);
      
      // Close modal and reset
      setShowAddExercise(false);
      setSelectedExercise('');
      setSearchTerm('');
      
      Alert.alert('Thành công', 'Đã thêm bài tập vào buổi tập');
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi thêm bài tập. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setAddingExercise(false);
    }
  };

  // Update log value with debouncing
  const updateLogValue = async (logId: string, updates: Partial<SessionExerciseLogResponse>) => {
    // Clear existing timeout for this log
    if (updateTimeouts.current[logId]) {
      clearTimeout(updateTimeouts.current[logId]);
    }

    // Update local state immediately for responsive UI
    setEditingLogs(prev => {
      const currentLog = prev[logId] || logs.find(l => l.id === logId);
      if (!currentLog) return prev;
      
      const updated = {
        ...prev,
        [logId]: { ...currentLog, ...updates }
      };
      
      // Set timeout to update server after 500ms of no changes
      updateTimeouts.current[logId] = setTimeout(async () => {
        try {
          setUpdatingLogs(prev => new Set(prev).add(logId));
          const logToUpdate = updated[logId];
          if (!logToUpdate) return;

          const originalLog = logs.find(l => l.id === logId);
          if (!originalLog) return;

          const updateData: any = {
            exerciseId: originalLog.exerciseId,
            setNumber: originalLog.setNumber || logToUpdate.setNumber,
          };

          // Include all fields to maintain data integrity - use logToUpdate values
          if (logToUpdate.repsDone !== undefined && logToUpdate.repsDone !== null) {
            updateData.repsDone = logToUpdate.repsDone;
          } else if (originalLog.repsDone !== undefined && originalLog.repsDone !== null) {
            updateData.repsDone = originalLog.repsDone;
          }
          
          if (logToUpdate.weightUsed !== undefined && logToUpdate.weightUsed !== null) {
            updateData.weightUsed = logToUpdate.weightUsed;
          } else if (originalLog.weightUsed !== undefined && originalLog.weightUsed !== null) {
            updateData.weightUsed = originalLog.weightUsed;
          }
          
          if (logToUpdate.completed !== undefined) {
            updateData.completed = logToUpdate.completed;
          } else if (originalLog.completed !== undefined) {
            updateData.completed = originalLog.completed;
          }
          
          if (logToUpdate.durationSeconds !== undefined && logToUpdate.durationSeconds !== null) {
            updateData.durationSeconds = logToUpdate.durationSeconds;
          } else if (originalLog.durationSeconds !== undefined && originalLog.durationSeconds !== null) {
            updateData.durationSeconds = originalLog.durationSeconds;
          }
          
          if (logToUpdate.distanceMeters !== undefined && logToUpdate.distanceMeters !== null) {
            updateData.distanceMeters = logToUpdate.distanceMeters;
          } else if (originalLog.distanceMeters !== undefined && originalLog.distanceMeters !== null) {
            updateData.distanceMeters = originalLog.distanceMeters;
          }

          console.log('[ActiveWorkout] Updating log:', logId, updateData);
          await workoutApi.updateExerciseLog(logId, updateData);
          // Reload logs to get updated volume
          await loadLogs(session!.id);
        } catch (err: any) {
          console.error('Error updating log:', err);
          const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật. Vui lòng thử lại.';
          Alert.alert('Lỗi', errorMessage);
          // Revert to original value on error
          const originalLog = logs.find(l => l.id === logId);
          if (originalLog) {
            setEditingLogs(prev => ({
              ...prev,
              [logId]: { ...originalLog }
            }));
          }
        } finally {
          setUpdatingLogs(prev => {
            const newSet = new Set(prev);
            newSet.delete(logId);
            return newSet;
          });
        }
      }, 500);
      
      return updated;
    });
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const finishWorkout = async () => {
    if (!session) return;

    Alert.alert(
      'Hoàn thành tập luyện?',
      'Bạn có chắc chắn muốn kết thúc buổi tập này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Hoàn thành', 
          onPress: async () => {
            try {
              setFinishing(true);
              
              // Flush all pending updates first (don't block on errors)
              try {
                console.log('[ActiveWorkout] Flushing pending updates before finishing...');
                await flushPendingUpdates();
                // Refresh logs to get latest state
                await loadLogs(session.id);
              } catch (flushError) {
                console.warn('[ActiveWorkout] Error flushing updates, continuing anyway:', flushError);
                // Continue even if flush fails
              }
              
              // Refresh session from server first to ensure ownership
              let currentSession = session;
              try {
                currentSession = await workoutApi.getSessionById(session.id);
              } catch (err: any) {
                if (err?.status === 403 || err?.status === 404) {
                  // Session no longer accessible
                  await AsyncStorage.multiRemove(['activeWorkout', 'workoutStartTime']);
                  Alert.alert('Thông báo', 'Buổi tập không còn khả dụng.');
                  router.back();
                  return;
                }
                throw err;
              }
              
              // Calculate actual duration in minutes
              const durationMinutes = Math.floor(elapsedTime / 60) || 1; // At least 1 minute
              
              // Update session with actual duration
              const updateData: {
                programId?: string;
                sessionDate: string;
                durationMinutes: number;
                notes?: string;
              } = {
                sessionDate: session.sessionDate,
                durationMinutes: durationMinutes,
              };
              
              // Only include optional fields if they exist
              if (currentSession.programId) {
                updateData.programId = currentSession.programId;
              }
              if (currentSession.notes) {
                updateData.notes = currentSession.notes;
              }
              
              // Update session - backend will automatically calculate streak
              console.log('[ActiveWorkout] Updating session:', currentSession.id, 'with data:', updateData);
              await workoutApi.updateSession(currentSession.id, updateData);
              console.log('[ActiveWorkout] Session updated successfully');
              
              // Clear active workout from storage
              await AsyncStorage.multiRemove(['activeWorkout', 'workoutStartTime']);
              
              console.log('[ActiveWorkout] Workout finished, cleared storage');
              
              // Refresh user info to get updated streak
              await refreshAuth();
              
              Alert.alert(
                'Thành công!', 
                `Buổi tập hoàn thành! Thời gian: ${durationMinutes} phút`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error: any) {
              console.error('Error finishing workout:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi kết thúc buổi tập. Vui lòng thử lại.';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setFinishing(false);
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>
            Đang tải buổi tập...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Không có buổi tập đang hoạt động
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate completed sets from logs
  const completedSets = logs.filter(log => log.completed === true).length;
  const totalSets = logs.length;

  // Group logs by exercise
  const exerciseGroups: { [exerciseId: string]: SessionExerciseLogResponse[] } = {};
  logs.forEach(log => {
    if (!exerciseGroups[log.exerciseId]) {
      exerciseGroups[log.exerciseId] = [];
    }
    exerciseGroups[log.exerciseId].push(log);
  });

  // Use exercise names from state (already loaded)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.workoutName, { color: colors.text }]}>
            {session.notes || 'Buổi tập'}
          </Text>
          <Text style={[styles.workoutTime, { color: colors.tint }]}>
            ⏱️ {formatTime(elapsedTime)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.progressText, { color: colors.text + '80' }]}>
            {completedSets}/{totalSets} bài tập
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Exercise Button */}
        <Pressable
          style={[styles.addExerciseButton, { 
            backgroundColor: colors.primary,
            borderColor: colors.primary 
          }]}
          onPress={() => {
            loadExercises();
            setShowAddExercise(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addExerciseButtonText}>Thêm Bài Tập</Text>
        </Pressable>

        {logs.length === 0 ? (
          <Card style={StyleSheet.flatten([styles.exerciseCard, { backgroundColor: colors.text + '05' }])}>
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                Chưa có bài tập nào
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
                Thêm bài tập để bắt đầu tập luyện
              </Text>
            </View>
          </Card>
        ) : (
          Object.entries(exerciseGroups).map(([exerciseId, exerciseLogs]) => {
            const sortedLogs = [...exerciseLogs].sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));
            const exerciseName = exerciseNames[exerciseId] || `Bài tập ${exerciseId.slice(0, 8)}`;
            
            return (
              <Card key={exerciseId} style={StyleSheet.flatten([styles.exerciseCard, { backgroundColor: colors.text + '05' }])}>
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exerciseName}
                  </Text>
                  <Text style={[styles.exerciseSetCount, { color: colors.tabIconDefault }]}>
                    {sortedLogs.length} sets
                  </Text>
                </View>

                {/* Sets Header */}
                <View style={[styles.setsHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.setsHeaderText, { color: colors.tabIconDefault }]}>SET</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.tabIconDefault }]}>TRƯỚC</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.tabIconDefault }]}>TẠ (KG)</Text>
                  <Text style={[styles.setsHeaderText, { color: colors.tabIconDefault }]}>REPS</Text>
                  <View style={styles.setsHeaderText} />
                </View>

                {/* Sets List */}
                <View style={styles.setsContainer}>
                  {sortedLogs.map((log, index) => {
                    const editingLog = editingLogs[log.id] || log;
                    const isUpdating = updatingLogs.has(log.id);
                    const previousLog = index > 0 ? sortedLogs[index - 1] : null;
                    const previousEditingLog = previousLog ? (editingLogs[previousLog.id] || previousLog) : null;

                    return (
                      <View 
                        key={log.id} 
                        style={[
                          styles.setRow,
                          { 
                            backgroundColor: isUpdating ? colors.primary + '20' : colors.background,
                            borderColor: colors.border 
                          }
                        ]}
                      >
                        <Text style={[styles.setNumber, { color: colors.text }]}>
                          {log.setNumber || index + 1}
                        </Text>
                        
                        <Text style={[styles.previousSet, { color: colors.tabIconDefault }]}>
                          {previousEditingLog 
                            ? `${previousEditingLog.weightUsed || 0} × ${previousEditingLog.repsDone || 0}`
                            : '—'}
                        </Text>

                        <View style={styles.inputContainer}>
                          <TextInput
                            style={[
                              styles.setInput,
                              { 
                                borderColor: colors.border,
                                backgroundColor: colors.cardBackground,
                                color: colors.text
                              }
                            ]}
                            value={String(editingLog.weightUsed || 0)}
                            onChangeText={(text) => {
                              const value = Math.max(0, parseFloat(text) || 0);
                              updateLogValue(log.id, { weightUsed: value });
                            }}
                            keyboardType="numeric"
                            placeholder="Tạ (kg)"
                            placeholderTextColor={colors.tabIconDefault}
                            editable={!isUpdating}
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <TextInput
                            style={[
                              styles.setInput,
                              { 
                                borderColor: colors.border,
                                backgroundColor: colors.cardBackground,
                                color: colors.text
                              }
                            ]}
                            value={String(editingLog.repsDone || 0)}
                            onChangeText={(text) => {
                              const value = Math.max(0, parseInt(text) || 0);
                              updateLogValue(log.id, { repsDone: value });
                            }}
                            keyboardType="numeric"
                            placeholder="Reps"
                            placeholderTextColor={colors.tabIconDefault}
                            editable={!isUpdating}
                          />
                        </View>

                        <Pressable
                          style={[
                            styles.checkBox,
                            editingLog.completed ? styles.checkBoxCompleted : null,
                            editingLog.completed ? { backgroundColor: colors.primary } : { borderColor: colors.border }
                          ].filter(Boolean)}
                          onPress={() => {
                            if (!isUpdating) {
                              updateLogValue(log.id, { completed: !editingLog.completed });
                            }
                          }}
                          disabled={isUpdating}
                        >
                          {editingLog.completed && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </Card>
            );
          })
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { borderTopColor: colors.border }]}>
        <View style={styles.actionButtonsRow}>
          <Button
            title="Hủy"
            onPress={cancelWorkout}
            variant="outline"
            size="medium"
            style={styles.cancelButton}
            disabled={finishing}
          />
          <Button
            title={finishing ? "Đang lưu..." : "Kết Thúc Tập"}
            onPress={finishWorkout}
            variant="primary"
            size="medium"
            style={styles.finishButton}
            disabled={finishing}
          />
        </View>
      </View>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExercise}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddExercise(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Thêm Bài Tập
              </Text>
              <Pressable onPress={() => setShowAddExercise(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.tabIconDefault} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Tìm kiếm bài tập..."
                placeholderTextColor={colors.tabIconDefault}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
              {exercises
                .filter(ex => 
                  ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ex.muscleGroup?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(exercise => (
                  <Pressable
                    key={exercise.id}
                    style={[
                      styles.exerciseOption,
                      { 
                        backgroundColor: selectedExercise === exercise.id 
                          ? colors.primary + '20' 
                          : colors.background,
                        borderColor: selectedExercise === exercise.id 
                          ? colors.primary 
                          : colors.border
                      }
                    ]}
                    onPress={() => setSelectedExercise(exercise.id)}
                  >
                    <View style={styles.exerciseOptionContent}>
                      <Text style={[styles.exerciseOptionName, { color: colors.text }]}>
                        {exercise.name}
                      </Text>
                      {exercise.muscleGroup && (
                        <Text style={[styles.exerciseOptionMuscle, { color: colors.tabIconDefault }]}>
                          {exercise.muscleGroup}
                        </Text>
                      )}
                    </View>
                    {selectedExercise === exercise.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Hủy"
                onPress={() => {
                  setShowAddExercise(false);
                  setSelectedExercise('');
                  setSearchTerm('');
                }}
                variant="outline"
                size="large"
                style={styles.modalButton}
              />
              <Button
                title={addingExercise ? "Đang thêm..." : "Thêm"}
                onPress={handleAddExercise}
                variant="primary"
                size="large"
                style={styles.modalButton}
                disabled={!selectedExercise || addingExercise}
                loading={addingExercise}
              />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  restTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxCompleted: {
    borderColor: '#4CAF50',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  exerciseDetails: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
  },
  bottomActions: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
});