import Calendar from "@/components/Calendar";
import ProgressLineChart from "@/components/charts/ProgressLineChart";
import TopExercisesChart from "@/components/charts/TopExercisesChart";
import WeeklyProgressChart from "@/components/charts/WeeklyProgressChart";
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Target, Dumbbell, Clock, Flame, TrendingUp, Activity } from 'lucide-react';
import * as workoutApi from '@/pages/WorkoutSessions/api';
import type { WorkoutSessionResponse, SessionExerciseLogResponse } from '@/pages/WorkoutSessions/type';
import { Card } from '@/components/ui/card';
import LoadingState from '@/components/LoadingState';

interface ProgressStats {
  totalVolume: number;
  totalWorkouts: number;
  totalDuration: number;
  avgDuration: number;
  weeklyProgress: { week: string; volume: number; workouts: number; duration: number }[];
  recentSessions: WorkoutSessionResponse[];
  topExercises: { name: string; volume: number; frequency: number }[];
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('Tổng Tạ');
  const timeRange = '3 Months'; // Fixed time range
  const [allLogs, setAllLogs] = useState<SessionExerciseLogResponse[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // Fetch all sessions
      const allSessions = await workoutApi.getAllSessions();
      
      // Filter sessions based on time range
      const filteredSessions = filterSessionsByTimeRange(allSessions, timeRange);

      // Fetch logs for filtered sessions
      const logsPromises = filteredSessions.map(session => 
        workoutApi.getLogsBySession(session.id).catch(() => [])
      );
      const logsArrays = await Promise.all(logsPromises);
      const flatLogs = logsArrays.flat();
      setAllLogs(flatLogs);

      // Fetch exercise names for better display
      let namesMap: { [key: string]: string } = {};
      try {
        const exercises = await workoutApi.getAllExercises();
        exercises.forEach(ex => {
          namesMap[ex.id] = ex.name;
        });
        setExerciseNames(namesMap);
      } catch (error) {
        console.error('Failed to load exercise names:', error);
      }

      // Calculate statistics with exercise names
      const calculatedStats = calculateProgressStats(filteredSessions, flatLogs, namesMap);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load progress data:', error);
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

  const calculateProgressStats = (sessions: WorkoutSessionResponse[], logs: SessionExerciseLogResponse[], exerciseNamesMap: { [key: string]: string } = {}): ProgressStats => {
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
    const topExercises = calculateTopExercises(logs, exerciseNamesMap);

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

  const calculateTopExercises = (logs: SessionExerciseLogResponse[], exerciseNamesMap: { [key: string]: string } = {}) => {
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
        name: exerciseNamesMap[id] || exerciseNames[id] || `Bài tập #${id.slice(0, 8)}`,
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

  if (loading) {
    return <LoadingState message="Đang tải dữ liệu tiến độ..." fullScreen />;
  }

  return (
    <div className="flex">
      <main className="flex-1 p-8 dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            Tiến Độ Luyện Tập
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi và phân tích kết quả tập luyện của bạn
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatVolume(stats?.totalVolume || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Tạ (kg)</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalWorkouts || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Buổi Tập</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(stats?.totalDuration || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Thời Gian</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* Replace with a valid property or placeholder */}
                  0
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chuỗi Ngày</p>
              </div>
            </div>
          </Card>
        
        </div>

        {/* Chart Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { key: 'Tổng Tạ', value: 'volume' },
              { key: 'Buổi Tập', value: 'workouts' },
              { key: 'Thời Gian', value: 'duration' }
            ].map((t) => (
              <div
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition ${
                  activeTab === t.key 
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {t.key}
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {activeTab === 'Tổng Tạ' ? 'Tổng Tạ' : activeTab === 'Buổi Tập' ? 'Buổi Tập' : 'Thời Gian'} Theo Tuần
                </h3>
              </div>
              <div className="h-80">
                {stats?.weeklyProgress && stats.weeklyProgress.length > 0 ? (
                  <ProgressLineChart 
                    data={stats.weeklyProgress} 
                    dataKey={
                      activeTab === 'Tổng Tạ' ? 'volume' :
                      activeTab === 'Buổi Tập' ? 'workouts' :
                      'duration'
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Chưa có dữ liệu</p>
                      <p className="text-sm mt-1">Bắt đầu tập luyện để xem biểu đồ tiến độ</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Exercises Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-indigo-600" />
              Top Bài Tập
            </h3>
            <div className="h-80">
              {stats?.topExercises && stats.topExercises.length > 0 ? (
                <TopExercisesChart data={stats.topExercises} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Chưa có dữ liệu bài tập</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Weekly Overview Chart */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Tổng Quan Theo Tuần
            </h3>
          </div>
          <div className="h-80">
            {stats?.weeklyProgress && stats.weeklyProgress.length > 0 ? (
              <WeeklyProgressChart data={stats.weeklyProgress} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Chưa có dữ liệu tuần</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Sessions */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Buổi Tập Gần Đây
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Thời Gian</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tổng Tạ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSessions.map((session) => {
                  const sessionVolume = allLogs
                    .filter(log => log.sessionId === session.id)
                    .reduce((sum, log) => sum + (log.volume || 0), 0);
                  
                  return (
                    <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {new Date(session.sessionDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {formatDuration(session.durationMinutes)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {formatVolume(sessionVolume)}kg
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                        {session.notes || 'Không có ghi chú'}
                      </td>
                    </tr>
                  );
                }) || (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Chưa có buổi tập nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Calendar />
      </main>
    </div>
  );
}

