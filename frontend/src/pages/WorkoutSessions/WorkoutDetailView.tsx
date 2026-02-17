import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Calendar, Trash2, Plus, TrendingUp, Pause, Play, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { WorkoutSessionResponse, SessionExerciseLogResponse } from './type';
import { AddExerciseModal } from './AddExerciseModal';
import * as workoutApi from './api';
import { getProgramExercisesAPI } from '@/api/programAPI';

interface WorkoutDetailViewProps {
  session: WorkoutSessionResponse;
  logs: SessionExerciseLogResponse[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  // Timer props for active workouts
  isActive?: boolean;
  elapsedTime?: number;
  isPaused?: boolean;
  onPauseResume?: () => void;
  onFinishWorkout?: () => void;
}

export const WorkoutDetailView = ({ 
  session, 
  logs, 
  onBack, 
  onDelete,
  onRefresh,
  isActive = false,
  elapsedTime = 0,
  isPaused = false,
  onPauseResume,
  onFinishWorkout
}: WorkoutDetailViewProps) => {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingLog, setEditingLog] = useState<SessionExerciseLogResponse | null>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});
  const [exerciseTypes, setExerciseTypes] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [editingLogs, setEditingLogs] = useState<{ [logId: string]: SessionExerciseLogResponse }>({});
  const [updatingLogs, setUpdatingLogs] = useState<Set<string>>(new Set());
  const updateTimeouts = useRef<{ [logId: string]: NodeJS.Timeout }>({});
  const [addingFromProgram, setAddingFromProgram] = useState(false);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format duration seconds to MM:SS
  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse MM:SS to seconds
  const parseDuration = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = Math.max(0, parseInt(parts[0]) || 0);
      const seconds = Math.max(0, parseInt(parts[1]) || 0);
      return minutes * 60 + seconds;
    }
    return Math.max(0, parseInt(timeString) || 0);
  };

  // Render completed tick button
  const renderCompletedTick = (log: SessionExerciseLogResponse) => {
    const currentLog = editingLogs[log.id] || log;
    const isCompleted = currentLog.completed ?? false;
    const isUpdating = updatingLogs.has(log.id);
    
    const handleTickClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Tick clicked for log:', log.id, 'Current completed:', isCompleted, 'Is updating:', isUpdating);
      
      if (isActive && !isUpdating) {
        const newCompleted = !isCompleted;
        console.log('Updating completed to:', newCompleted);
        updateLogValue(log.id, { completed: newCompleted });
      } else {
        console.log('Button is disabled, cannot update');
      }
    };
    
    return (
      <button
        onClick={handleTickClick}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative z-20 pointer-events-auto ${
          isCompleted
            ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md' 
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 active:bg-gray-500'
        } ${!isActive || isUpdating ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:scale-110'}`}
        disabled={!isActive || isUpdating}
        title={!isActive ? "Lịch sử - Không thể chỉnh sửa" : (isCompleted ? "Đã hoàn thành - Click để bỏ chọn" : "Chưa hoàn thành - Click để đánh dấu")}
        type="button"
        style={{ touchAction: 'manipulation' }}
      >
        <span className={`text-white text-sm font-bold select-none ${isCompleted ? '' : 'opacity-70'}`}>✓</span>
      </button>
    );
  };

  // Generate workout session name like Strong app
  const generateWorkoutName = (session: WorkoutSessionResponse) => {
    const sessionDate = new Date(session.sessionDate);
    const timeOfDay = sessionDate.getHours();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = dayNames[sessionDate.getDay()];
    
    // Time-based prefixes
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

    // Use notes if available and descriptive
    if (session.notes && session.notes.trim().length > 0) {
      const notes = session.notes.trim();
      // Common workout types that should be highlighted
      const workoutTypes = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'HIIT', 'Strength'];
      const foundType = workoutTypes.find(type => 
        notes.toLowerCase().includes(type.toLowerCase())
      );
      
      if (foundType) {
        return `${foundType} - ${timePrefix} ${dayName}`;
      } else if (notes.length <= 25) {
        return `${notes} - ${timePrefix}`;
      }
    }

    // Fallback to time-based naming
    return `${timePrefix} ${dayName}`;
  };

  // Validate session
  useEffect(() => {
    if (!session || !session.id) {
      setError('Session không hợp lệ');
      console.error('Invalid session:', session);
    }
  }, [session]);

  // Fetch tên bài tập khi component mount
  useEffect(() => {
    const fetchExerciseNames = async () => {
      try {
        const exercises = await workoutApi.getAllExercises();
        const names: { [key: string]: string } = {};
        const types: { [key: string]: string } = {};
        exercises.forEach(ex => {
          names[ex.id] = ex.name;
          types[ex.id] = ex.exerciseType || 'WEIGHT_AND_REPS';
        });
        setExerciseNames(names);
        setExerciseTypes(types);
      } catch (err) {
        console.error('Không thể tải tên bài tập:', err);
      }
    };
    fetchExerciseNames();
  }, []);

  // Initialize editing logs when logs change
  useEffect(() => {
    const initialEditingLogs: { [logId: string]: SessionExerciseLogResponse } = {};
    logs.forEach(log => {
      initialEditingLogs[log.id] = { ...log };
    });
    setEditingLogs(initialEditingLogs);
  }, [logs]);

  // Update completed field immediately (no debounce)
  const updateCompleted = async (logId: string, completed: boolean) => {
    const currentLog = editingLogs[logId] || logs.find(l => l.id === logId);
    if (!currentLog) return;

    // Update local state immediately
    setEditingLogs(prev => ({
      ...prev,
      [logId]: { ...(prev[logId] || currentLog), completed }
    }));

    try {
      setUpdatingLogs(prev => new Set(prev).add(logId));
      
      // Validate required fields
      if (!currentLog.exerciseId) {
        throw new Error('exerciseId is missing');
      }
      if (currentLog.setNumber === undefined || currentLog.setNumber === null) {
        throw new Error('setNumber is missing');
      }
      
      // Build update data with all current fields (same pattern as other updates)
      const updateData: any = {
        exerciseId: currentLog.exerciseId,
        setNumber: currentLog.setNumber,
        completed: completed,
      };

      // Include other existing fields to maintain data integrity
      if (currentLog.repsDone !== undefined && currentLog.repsDone !== null) {
        updateData.repsDone = currentLog.repsDone;
      }
      if (currentLog.weightUsed !== undefined && currentLog.weightUsed !== null) {
        updateData.weightUsed = currentLog.weightUsed;
      }
      if (currentLog.durationSeconds !== undefined && currentLog.durationSeconds !== null) {
        updateData.durationSeconds = currentLog.durationSeconds;
      }
      if (currentLog.distanceMeters !== undefined && currentLog.distanceMeters !== null) {
        updateData.distanceMeters = currentLog.distanceMeters;
      }
      if (currentLog.bodyWeight !== undefined && currentLog.bodyWeight !== null) {
        updateData.bodyWeight = currentLog.bodyWeight;
      }
      if (currentLog.setNotes !== undefined && currentLog.setNotes !== null) {
        updateData.setNotes = currentLog.setNotes;
      }

      console.log('Sending update data for completed:', JSON.stringify(updateData, null, 2));
      await workoutApi.updateLog(logId, updateData);
      // Don't call onRefresh immediately to avoid resetting the state
      // The state will be updated on next refresh
    } catch (err: any) {
      console.error('Không thể cập nhật completed:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error config:', err.config);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi cập nhật. Vui lòng thử lại.';
      console.error('Error message:', errorMessage);
      toast.error(errorMessage);
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
  };

  // Debounced update function
  const updateLogValue = async (logId: string, updates: Partial<SessionExerciseLogResponse>) => {
    // If updating completed, use the immediate update function
    if (updates.completed !== undefined) {
      updateCompleted(logId, updates.completed);
      return;
    }

    // Clear existing timeout for this log
    if (updateTimeouts.current[logId]) {
      clearTimeout(updateTimeouts.current[logId]);
    }

    // Update local state immediately for responsive UI
    setEditingLogs(prev => {
      const updated = {
        ...prev,
        [logId]: { ...(prev[logId] || logs.find(l => l.id === logId) || {}), ...updates }
      };
      
      // Set timeout to update server after 500ms of no changes
      updateTimeouts.current[logId] = setTimeout(async () => {
        try {
          setUpdatingLogs(prev => new Set(prev).add(logId));
          const currentLog = updated[logId];
          if (!currentLog) return;

          const updateData: any = {
            exerciseId: currentLog.exerciseId,
            setNumber: currentLog.setNumber,
          };

          // Include only changed fields - use currentLog values to ensure we get the latest state
          if (updates.weightUsed !== undefined) updateData.weightUsed = currentLog.weightUsed;
          if (updates.repsDone !== undefined) updateData.repsDone = currentLog.repsDone;
          if (updates.durationSeconds !== undefined) updateData.durationSeconds = currentLog.durationSeconds;
          if (updates.distanceMeters !== undefined) updateData.distanceMeters = currentLog.distanceMeters;
          if (updates.bodyWeight !== undefined) updateData.bodyWeight = currentLog.bodyWeight;

          await workoutApi.updateLog(logId, updateData);
          // Refresh logs to get updated volume
          onRefresh();
        } catch (err) {
          console.error('Không thể cập nhật log:', err);
          toast.error('Lỗi khi cập nhật. Vui lòng thử lại.');
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

  const groupLogsByExercise = () => {
    const grouped: { [exerciseId: string]: SessionExerciseLogResponse[] } = {};
    logs.forEach(log => {
      if (!grouped[log.exerciseId]) {
        grouped[log.exerciseId] = [];
      }
      grouped[log.exerciseId].push(log);
    });
    return grouped;
  };

  const calculateExerciseVolume = (exerciseLogs: SessionExerciseLogResponse[]) => {
    return exerciseLogs.reduce((total, log) => {
      return total + (log.volume || 0);
    }, 0);
  };

  const calculateTotalVolume = () => {
    return logs.reduce((total, log) => {
      return total + (log.volume || 0);
    }, 0);
  };

  const handleDeleteLog = async (logId: string) => {
    setDeleteLogId(logId);
  };
  
  const confirmDeleteLog = async () => {
    if (!deleteLogId) return;
    try {
      await workoutApi.deleteLog(deleteLogId);
      toast.success('Xóa set thành công');
      setDeleteLogId(null);
      onRefresh();
    } catch (err) {
      console.error('Không thể xóa log:', err);
      toast.error('Không thể xóa set. Vui lòng thử lại.');
    }
  };

  // Thêm exercises từ program vào workout (giống Strong app)
  const handleAddExercisesFromProgram = async () => {
    if (!session.programId) {
      toast.warning('Buổi tập này không có chương trình.');
      return;
    }
    
    console.log('Adding exercises from program:', session.programId);
    setAddingFromProgram(true);
    try {
      const programExercises = await getProgramExercisesAPI(session.programId);
      console.log('Program exercises received:', programExercises);
      
      if (!programExercises || programExercises.length === 0) {
        toast.info('Chương trình không có bài tập nào.');
        setAddingFromProgram(false);
        return;
      }

      // Lấy danh sách exercises đã có trong workout
      const existingLogs = await workoutApi.getLogsBySession(session.id);
      const existingExerciseIds = new Set(existingLogs.map(log => log.exerciseId));
      console.log('Existing exercise IDs:', Array.from(existingExerciseIds));

      let addedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Thêm từng exercise từ program
      for (const programExercise of programExercises) {
        // Validate exercise data
        if (!programExercise.exercise || !programExercise.exercise.id) {
          console.warn('Invalid program exercise:', programExercise);
          errorCount++;
          continue;
        }

        const exerciseId = programExercise.exercise.id;
        
        // Bỏ qua nếu exercise đã có trong workout
        if (existingExerciseIds.has(exerciseId)) {
          skippedCount++;
          continue;
        }

        // Tạo 1 set đầu tiên với giá trị mặc định từ program
        try {
          const logData = {
            exerciseId: exerciseId,
            setNumber: 1,
            repsDone: parseInt(programExercise.reps) || 0,
            weightUsed: 0, // User sẽ tự nhập khi tập
          };
          console.log('Creating log for exercise:', exerciseId, logData);
          
          await workoutApi.createLog(session.id, logData);
          addedCount++;
        } catch (err: any) {
          console.error(`Failed to add exercise ${exerciseId}:`, err);
          console.error('Error details:', err.response?.data);
          errorCount++;
        }
      }

      // Show results
      if (addedCount > 0) {
        toast.success(`Đã thêm ${addedCount} bài tập từ chương trình!`);
        onRefresh();
      }
      if (skippedCount > 0) {
        toast.info(`${skippedCount} bài tập đã có trong workout, đã bỏ qua.`);
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} bài tập không thể thêm. Vui lòng thử lại.`);
      }
      if (addedCount === 0 && skippedCount === 0 && errorCount === 0) {
        toast.info('Không có bài tập mới để thêm.');
      }
    } catch (err: any) {
      console.error('Không thể thêm bài tập từ chương trình:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi thêm bài tập từ chương trình. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setAddingFromProgram(false);
    }
  };

  // Quick add set cho exercise đã có (giống Strong app)
  const handleQuickAddSet = async (exerciseId: string) => {
    try {
      // Lấy logs của exercise này để biết set number tiếp theo
      const existingLogs = await workoutApi.getLogsBySession(session.id);
      const exerciseLogs = existingLogs
        .filter(log => log.exerciseId === exerciseId)
        .sort((a, b) => a.setNumber - b.setNumber);
      
      const nextSetNumber = exerciseLogs.length > 0 
        ? exerciseLogs[exerciseLogs.length - 1].setNumber + 1 
        : 1;

      // Lấy giá trị từ set cuối cùng (nếu có) để copy
      const lastLog = exerciseLogs[exerciseLogs.length - 1];
      
      // Tạo set mới với giá trị từ set trước (nếu có)
      await workoutApi.createLog(session.id, {
        exerciseId: exerciseId,
        setNumber: nextSetNumber,
        repsDone: lastLog?.repsDone || 0,
        weightUsed: lastLog?.weightUsed || 0,
        durationSeconds: lastLog?.durationSeconds,
        distanceMeters: lastLog?.distanceMeters,
        bodyWeight: lastLog?.bodyWeight,
      });

      toast.success('Đã thêm set mới');
      onRefresh();
    } catch (err) {
      console.error('Không thể thêm set:', err);
      toast.error('Lỗi khi thêm set. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exerciseGroups = groupLogsByExercise();
  const totalVolume = calculateTotalVolume();
  const totalSets = logs.length;

  // Show error if session is invalid
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={onBack}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className={`${isActive ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">
                {generateWorkoutName(session)}
              </h1>
              {isActive && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-4xl font-bold font-mono">
                      {formatElapsedTime(elapsedTime)}
                    </div>
                    <div className="text-sm text-white/70">
                      {isPaused ? 'Đã tạm dừng' : 'Đang chạy'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(session.sessionDate)}</span>
              </div>
              {!isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{session.durationMinutes} phút</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Tổng Sets</p>
              <p className="text-3xl font-bold">{totalSets}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Bài Tập</p>
              <p className="text-3xl font-bold">{Object.keys(exerciseGroups).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Tổng Volume</p>
              <p className="text-3xl font-bold">
                {totalVolume > 0 ? `${totalVolume.toFixed(0)}` : '0'}
                {totalVolume > 0 && <span className="text-lg ml-1">kg</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner for History */}
        {!isActive && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="font-semibold">Lịch sử buổi tập:</span>
              <span>Bạn đang xem lịch sử. Không thể chỉnh sửa hoặc xóa bài tập.</span>
            </p>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {isActive ? (
            <>
              <Button
                onClick={() => setShowAddExercise(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Bài Tập
              </Button>
              {session.programId && (
                <Button
                  onClick={handleAddExercisesFromProgram}
                  disabled={addingFromProgram}
                  variant="outline"
                  className="border-2 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                >
                  {addingFromProgram ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Thêm từ Chương trình
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={onPauseResume}
                variant="outline"
                className="border-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Tiếp Tục
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Tạm Dừng
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowFinishConfirm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Kết Thúc
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setShowAddExercise(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Bài Tập
              </Button>
              <Button
                onClick={() => onDelete(session.id)}
                variant="outline"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Notes */}
        {session.notes && (
          <Card className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Ghi chú:</strong> {session.notes}
            </p>
          </Card>
        )}

        {/* Exercise List */}
        {Object.keys(exerciseGroups).length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Chưa có bài tập nào trong buổi này
            </p>
            <Button onClick={() => setShowAddExercise(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Thêm Bài Tập Đầu Tiên
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(exerciseGroups).map(([exerciseId, exerciseLogs]) => {
              const volume = calculateExerciseVolume(exerciseLogs);
              const sortedLogs = [...exerciseLogs].sort((a, b) => a.setNumber - b.setNumber);

              return (
                <Card key={exerciseId} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {exerciseNames[exerciseId] || `Bài Tập #${exerciseId.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{sortedLogs.length} sets</span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {volume > 0 ? `${volume.toFixed(0)} kg` : 'No volume'}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <Button
                        onClick={() => handleQuickAddSet(exerciseId)}
                        variant="ghost"
                        size="sm"
                        title="Thêm set mới"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-2">
                    {(() => {
                      const exerciseType = exerciseTypes[exerciseId] || 'WEIGHT_AND_REPS';
                      
                      switch (exerciseType) {
                        case 'WEIGHT_AND_REPS':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'BODYWEIGHT_REPS':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">(+KG)</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'REPS_ONLY':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">REPS</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'TIME_BASED':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">TIME</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'DISTANCE_BASED':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-3">PREVIOUS</div>
                              <div className="col-span-5">DISTANCE</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'WEIGHT_AND_TIME':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">TIME</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        case 'ASSISTED_BODYWEIGHT':
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">(-KG)</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                          
                        default:
                          return (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                              <div className="col-span-2">SET</div>
                              <div className="col-span-2">PREVIOUS</div>
                              <div className="col-span-3">KG</div>
                              <div className="col-span-3">REPS</div>
                              <div className="col-span-1 flex justify-center">✓</div>
                              <div className="col-span-1"></div>
                            </div>
                          );
                      }
                    })()}

                    {sortedLogs.map((log, index) => {
                      const exerciseType = exerciseTypes[exerciseId] || 'WEIGHT_AND_REPS';
                      const previousLog = index > 0 ? sortedLogs[index - 1] : null;
                      const editingLog = editingLogs[log.id] || log;
                      const isUpdating = updatingLogs.has(log.id);
                      
                      switch (exerciseType) {
                        case 'WEIGHT_AND_REPS':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${(editingLogs[previousLog.id] || previousLog).weightUsed || 0} × ${(editingLogs[previousLog.id] || previousLog).repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  min="0"
                                  value={editingLog.weightUsed || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseFloat(e.target.value) || 0);
                                    updateLogValue(log.id, { weightUsed: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  min="0"
                                  value={editingLog.repsDone || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseInt(e.target.value) || 0);
                                    updateLogValue(log.id, { repsDone: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'BODYWEIGHT_REPS':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? (
                                  (editingLogs[previousLog.id] || previousLog).weightUsed 
                                    ? `+${(editingLogs[previousLog.id] || previousLog).weightUsed || 0} × ${(editingLogs[previousLog.id] || previousLog).repsDone || 0}`
                                    : `${(editingLogs[previousLog.id] || previousLog).repsDone || 0} reps`
                                ) : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  min="0"
                                  value={editingLog.weightUsed || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseFloat(e.target.value) || 0);
                                    updateLogValue(log.id, { weightUsed: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  min="0"
                                  value={editingLog.repsDone || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseInt(e.target.value) || 0);
                                    updateLogValue(log.id, { repsDone: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'REPS_ONLY':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${(editingLogs[previousLog.id] || previousLog).repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-5">
                                <input 
                                  type="number"
                                  min="0"
                                  value={editingLog.repsDone || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseInt(e.target.value) || 0);
                                    updateLogValue(log.id, { repsDone: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'TIME_BASED':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? formatDuration((editingLogs[previousLog.id] || previousLog).durationSeconds) : '—'}
                              </div>
                              <div className="col-span-5 flex items-center">
                                <input 
                                  type="text"
                                  value={formatDuration(editingLog.durationSeconds)}
                                  onChange={(e) => {
                                    const value = parseDuration(e.target.value);
                                    updateLogValue(log.id, { durationSeconds: value });
                                  }}
                                  placeholder="M:SS"
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'DISTANCE_BASED':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-3 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${(editingLogs[previousLog.id] || previousLog).distanceMeters || 0}m` : '—'}
                              </div>
                              <div className="col-span-5 flex items-center">
                                <input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editingLog.distanceMeters || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseFloat(e.target.value) || 0);
                                    updateLogValue(log.id, { distanceMeters: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                                <span className="text-sm text-gray-500 ml-1">m</span>
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'WEIGHT_AND_TIME':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `${(editingLogs[previousLog.id] || previousLog).weightUsed || 0} × ${formatDuration((editingLogs[previousLog.id] || previousLog).durationSeconds)}` : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  min="0"
                                  value={editingLog.weightUsed || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseFloat(e.target.value) || 0);
                                    updateLogValue(log.id, { weightUsed: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-3 flex items-center">
                                <input 
                                  type="text"
                                  value={formatDuration(editingLog.durationSeconds)}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseDuration(e.target.value));
                                    updateLogValue(log.id, { durationSeconds: value });
                                  }}
                                  placeholder="M:SS"
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        case 'ASSISTED_BODYWEIGHT':
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                {previousLog ? `-${(editingLogs[previousLog.id] || previousLog).weightUsed || 0} × ${(editingLogs[previousLog.id] || previousLog).repsDone || 0}` : '—'}
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number" 
                                  step="0.5"
                                  min="0"
                                  value={editingLog.weightUsed || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseFloat(e.target.value) || 0);
                                    updateLogValue(log.id, { weightUsed: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  min="0"
                                  value={editingLog.repsDone || 0}
                                  onChange={(e) => {
                                    const value = Math.max(0, parseInt(e.target.value) || 0);
                                    updateLogValue(log.id, { repsDone: value });
                                  }}
                                  className="w-full p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isActive || isUpdating}
                                />
                              </div>
                              <div className="col-span-1 flex justify-center items-center pointer-events-none">
                                <div className="pointer-events-auto">
                                  {renderCompletedTick(log)}
                                </div>
                              </div>
                              <div className="col-span-1 flex justify-end items-center">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          
                        default:
                          return (
                            <div
                              key={log.id}
                              className={`grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2 transition ${
                                isUpdating 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700' 
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                                {index + 1}
                              </div>
                              <div className="col-span-7 text-gray-700 dark:text-gray-300">
                                {editingLog.displayValue || `${editingLog.weightUsed || 0} kg × ${editingLog.repsDone || 0}`}
                              </div>
                              <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                                {editingLog.volume && editingLog.volume > 0 ? `${editingLog.volume.toFixed(0)} kg` : '-'}
                              </div>
                              <div className="col-span-1 flex justify-end">
                                {isActive && (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    disabled={isUpdating}
                                    type="button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                      }
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <AddExerciseModal
          sessionId={session.id}
          editingLog={editingLog}
          onClose={() => {
            setShowAddExercise(false);
            setEditingLog(null);
          }}
          onSuccess={() => {
            setShowAddExercise(false);
            setEditingLog(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Log Confirmation Dialog */}
      <Dialog open={deleteLogId !== null} onOpenChange={() => setDeleteLogId(null)}>
        <DialogContent className="bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa set
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn xóa set này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteLogId(null)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDeleteLog}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              Xóa set
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Workout Confirmation Dialog */}
      <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <DialogContent className="bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Kết thúc buổi tập
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Bạn có chắc chắn muốn kết thúc buổi tập này không? Thời gian tập luyện sẽ được lưu lại.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFinishConfirm(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Tiếp tục tập
            </Button>
            <Button
              onClick={() => {
                setShowFinishConfirm(false);
                if (onFinishWorkout) onFinishWorkout();
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
            >
              Kết thúc
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
