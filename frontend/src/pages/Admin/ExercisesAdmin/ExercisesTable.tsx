import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import type { Exercise } from "./type";

interface ExercisesTableProps {
  exercises: Exercise[];
  page: number;
  size: number;
  selectedExerciseIds: Set<string>;
  onToggleSelection: (exerciseId: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  isDeletePending: boolean;
}

export function ExercisesTable({
  exercises,
  page: _page,
  size: _size,
  selectedExerciseIds,
  onToggleSelection,
  onToggleSelectAll,
  onEdit,
  onDelete,
  isDeletePending,
}: ExercisesTableProps) {
  const getDifficultyBadgeConfig = (difficulty?: string) => {
    const config: Record<string, { className: string; label: string }> = {
      HARD: {
        className: "text-red-600 border-red-300 font-normal",
        label: "Khó",
      },
      MEDIUM: {
        className: "text-yellow-600 border-yellow-300 font-normal",
        label: "Trung bình",
      },
      EASY: {
        className: "text-green-600 border-green-300 font-normal",
        label: "Dễ",
      },
    };
    return config[difficulty || "EASY"] || config.EASY;
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left p-4 font-semibold text-sm text-slate-700 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 cursor-pointer"
                    checked={selectedExerciseIds.size === exercises.length && exercises.length > 0}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Tên bài tập</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Nhóm cơ</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Độ khó</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700">Tags</th>
                <th className="text-left p-4 font-semibold text-sm text-slate-700 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {exercises.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <p className="font-medium">Không tìm thấy bài tập nào</p>
                    <p className="text-sm">Thử điều chỉnh tìm kiếm của bạn</p>
                  </td>
                </tr>
              ) : (
                exercises.map((ex) => {
                  const difficultyConfig = getDifficultyBadgeConfig(ex.difficulty);

                  return (
                    <tr
                      key={ex.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 cursor-pointer"
                          checked={selectedExerciseIds.has(ex.id)}
                          onChange={() => onToggleSelection(ex.id)}
                        />
                      </td>
                      <td className="p-4 font-medium text-slate-900">{ex.name}</td>
                      <td className="p-4">
                        {ex.muscleGroup ? (
                          <Badge variant="secondary" className="capitalize font-normal">
                            {ex.muscleGroup}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {ex.difficulty ? (
                          <Badge variant="outline" className={difficultyConfig.className}>
                            {difficultyConfig.label}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {ex.tags && ex.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ex.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs font-normal">
                                {tag}
                              </Badge>
                            ))}
                            {ex.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{ex.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => onEdit(ex)}
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => onDelete(ex)}
                            disabled={isDeletePending}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
