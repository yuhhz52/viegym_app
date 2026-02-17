import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploader } from "@/components/MediaUploader";
import type { ProgramRequest } from "./type";

interface AddEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  program: ProgramRequest;
  setProgram: (program: ProgramRequest) => void;
  isEdit: boolean;
}

export function AddEditProgramDialog({ open, onClose, onSave, program, setProgram, isEdit }: AddEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa chương trình" : "Thêm chương trình mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên chương trình *</Label>
            <Input
              id="title"
              value={program.title}
              onChange={(e) => setProgram({ ...program, title: e.target.value })}
              placeholder="VD: Full Body Workout"
            />
          </div>
          
          <MediaUploader
            label="Hình ảnh chương trình"
            mediaList={(program.mediaList || []).map(item => ({
              ...item,
              orderNo: item.orderNo !== undefined ? item.orderNo : 0
            }))}
            onMediaChange={(mediaList) => setProgram({ ...program, mediaList })}
            maxSize={10}
            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
            acceptedTypesLabel="JPEG, PNG, GIF, WebP"
            multiple={false}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={program.description}
              onChange={(e) => setProgram({ ...program, description: e.target.value })}
              placeholder="Mô tả chi tiết về chương trình..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Mục tiêu *</Label>
              <Select
                value={program.goal}
                onValueChange={(value) => setProgram({ ...program, goal: value })}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Chọn mục tiêu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEIGHT_LOSS">Giảm cân</SelectItem>
                  <SelectItem value="MUSCLE_GAIN">Tăng cơ</SelectItem>
                  <SelectItem value="STRENGTH">Tăng sức mạnh</SelectItem>
                  <SelectItem value="ENDURANCE">Tăng sức bền</SelectItem>
                  <SelectItem value="FLEXIBILITY">Tăng độ dẻo</SelectItem>
                  <SelectItem value="GENERAL_FITNESS">Thể lực tổng quát</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationWeeks">Thời lượng (tuần) *</Label>
              <Input
                id="durationWeeks"
                type="number"
                min="1"
                value={program.durationWeeks}
                onChange={(e) => setProgram({ ...program, durationWeeks: parseInt(e.target.value) || 0 })}
                placeholder="VD: 12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Hiển thị *</Label>
            <Select
              value={program.visibility}
              onValueChange={(value) => setProgram({ ...program, visibility: value })}
            >
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Chọn quyền hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Công khai</SelectItem>
                <SelectItem value="PRIVATE">Riêng tư</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSave} className="bg-slate-900 hover:bg-slate-800">
            {isEdit ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  programName?: string;
}

export function DeleteProgramDialog({ open, onClose, onConfirm, programName }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
        </DialogHeader>
        <p className="text-gray-600 dark:text-gray-400">
          Bạn có chắc muốn xóa chương trình <strong>"{programName}"</strong>?
          <br />
          Hành động này không thể hoàn tác.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm}>Xóa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
