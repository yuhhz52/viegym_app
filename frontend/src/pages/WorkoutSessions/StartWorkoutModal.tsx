import { useState, useEffect } from 'react';
import { X, Dumbbell, BookOpen, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import * as workoutApi from './api';
import type { WorkoutProgramResponse } from './type';

interface StartWorkoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StartWorkoutModal = ({ onClose, onSuccess }: StartWorkoutModalProps) => {
  const [programs, setPrograms] = useState<WorkoutProgramResponse[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      // Only load programs that user has saved from Explore section
      const data = await workoutApi.getSavedPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Không thể tải chương trình đã lưu:', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // 1. Tạo session
      console.log('Creating session with program:', selectedProgram);
      const newSession = await workoutApi.createSession({
        programId: selectedProgram || undefined,
        sessionDate: new Date().toISOString(),
        durationMinutes: 0, // Will be updated when workout finishes
        notes: notes || undefined
      });
      console.log('Session created:', newSession);
      
      // 2. Nếu chọn chương trình, chỉ lưu programId vào session
      // KHÔNG tạo logs ngay - giống Strong app, user sẽ tự thêm exercises khi tập
      if (selectedProgram) {
        toast.success('Đã tạo buổi tập với chương trình. Bạn có thể thêm bài tập từ chương trình khi bắt đầu tập.');
      }
      
      // 3. Save to localStorage for persistence
      localStorage.setItem('activeWorkout', JSON.stringify(newSession));
      localStorage.setItem('workoutStartTime', Date.now().toString());
      
      onSuccess();
    } catch (err: any) {
      console.error('Không thể tạo buổi tập:', err);
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Lỗi khi tạo buổi tập. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bắt Đầu Tập
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tạo buổi tập mới
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* Program Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Chương trình (tùy chọn)
                </div>
              </label>
              
              {loadingPrograms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Đang tải chương trình...</span>
                </div>
              ) : programs.length === 0 ? (
                <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <BookOpen className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Chưa có chương trình đã lưu nào.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Hãy vào phần Khám phá để lưu chương trình bạn muốn tập, sau đó quay lại đây để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Option: No program */}
                  <button
                    onClick={() => setSelectedProgram('')}
                    type="button"
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedProgram === ''
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedProgram === ''
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedProgram === '' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Không chọn chương trình
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Thêm bài tập thủ công
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Program options */}
                  {programs.map(program => (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id)}
                      type="button"
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedProgram === program.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedProgram === program.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedProgram === program.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {program.title || program.name || 'Chương trình không tên'}
                            </p>
                          </div>
                          {program.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2.5 leading-relaxed">
                              {program.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {program.goal && (
                              <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                {program.goal.replace(/_/g, ' ')}
                              </span>
                            )}
                            {program.durationWeeks && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                {program.durationWeeks} tuần
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Leg day, Upper body..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <Button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? 'Đang tạo...' : 'Bắt Đầu Ngay'}
            </Button>
            <Button onClick={onClose} variant="outline" size="lg">
              Hủy
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
