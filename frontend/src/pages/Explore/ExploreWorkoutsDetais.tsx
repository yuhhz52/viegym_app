import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProgramDetailAPI, getProgramStatsAPI, saveProgramAPI, unsaveProgramAPI, rateProgramAPI } from "./api";
import type { Program } from "@/types/program";
import { ArrowLeft, Star, Clock, Target, Calendar, ChevronDown, ChevronUp, Bookmark, PlayCircle, History } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as workoutApi from "@/pages/WorkoutSessions/api";
import type { WorkoutSessionResponse } from "@/pages/WorkoutSessions/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExploreWorkoutsDetaislPage() {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [stats, setStats] = useState<{
    averageRating: number;
    totalRatings: number;
    isSaved: boolean;
    userRating: number | null;
  } | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState("");
  const [savingProgram, setSavingProgram] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        if (!id) return;
        const [programData, statsData] = await Promise.all([
          getProgramDetailAPI(id),
          getProgramStatsAPI(id)
        ]);
        setProgram(programData);
        setStats(statsData);
        if (statsData.userRating) {
          setSelectedRating(statsData.userRating);
        }
      } catch (err) {
        console.error("Failed to load program:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
    fetchWorkoutHistory();
  }, [id]);

  const fetchWorkoutHistory = async () => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const allSessions = await workoutApi.getAllSessions();
      // Filter sessions that use this program
      const programSessions = allSessions.filter(session => session.programId === id);
      // Sort by date descending (newest first)
      programSessions.sort((a, b) => 
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      );
      setWorkoutHistory(programSessions);
    } catch (err) {
      console.error("Failed to load workout history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!id) return;
    setStartingWorkout(true);
    try {
      // 1. Kiểm tra và tự động lưu chương trình nếu chưa được lưu
      if (stats && !stats.isSaved) {
        try {
          await saveProgramAPI(id);
          // Cập nhật stats local để UI phản ánh đúng
          setStats({ ...stats, isSaved: true });
          toast.success('Đã tự động lưu chương trình');
        } catch (saveErr: any) {
          console.error('Không thể lưu chương trình:', saveErr);
          // Vẫn tiếp tục tạo session dù lưu thất bại
          if (saveErr.response?.status !== 401) {
            toast.warning('Không thể lưu chương trình, nhưng vẫn có thể bắt đầu tập');
          }
        }
      }

      // 2. Tạo session với chương trình này
      const newSession = await workoutApi.createSession({
        programId: id,
        sessionDate: new Date().toISOString(),
        durationMinutes: 0,
        notes: program?.title || undefined
      });
      
      // 3. Lưu vào localStorage để duy trì trạng thái
      localStorage.setItem('activeWorkout', JSON.stringify(newSession));
      localStorage.setItem('workoutStartTime', Date.now().toString());
      
      toast.success('Đã tạo buổi tập với chương trình này!');
      
      // 4. Điều hướng đến trang workout sessions
      navigate('/workouts');
    } catch (err: any) {
      console.error('Không thể tạo buổi tập:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để bắt đầu tập');
      } else if (err.response?.status === 404) {
        toast.error('Chương trình không tồn tại hoặc đã bị xóa');
      } else if (err.response?.status === 403) {
        toast.error('Bạn không có quyền sử dụng chương trình này');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi tạo buổi tập. Vui lòng thử lại.';
        toast.error(errorMessage);
      }
    } finally {
      setStartingWorkout(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!id || !stats) return;
    setSavingProgram(true);
    try {
      if (stats.isSaved) {
        await unsaveProgramAPI(id);
        toast.success("Đã bỏ lưu chương trình");
      } else {
        await saveProgramAPI(id);
        toast.success("Đã lưu chương trình");
      }
      setStats({ ...stats, isSaved: !stats.isSaved });
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMsg = err?.response?.data?.message || "Có lỗi xảy ra";
      if (err?.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để lưu chương trình");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSavingProgram(false);
    }
  };

  const handleRateSubmit = async () => {
    if (!id || selectedRating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    try {
      console.log("Sending rating:", { rating: selectedRating, review });
      await rateProgramAPI(id, { rating: selectedRating, review });
      toast.success("Đã đánh giá chương trình");
      setRatingDialogOpen(false);
      
      // Refresh stats
      const newStats = await getProgramStatsAPI(id);
      setStats(newStats);
    } catch (err: any) {
      console.error("Rating error:", err);
      const errorMsg = err?.response?.data?.message || "Có lỗi xảy ra";
      toast.error(errorMsg);
    }
  };

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const getGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      WEIGHT_LOSS: "Giảm cân",
      MUSCLE_GAIN: "Tăng cơ",
      STRENGTH: "Tăng sức mạnh",
      ENDURANCE: "Tăng sức bền",
      FLEXIBILITY: "Tăng độ dẻo",
      GENERAL_FITNESS: "Thể lực tổng quát"
    };
    return labels[goal] || goal;
  };

  if (loading) {
    return <LoadingState message="Đang tải chương trình..." />;
  }

  if (!program) {
    return <p className="text-center mt-20 text-gray-400 dark:text-gray-500">Program not found.</p>;
  }

  // Group exercises by day
  const exercisesByDay = program.exercises?.reduce((acc, ex) => {
    const day = ex.dayOfProgram || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(ex);
    return acc;
  }, {} as Record<number, typeof program.exercises>) || {};

  const days = Object.keys(exercisesByDay).map(Number).sort((a, b) => a - b);

  const mediaUrl = program.mediaList?.[0]?.url || "https://placehold.co/1200x600/1a1a1a/white?text=Workout+Program";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <img
          src={mediaUrl}
          alt={program.title}
          className="w-full h-80 md:h-96 object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-6 pb-8 w-full">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors group"
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <ArrowLeft size={18} />
              </div>
              <span className="text-sm font-medium">Quay lại khám phá</span>
            </Link>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden bg-gray-800 border-4 border-white/20 shadow-2xl">
                <img
                  src={mediaUrl}
                  alt={program.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                    <Target className="w-3.5 h-3.5" />
                    {getGoalLabel(program.goal || "GENERAL_FITNESS")}
                  </span>
                  {program.visibility === 'PUBLIC' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                      Công khai
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{program.title}</h1>
                <div className="flex items-center gap-3 text-gray-200 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base font-medium">{program.createdByName || "VieGym"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setRatingDialogOpen(true)}
              className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stats?.totalRatings || 0} đánh giá
                </div>
              </div>
            </button>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{program.durationWeeks}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tuần</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{days.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Ngày tập</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{getGoalLabel(program.goal || "")}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Mục tiêu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mô tả chương trình
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {program.description || "Chương trình tập luyện được thiết kế để giúp bạn đạt được mục tiêu thể hình. Chương trình được chia thành nhiều ngày tập, mỗi ngày nhắm đến các nhóm cơ cụ thể."}
              </p>
            </div>

            {/* Workouts in Program */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Lịch tập luyện
              </h2>
              <div className="space-y-3">
                {days.map((day) => {
                  const dayExercises = exercisesByDay[day];
                  const isExpanded = expandedDays.has(day);
                  
                  return (
                    <div key={day} className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden hover:border-red-200 dark:hover:border-red-900/50 transition-all shadow-sm hover:shadow-md">
                      <button
                        onClick={() => toggleDay(day)}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-2xl font-bold text-white">{day}</span>
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              Ngày {day}: Tập luyện
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {dayExercises.length} bài tập
                            </p>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-5 space-y-2">
                          {dayExercises.map((ex, idx) => (
                            <div key={ex.id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 hover:shadow-md transition-all border border-gray-100 dark:border-gray-800">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                  {ex.exercise?.name || "Bài tập"}
                                </h4>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                    <span className="font-semibold">{ex.sets}</span> sets
                                  </span>
                                  <span className="text-gray-400">×</span>
                                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="font-semibold">{ex.reps}</span> reps
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-3">
              <Button
                onClick={handleStartWorkout}
                disabled={startingWorkout || !id}
                className="w-full py-6 text-lg font-bold rounded-xl shadow-lg transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingWorkout ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Đang tạo buổi tập...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-6 h-6 mr-2" />
                    Bắt đầu tập
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveToggle}
                disabled={savingProgram}
                className={`w-full py-6 text-lg font-bold rounded-xl shadow-lg transition-all ${
                  stats?.isSaved
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                } text-white`}
              >
                <Bookmark className={`w-6 h-6 mr-2 ${stats?.isSaved ? "fill-white" : ""}`} />
                {stats?.isSaved ? "Đã lưu chương trình" : "Lưu chương trình"}
              </Button>
            </div>

            {/* Workout History */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử tập luyện</h3>
              </div>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
                </div>
              ) : workoutHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có buổi tập nào</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bắt đầu tập để xem lịch sử</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {workoutHistory.map((session) => (
                    <Link
                      key={session.id}
                      to="/workouts"
                      onClick={() => {
                        // Store session ID to highlight it when navigating
                        sessionStorage.setItem('highlightSessionId', session.id);
                      }}
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {new Date(session.sessionDate).toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.durationMinutes} phút
                            </span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá chương trình</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn với chương trình này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= selectedRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Viết đánh giá của bạn (tùy chọn)..."
              className="w-full h-24 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleRateSubmit} className="flex-1">
                Gửi đánh giá
              </Button>
              <Button variant="outline" onClick={() => setRatingDialogOpen(false)} className="flex-1">
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}