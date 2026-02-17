import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ProgramResponse, ProgramExercise } from "./type";
import { getProgramExercisesAPI, deleteProgramExerciseAPI } from "./api";
import { AddExerciseToProgramDialog } from "./AddExerciseToProgramDialog";

interface ProgramExercisesDialogProps {
  open: boolean;
  onClose: () => void;
  program: ProgramResponse | null;
}

export function ProgramExercisesDialog({ open, onClose, program }: ProgramExercisesDialogProps) {
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchExercises = async () => {
    if (!program) return;
    setLoading(true);
    try {
      const data = await getProgramExercisesAPI(program.id);
      setExercises(data);
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
      toast.error("Không thể tải danh sách bài tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && program) {
      fetchExercises();
    }
  }, [open, program]);

  const handleDelete = async (exerciseId: string) => {
    try {
      await deleteProgramExerciseAPI(exerciseId);
      toast.success("Đã xóa bài tập");
      fetchExercises();
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      toast.error("Không thể xóa bài tập");
    }
  };

  const groupedByDay = exercises.reduce((acc, ex) => {
    if (!acc[ex.dayOfProgram]) {
      acc[ex.dayOfProgram] = [];
    }
    acc[ex.dayOfProgram].push(ex);
    return acc;
  }, {} as Record<number, ProgramExercise[]>);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bài tập trong chương trình: {program?.title || program?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Tổng số: <span className="font-semibold">{exercises.length}</span> bài tập
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-slate-900 hover:bg-slate-800"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm bài tập
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có bài tập nào trong chương trình
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDay)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([day, dayExercises]) => (
                    <div key={day} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">Ngày {day}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Bài tập</TableHead>
                            <TableHead>Nhóm cơ</TableHead>
                            <TableHead>Sets x Reps</TableHead>
                            <TableHead>Nghỉ</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayExercises
                            .sort((a, b) => a.orderNo - b.orderNo)
                            .map((ex) => (
                              <TableRow key={ex.id}>
                                <TableCell>{ex.orderNo}</TableCell>
                                <TableCell className="font-medium">
                                  {ex.exercise.name}
                                </TableCell>
                                <TableCell>{ex.exercise.muscleGroup || "—"}</TableCell>
                                <TableCell>
                                  {ex.sets} x {ex.reps}
                                </TableCell>
                                <TableCell>{ex.restSeconds}s</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(ex.id)}
                                    className="hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddExerciseToProgramDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        program={program}
        onSuccess={() => {
          setAddDialogOpen(false);
          fetchExercises();
        }}
      />
    </>
  );
}
