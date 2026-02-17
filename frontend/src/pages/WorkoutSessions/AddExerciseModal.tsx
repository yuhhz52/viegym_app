import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import * as workoutApi from './api';
import type { ExerciseResponse, SessionExerciseLogResponse } from './type';

interface AddExerciseModalProps {
  sessionId: string;
  editingLog?: SessionExerciseLogResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface SetInput {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  bodyWeight?: number;
  completed: boolean;
}

export const AddExerciseModal = ({ 
  sessionId, 
  onClose, 
  onSuccess 
}: AddExerciseModalProps) => {
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [sets, setSets] = useState<SetInput[]>([
    { reps: 10, weight: 0, duration: 60, distance: 100, bodyWeight: 70, completed: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const data = await workoutApi.getAllExercises();
      setExercises(data);
    } catch (err) {
      console.error('Không thể tải danh sách bài tập:', err);
    }
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { ...lastSet, completed: false }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: 'reps' | 'weight' | 'duration' | 'distance' | 'bodyWeight', value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const toggleSetComplete = (index: number) => {
    const newSets = [...sets];
    newSets[index].completed = !newSets[index].completed;
    setSets(newSets);
  };

  const handleSave = async () => {
    if (!selectedExercise) {
      toast.error('Vui lòng chọn bài tập');
      return;
    }

    if (sets.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 set');
      return;
    }

    const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
    const exerciseType = selectedExerciseData?.exerciseType;
    
    // Validate based on exercise type
    const isValidSet = sets.some(s => {
      switch (exerciseType) {
        case 'WEIGHT_AND_REPS':
          return (s.weight || 0) > 0 && (s.reps || 0) > 0;
        case 'BODYWEIGHT_REPS':
        case 'REPS_ONLY':
          return (s.reps || 0) > 0;
        case 'TIME_BASED':
          return (s.duration || 0) > 0;
        case 'DISTANCE_BASED':
          return (s.distance || 0) > 0;
        case 'WEIGHT_AND_TIME':
          return (s.weight || 0) > 0 && (s.duration || 0) > 0;
        case 'ASSISTED_BODYWEIGHT':
          return (s.reps || 0) > 0 && (s.bodyWeight || 0) > 0;
        default:
          return (s.reps || 0) > 0;
      }
    });

    if (!isValidSet) {
      toast.error('Vui lòng nhập thông tin phù hợp cho loại bài tập này');
      return;
    }

    setLoading(true);
    try {
      // Lấy số set hiện tại của exercise này
      const existingLogs = await workoutApi.getLogsBySession(sessionId);
      const exerciseLogs = existingLogs.filter(log => log.exerciseId === selectedExercise);
      const startSetNumber = exerciseLogs.length + 1;

      const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
      const exerciseType = selectedExerciseData?.exerciseType || 'WEIGHT_AND_REPS';

      // Tạo tất cả các sets
      for (let i = 0; i < sets.length; i++) {
        const logData: any = {
          exerciseId: selectedExercise,
          setNumber: startSetNumber + i,
        };

        // Set fields based on exercise type
        switch (exerciseType) {
          case 'WEIGHT_AND_REPS':
            logData.repsDone = sets[i].reps;
            logData.weightUsed = sets[i].weight;
            break;
          case 'BODYWEIGHT_REPS':
            logData.repsDone = sets[i].reps;
            logData.weightUsed = sets[i].weight; // Weight thêm vào (bodyWeight sẽ được tính tự động từ backend)
            break;
          case 'REPS_ONLY':
            logData.repsDone = sets[i].reps;
            break;
          case 'TIME_BASED':
            logData.durationSeconds = sets[i].duration;
            break;
          case 'DISTANCE_BASED':
            logData.distanceMeters = sets[i].distance;
            break;
          case 'WEIGHT_AND_TIME':
            logData.weightUsed = sets[i].weight;
            logData.durationSeconds = sets[i].duration;
            break;
          case 'ASSISTED_BODYWEIGHT':
            logData.repsDone = sets[i].reps;
            logData.weightUsed = sets[i].weight; // Assist weight (bodyWeight sẽ được tính tự động từ backend)
            break;
          default:
            logData.repsDone = sets[i].reps;
            logData.weightUsed = sets[i].weight;
        }

        await workoutApi.createLog(sessionId, logData);
      }
      onSuccess();
    } catch (err) {
      console.error('Không thể lưu bài tập:', err);
      toast.error('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Thêm Bài Tập
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Exercise Search/Select */}
          <div>
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="p-6">
          {/* Exercise List */}
          {!selectedExercise && (
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Không tìm thấy bài tập</p>
              ) : (
                filteredExercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{exercise.name}</p>
                    {exercise.muscleGroup && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {exercise.muscleGroup}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Exercise Info */}
          {selectedExercise && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {exercises.find(e => e.id === selectedExercise)?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {exercises.find(e => e.id === selectedExercise)?.muscleGroup}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedExercise('');
                      setSets([{ reps: 10, weight: 0, completed: false }]);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Đổi
                  </Button>
                </div>
              </div>

              {/* Sets Input */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sets</h3>
                  <Button onClick={addSet} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm Set
                  </Button>
                </div>

                {sets.map((set, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                      set.completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => toggleSetComplete(index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                        set.completed
                          ? 'bg-green-500 text-white'
                          : 'border-2 border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {set.completed && <Check className="w-5 h-5" />}
                    </button>

                    <div className="flex-1">
                      {(() => {
                        const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
                        const exerciseType = selectedExerciseData?.exerciseType || 'WEIGHT_AND_REPS';
                        
                        switch (exerciseType) {
                          case 'WEIGHT_AND_REPS':
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    KG
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight || 0}
                                    onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    REPS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.reps || 0}
                                    onChange={(e) => updateSet(index, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'BODYWEIGHT_REPS':
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    (+KG)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight || 0}
                                    onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    REPS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.reps || 0}
                                    onChange={(e) => updateSet(index, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'REPS_ONLY':
                            return (
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    REPS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.reps || 0}
                                    onChange={(e) => updateSet(index, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'TIME_BASED':
                            return (
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    TIME (M:SS hoặc giây)
                                  </label>
                                  <input
                                    type="text"
                                    value={set.duration ? `${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                    onChange={(e) => {
                                      const timeString = e.target.value;
                                      const parts = timeString.split(':');
                                      let seconds = 0;
                                      if (parts.length === 2) {
                                        const minutes = Math.max(0, parseInt(parts[0]) || 0);
                                        const secs = Math.max(0, parseInt(parts[1]) || 0);
                                        seconds = minutes * 60 + secs;
                                      } else {
                                        seconds = Math.max(0, parseInt(timeString) || 0);
                                      }
                                      updateSet(index, 'duration', seconds);
                                    }}
                                    placeholder="1:30 hoặc 90"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'DISTANCE_BASED':
                            return (
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    DISTANCE (m)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={set.distance || 0}
                                    onChange={(e) => updateSet(index, 'distance', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'WEIGHT_AND_TIME':
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    KG
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight || 0}
                                    onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    TIME (M:SS)
                                  </label>
                                  <input
                                    type="text"
                                    value={set.duration ? `${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                    onChange={(e) => {
                                      const timeString = e.target.value;
                                      const parts = timeString.split(':');
                                      let seconds = 0;
                                      if (parts.length === 2) {
                                        const minutes = Math.max(0, parseInt(parts[0]) || 0);
                                        const secs = Math.max(0, parseInt(parts[1]) || 0);
                                        seconds = minutes * 60 + secs;
                                      } else {
                                        seconds = Math.max(0, parseInt(timeString) || 0);
                                      }
                                      updateSet(index, 'duration', seconds);
                                    }}
                                    placeholder="1:30"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          case 'ASSISTED_BODYWEIGHT':
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    ASSIST WEIGHT (kg)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight || 0}
                                    onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    REPS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.reps || 0}
                                    onChange={(e) => updateSet(index, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                            
                          default:
                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    KG
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight || 0}
                                    onChange={(e) => updateSet(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    REPS
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={set.reps || 0}
                                    onChange={(e) => updateSet(index, 'reps', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            );
                        }
                      })()}
                    </div>

                    {sets.length > 1 && (
                      <button
                        onClick={() => removeSet(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                {(() => {
                  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);
                  const exerciseType = selectedExerciseData?.exerciseType || 'WEIGHT_AND_REPS';
                  
                  switch (exerciseType) {
                    case 'WEIGHT_AND_REPS':
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Reps</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Volume (kg)</p>
                          </div>
                        </div>
                      );
                      
                    case 'BODYWEIGHT_REPS':
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Reps</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              +{sets.reduce((sum, s) => Math.max(sum, s.weight || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Max Weight (kg)</p>
                          </div>
                        </div>
                      );
                      
                    case 'REPS_ONLY':
                      return (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Reps</p>
                          </div>
                        </div>
                      );
                      
                    case 'TIME_BASED':
                      return (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.duration || 0), 0)}s
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Thời Gian</p>
                          </div>
                        </div>
                      );
                      
                    case 'DISTANCE_BASED':
                      return (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.distance || 0), 0)}m
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Khoảng Cách</p>
                          </div>
                        </div>
                      );
                      
                    case 'WEIGHT_AND_TIME':
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => Math.max(sum, s.weight || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Max Weight (kg)</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.duration || 0), 0)}s
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Thời Gian</p>
                          </div>
                        </div>
                      );
                      
                    case 'ASSISTED_BODYWEIGHT':
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Reps</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => Math.max(sum, s.bodyWeight || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Body Weight (kg)</p>
                          </div>
                        </div>
                      );
                      
                    default:
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{sets.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + (s.reps || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Reps</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Volume (kg)</p>
                          </div>
                        </div>
                      );
                  }
                })()}
              </div>

              {/* Quick Add Tips */}
              {sets.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mẹo: Nhấn "Thêm Set" để sao chép set cuối</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Bài Tập'}
                </Button>
                <Button onClick={onClose} variant="outline" size="lg">
                  Hủy
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
