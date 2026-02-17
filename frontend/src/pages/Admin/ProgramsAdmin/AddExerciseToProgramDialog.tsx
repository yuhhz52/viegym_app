import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ProgramResponse, ProgramExerciseRequest } from "./type";
import { addExerciseToProgramAPI } from "./api";
import { getExercisesAPI } from "../ExercisesAdmin/api";
import type { Exercise } from "../ExercisesAdmin/type";

interface AddExerciseToProgramDialogProps {
  open: boolean;
  onClose: () => void;
  program: ProgramResponse | null;
  onSuccess: () => void;
}

export function AddExerciseToProgramDialog({ open, onClose, program, onSuccess }: AddExerciseToProgramDialogProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  
  const [formData, setFormData] = useState<ProgramExerciseRequest>({
    exerciseId: "",
    dayOfProgram: 1,
    orderNo: 1,
    sets: 3,
    reps: "10",
    restSeconds: 60,
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  const fetchExercises = async () => {
    try {
      const data = await getExercisesAPI({ page: 0, size: 100 });
      setExercises(data.exercises);
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
      toast.error("Không thể tải danh sách bài tập");
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!program || !selectedExerciseId) {
      toast.error("Vui lòng chọn bài tập");
      return;
    }

    try {
      await addExerciseToProgramAPI(program.id, {
        ...formData,
        exerciseId: selectedExerciseId
      });
      toast.success("Đã thêm bài tập vào chương trình");
      onSuccess();
      resetForm();
    } catch (error) {
      console.error("Failed to add exercise:", error);
      toast.error("Không thể thêm bài tập");
    }
  };

  const resetForm = () => {
    setSelectedExerciseId("");
    setSearchQuery("");
    setFormData({
      exerciseId: "",
      dayOfProgram: 1,
      orderNo: 1,
      sets: 3,
      reps: "10",
      restSeconds: 60,
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm bài tập vào chương trình</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Exercise */}
          <div className="space-y-2">
            <Label>Tìm bài tập</Label>
            <Input
              placeholder="Tìm kiếm bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Không tìm thấy bài tập</div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedExerciseId === ex.id ? "bg-orange-50 border-orange-200" : ""
                    }`}
                  >
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-sm text-gray-500">{ex.muscleGroup}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Exercise Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfProgram">Ngày tập *</Label>
              <Input
                id="dayOfProgram"
                type="number"
                min="1"
                value={formData.dayOfProgram}
                onChange={(e) => setFormData({ ...formData, dayOfProgram: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNo">Thứ tự *</Label>
              <Input
                id="orderNo"
                type="number"
                min="1"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets *</Label>
              <Input
                id="sets"
                type="number"
                min="1"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reps">Reps *</Label>
              <Input
                id="reps"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                placeholder="VD: 10, 8-12, AMRAP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restSeconds">Nghỉ (giây)</Label>
              <Input
                id="restSeconds"
                type="number"
                min="0"
                value={formData.restSeconds}
                onChange={(e) => setFormData({ ...formData, restSeconds: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú về kỹ thuật, trọng lượng..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedExerciseId}
            className="bg-slate-900 hover:bg-slate-800"
          >
            Thêm vào chương trình
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
