import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Dumbbell } from "lucide-react";
import type { ProgramResponse } from "./type";

interface ProgramsTableProps {
  programs: ProgramResponse[];
  selectedProgramIds: Set<string>;
  onToggleSelection: (programId: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (program: ProgramResponse) => void;
  onDelete: (id: string, name: string) => void;
  onViewExercises: (program: ProgramResponse) => void;
}

export function ProgramsTable({ programs, selectedProgramIds, onToggleSelection, onToggleSelectAll, onEdit, onDelete, onViewExercises }: ProgramsTableProps) {
  const getGoalColor = (goal: string) => {
    switch (goal?.toUpperCase()) {
      case "WEIGHT_LOSS": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "MUSCLE_GAIN": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "STRENGTH": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "ENDURANCE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "FLEXIBILITY": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "GENERAL_FITNESS": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getGoalText = (goal: string) => {
    switch (goal?.toUpperCase()) {
      case "WEIGHT_LOSS": return "Giảm cân";
      case "MUSCLE_GAIN": return "Tăng cơ";
      case "STRENGTH": return "Tăng sức mạnh";
      case "ENDURANCE": return "Tăng sức bền";
      case "FLEXIBILITY": return "Tăng độ dẻo";
      case "GENERAL_FITNESS": return "Thể lực tổng quát";
      default: return goal;
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900">
            <TableHead className="w-12">
              <input
                type="checkbox"
                className="rounded border-gray-300 cursor-pointer"
                checked={selectedProgramIds.size === programs.length && programs.length > 0}
                onChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead className="font-semibold w-[20%]">Tên chương trình</TableHead>
            <TableHead className="font-semibold w-[30%]">Mô tả</TableHead>
            <TableHead className="font-semibold w-[12%]">Mục tiêu</TableHead>
            <TableHead className="font-semibold w-[10%]">Thời lượng</TableHead>
            <TableHead className="font-semibold w-[13%]">Người tạo</TableHead>
            <TableHead className="font-semibold text-right w-[15%]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Chưa có chương trình nào
              </TableCell>
            </TableRow>
          ) : (
            programs.map((program) => (
              <TableRow key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 cursor-pointer"
                    checked={selectedProgramIds.has(program.id)}
                    onChange={() => onToggleSelection(program.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{program.title || program.name}</TableCell>
                <TableCell className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                  {program.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge className={getGoalColor(program.goal || "GENERAL_FITNESS")}>
                    {getGoalText(program.goal || "GENERAL_FITNESS")}
                  </Badge>
                </TableCell>
                <TableCell>{program.durationWeeks} tuần</TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {program.createdByName || "—"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewExercises(program)}
                    className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                    title="Xem bài tập"
                  >
                    <Dumbbell className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(program)}
                    className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(program.id, program.title || program.name || "")}
                    className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
