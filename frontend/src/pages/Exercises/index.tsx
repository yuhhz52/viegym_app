import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { getExercisesAPI } from "@/api/exerciseAPI";
import type { Exercise, GetExercisesParams } from "@/pages/Exercises/Type";
import { ExerciseDetailModal } from "@/pages/Exercises/ExerciseDetailModal";
import LoadingState from "@/components/LoadingState";

export default function Exercises() {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const hasQuery = search.trim().length > 0;
  
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      // Tính toán fetchPage và fetchSize trong callback để capture đúng giá trị
      const fetchSize = hasQuery ? 1000 : size;
      const fetchPage = hasQuery ? 0 : page;
      
      const params: GetExercisesParams = { 
        page: fetchPage, 
        size: fetchSize,
        muscleGroup: muscleGroup !== "ALL" ? muscleGroup : undefined,
        difficulty: difficulty !== "ALL" ? difficulty : undefined,
      };

      const res = await getExercisesAPI(params);

      setAllExercises(res.exercises ?? []);
      setTotalPages(res.totalPages ?? 1);
      setTotalElements(res.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      setAllExercises([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, muscleGroup, difficulty, hasQuery]); // Sử dụng page, size, muscleGroup, difficulty, hasQuery trực tiếp


  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Track previous muscleGroup và difficulty để chỉ reset khi filter thực sự thay đổi
  const prevMuscleGroupRef = useRef(muscleGroup);
  const prevDifficultyRef = useRef(difficulty);
  const prevSearchRef = useRef(search);

  // Reset page khi search thay đổi
  useEffect(() => {
    if (search !== prevSearchRef.current) {
      prevSearchRef.current = search;
      if (page > 0) {
        setPage(0);
      }
    }
  }, [search, page]);

  // Reset page khi muscleGroup filter thay đổi
  useEffect(() => {
    if (muscleGroup !== prevMuscleGroupRef.current) {
      prevMuscleGroupRef.current = muscleGroup;
      if (page > 0) {
        setPage(0);
      }
    }
  }, [muscleGroup, page]);

  // Reset page khi difficulty filter thay đổi
  useEffect(() => {
    if (difficulty !== prevDifficultyRef.current) {
      prevDifficultyRef.current = difficulty;
      if (page > 0) {
        setPage(0);
      }
    }
  }, [difficulty, page]);

  // Filter client-side nếu có search query
  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allExercises;
    return allExercises.filter((ex) =>
      ex.name.toLowerCase().includes(q)
    );
  }, [allExercises, search]);

  // Khi không có query: dùng trực tiếp data từ server (đã được paginate)
  // Khi có query: paginate client-side trên filteredExercises
  const displayExercises = hasQuery
    ? (() => {
        const startIndex = page * size;
        const endIndex = startIndex + size;
        return filteredExercises.slice(startIndex, endIndex);
      })()
    : allExercises; // Backend đã paginate rồi, dùng trực tiếp

  const displayTotalElements = hasQuery ? filteredExercises.length : totalElements;
  const displayTotalPages = hasQuery
    ? Math.ceil(filteredExercises.length / size)
    : totalPages;

  // Get muscle groups from all exercises for filter dropdown
  const muscleGroupOptions = Array.from(
    new Set(
      allExercises
        .map((ex) => ex.muscleGroup)
        .filter((g): g is string => !!g)
    )
  ).sort();

  return (
    <div className="px-6 py-10 min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header + Search + Filters */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3 dark:text-white">Thư viện bài tập</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Tìm kiếm bài tập theo tên, thiết bị hoặc nhóm cơ bạn muốn tập luyện.
        </p>

        <div className="relative max-w-xl mx-auto mb-5">
          <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên, nhóm cơ hoặc tag..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <select
            className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-700 dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          >
            <option value="ALL" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Tất cả nhóm cơ</option>
            {muscleGroupOptions.map((group) => (
              <option key={group} value={group} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {group}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-700 dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="ALL" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Tất cả độ khó</option>
            <option value="EASY" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Dễ</option>
            <option value="MEDIUM" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Trung bình</option>
            <option value="HARD" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Khó</option>
          </select>
        </div>
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <LoadingState message="Đang tải bài tập..." />
      ) : displayExercises.length === 0 ? (
        <p className="text-center text-gray-500">Không tìm thấy bài tập phù hợp.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-center">
          {displayExercises.map((ex: Exercise) => (
            <div
              key={ex.id}
              onClick={() => {
                setSelectedId(ex.id);
                setOpenModal(true);
              }}
              className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="relative">
                <img
                  src={ex.mediaList?.[0]?.url || "/placeholder-exercise.png"}
                  alt={ex.name}
                  className="w-full h-56 object-contain p-2"
                />
              </div>
              <div className="p-3 text-left">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{ex.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {ex.muscleGroup || "Không xác định"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {displayTotalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-gray-400 w-full">
            <div>
              Hiển thị{" "}
              <span className="font-medium text-slate-900">
                {displayTotalElements === 0 ? 0 : page * size + 1}
              </span>
              {" - "}
              <span className="font-medium text-slate-900">
                {Math.min((page + 1) * size, displayTotalElements)}
              </span>
              {" trong tổng số "}
              <span className="font-medium text-slate-900">{displayTotalElements}</span>
              {" bài tập"}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPage((prev) => Math.max(prev - 1, 0));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === 0}
                className="px-3 py-1 border border-slate-200 dark:border-gray-700 rounded hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              {Array.from({ length: Math.min(displayTotalPages, 5) }, (_, i) => {
                let pageNum = i;
                if (displayTotalPages > 5) {
                  if (page < 3) pageNum = i;
                  else if (page > displayTotalPages - 3) pageNum = displayTotalPages - 5 + i;
                  else pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setPage(pageNum);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-3 py-1 rounded border ${
                      page === pageNum
                        ? "bg-slate-900 dark:bg-blue-700 text-white border-slate-900 dark:border-blue-700"
                        : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setPage((prev) => Math.min(prev + 1, displayTotalPages - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === displayTotalPages - 1}
                className="px-3 py-1 border border-slate-200 dark:border-gray-700 rounded hover:bg-slate-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <ExerciseDetailModal
        id={selectedId}
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
}
