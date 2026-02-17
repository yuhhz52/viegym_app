import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as workoutApi from '@/pages/WorkoutSessions/api';
import type { WorkoutSessionResponse } from '@/pages/WorkoutSessions/type';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysHeader = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  useEffect(() => {
    loadWorkoutSessions();
  }, [currentDate]);

  const loadWorkoutSessions = async () => {
    try {
      const sessions = await workoutApi.getAllSessions();
      setWorkoutSessions(sessions);
    } catch (error) {
      console.error('Failed to load workout sessions:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to Saturday (6)
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasWorkoutOnDate = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    return workoutSessions.some(session => 
      session.sessionDate.startsWith(dateStr)
    );
  };

  const getWorkoutCountOnDate = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    return workoutSessions.filter(session => 
      session.sessionDate.startsWith(dateStr)
    ).length;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 w-12"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasWorkout = hasWorkoutOnDate(year, month, day);
      const workoutCount = getWorkoutCountOnDate(year, month, day);
      const today = isToday(year, month, day);
      const dateStr = formatDate(year, month, day);
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(year, month, day)}
          className={`h-12 w-12 flex flex-col items-center justify-center rounded-lg cursor-pointer text-sm font-medium transition-all relative
            ${today 
              ? "bg-indigo-600 text-white shadow-lg" 
              : isSelected
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              : hasWorkout 
              ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300" 
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }
          `}
        >
          <span>{day}</span>
          {hasWorkout && workoutCount > 0 && (
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center
              ${today ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"}
            `}>
              {workoutCount}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getSelectedDateSessions = () => {
    if (!selectedDate) return [];
    return workoutSessions.filter(session => 
      session.sessionDate.startsWith(selectedDate)
    );
  };

  // Generate workout session name like Strong app
  const generateWorkoutName = (session: WorkoutSessionResponse, index: number) => {
    const sessionDate = new Date(session.sessionDate);
    const timeOfDay = sessionDate.getHours();
    
    // Time-based prefixes
    let timePrefix = '';
    if (timeOfDay >= 5 && timeOfDay < 12) {
      timePrefix = 'S\u00e1ng';
    } else if (timeOfDay >= 12 && timeOfDay < 17) {
      timePrefix = 'Chi\u1ec1u';
    } else if (timeOfDay >= 17 && timeOfDay < 21) {
      timePrefix = 'T\u1ed1i';
    } else {
      timePrefix = '\u0110\u00eam';
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
        return foundType;
      } else if (notes.length <= 20) {
        return notes;
      }
    }

    // Fallback to time-based naming
    return `${timePrefix} ${index + 1}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-8 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lịch Tập Luyện
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-lg font-medium text-gray-900 dark:text-white min-w-32 text-center">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysHeader.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-indigo-600"></div>
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900"></div>
          <span>Có tập</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-600 text-white text-[8px] flex items-center justify-center">1</div>
          <span>Số buổi tập</span>
        </div>
      </div>

      {/* Selected date sessions */}
      {selectedDate && getSelectedDateSessions().length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Buổi tập ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}:
          </h3>
          <div className="space-y-3">
            {getSelectedDateSessions().map((session, index) => {
              const sessionTime = new Date(session.sessionDate).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              const sessionName = generateWorkoutName(session, index);
              
              return (
                <div key={session.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {sessionName}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full">
                        {session.durationMinutes} phút
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      🕐 {sessionTime}
                      {session.notes && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="italic">"{session.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
