import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Filter, Dumbbell } from "lucide-react";

interface ExercisesFiltersProps {
  query: string;
  setQuery: (value: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (difficulty: string) => void;
  muscleGroupFilter: string;
  setMuscleGroupFilter: (muscleGroup: string) => void;
  difficultyDropdownOpen: boolean;
  setDifficultyDropdownOpen: (open: boolean) => void;
  muscleGroupDropdownOpen: boolean;
  setMuscleGroupDropdownOpen: (open: boolean) => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

export function ExercisesFilters({
  query,
  setQuery,
  difficultyFilter,
  setDifficultyFilter,
  muscleGroupFilter,
  setMuscleGroupFilter,
  difficultyDropdownOpen,
  setDifficultyDropdownOpen,
  muscleGroupDropdownOpen,
  setMuscleGroupDropdownOpen,
  selectedCount,
  onBulkDelete,
}: ExercisesFiltersProps) {
  const getDifficultyLabel = (value: string) => {
    const labels: Record<string, string> = {
      ALL: "Tất cả",
      EASY: "Dễ",
      MEDIUM: "Trung bình",
      HARD: "Khó",
    };
    return labels[value] || value;
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Box */}
      <div className="relative w-[400px] flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Tìm kiếm bài tập..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200 focus-visible:ring-slate-400 transition-all"
        />
      </div>

      {/* Difficulty Filter Dropdown */}
      <div className="relative w-[240px] flex-shrink-0">
        <button
          onClick={() => setDifficultyDropdownOpen(!difficultyDropdownOpen)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-600 text-sm whitespace-nowrap">Độ khó:</span>
            <span className="font-medium text-sm truncate flex-1">{getDifficultyLabel(difficultyFilter)}</span>
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {difficultyDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="py-1">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'EASY', label: 'Dễ' },
                { value: 'MEDIUM', label: 'Trung bình' },
                { value: 'HARD', label: 'Khó' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDifficultyFilter(option.value);
                    setDifficultyDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${difficultyFilter === option.value ? 'bg-slate-50 font-medium' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Muscle Group Filter Dropdown */}
      <div className="relative w-[240px] flex-shrink-0">
        <button
          onClick={() => setMuscleGroupDropdownOpen(!muscleGroupDropdownOpen)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-600 text-sm whitespace-nowrap">Nhóm cơ:</span>
            <span className="font-medium text-sm truncate flex-1">{muscleGroupFilter === 'ALL' ? 'Tất cả' : muscleGroupFilter}</span>
            <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {muscleGroupDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'Ngực', label: 'Ngực' },
                { value: 'Lưng', label: 'Lưng' },
                { value: 'Chân', label: 'Chân' },
                { value: 'Vai', label: 'Vai' },
                { value: 'Cánh tay trước', label: 'Cánh tay trước' },
                { value: 'Cánh tay sau', label: 'Cánh tay sau' },
                { value: 'Core', label: 'Core' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setMuscleGroupFilter(option.value);
                    setMuscleGroupDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${muscleGroupFilter === option.value ? 'bg-slate-50 font-medium' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      {selectedCount === 0 && <div className="flex-1 min-w-0" />}

      {/* Bulk Delete Button */}
      {selectedCount > 0 && (
        <Button
          variant="destructive"
          className="gap-2 ml-auto"
          onClick={onBulkDelete}
        >
          <Trash2 className="w-4 h-4" />
          Xóa ({selectedCount})
        </Button>
      )}
    </div>
  );
}
