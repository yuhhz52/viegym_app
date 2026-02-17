import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";
import type { Exercise, ExerciseMedia } from "./type";

// MediaItem type from MediaUploader (without id)
interface MediaUploaderItem {
  url: string;
  mediaType: string;
  caption?: string;
  orderNo: number;
}

// Helper functions to convert between ExerciseMedia and MediaUploaderItem
const exerciseMediaToMediaItem = (media: ExerciseMedia): MediaUploaderItem => ({
  mediaType: media.mediaType,
  url: media.url,
  caption: media.caption || '',
  orderNo: media.orderNo ?? 0,
});

const mediaItemToExerciseMedia = (item: MediaUploaderItem, existingId?: string): ExerciseMedia => ({
  id: existingId || '',
  mediaType: item.mediaType,
  url: item.url,
  caption: item.caption,
  orderNo: item.orderNo,
});

interface ExerciseFormData {
  name: string;
  description: string;
  muscleGroup: string;
  difficulty: string;
  tags: string;
  mediaList?: ExerciseMedia[];
}

interface ExercisesDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  newExercise: ExerciseFormData;
  setNewExercise: (exercise: ExerciseFormData) => void;
  onCreateExercise: () => void;
  isCreating: boolean;

  editingExercise: Exercise | null;
  setEditingExercise: (exercise: Exercise | null) => void;
  onUpdateExercise: () => void;
  isUpdating: boolean;

  deleteConfirm: { open: boolean; id?: string; name?: string };
  setDeleteConfirm: (confirm: { open: boolean; id?: string; name?: string }) => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;

  bulkDeleteConfirm: { open: boolean; count: number };
  setBulkDeleteConfirm: (confirm: { open: boolean; count: number }) => void;
  onConfirmBulkDelete: () => void;
}

export function ExercisesDialogs({
  isAddDialogOpen,
  setIsAddDialogOpen,
  newExercise,
  setNewExercise,
  onCreateExercise,
  isCreating,

  editingExercise,
  setEditingExercise,
  onUpdateExercise,
  isUpdating,

  deleteConfirm,
  setDeleteConfirm,
  onConfirmDelete,
  isDeleting,

  bulkDeleteConfirm,
  setBulkDeleteConfirm,
  onConfirmBulkDelete,
}: ExercisesDialogsProps) {
  return (
    <>
      {/* ADD DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-slate-900 hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" />
            Thêm bài tập
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm bài tập mới</DialogTitle>
            <DialogDescription>
              Tạo bài tập mới với thông tin chi tiết
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên bài tập</Label>
              <Input
                id="name"
                placeholder="Tên bài tập"
                value={newExercise.name}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết bài tập"
                value={newExercise.description}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscleGroup">Nhóm cơ</Label>
              <Input
                id="muscleGroup"
                placeholder="VD: Ngực, Lưng, Chân"
                value={newExercise.muscleGroup}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, muscleGroup: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Độ khó</Label>
              <Select
                value={newExercise.difficulty}
                onValueChange={(value) =>
                  setNewExercise({ ...newExercise, difficulty: value })
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Dễ</SelectItem>
                  <SelectItem value="MEDIUM">Trung bình</SelectItem>
                  <SelectItem value="HARD">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="VD: tạ, ngực, người mới"
                value={newExercise.tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewExercise({ ...newExercise, tags: e.target.value })
                }
              />
            </div>
            
            <MediaUploader
              label="Hình ảnh/Video"
              mediaList={(newExercise.mediaList || []).map(exerciseMediaToMediaItem)}
              onMediaChange={(mediaList) =>
                setNewExercise({ 
                  ...newExercise, 
                  mediaList: mediaList.map(item => mediaItemToExerciseMedia(item))
                })
              }
              maxSize={10}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']}
              acceptedTypesLabel="JPEG, PNG, GIF, WebP, MP4"
              multiple={false}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewExercise({
                  name: "",
                  description: "",
                  muscleGroup: "",
                  difficulty: "",
                  tags: "",
                  mediaList: [],
                });
                setIsAddDialogOpen(false);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={onCreateExercise}
              disabled={isCreating || !newExercise.name.trim()}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isCreating ? "Đang tạo..." : "Tạo bài tập"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      {editingExercise && (
        <Dialog
          open={!!editingExercise}
          onOpenChange={(open) => {
            if (!open) setEditingExercise(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Tên bài tập</Label>
                <Input
                  id="editName"
                  placeholder="Tên bài tập"
                  value={editingExercise.name || ""}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Mô tả</Label>
                <Textarea
                  id="editDescription"
                  placeholder="Mô tả chi tiết bài tập"
                  value={editingExercise.description || ""}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMuscleGroup">Nhóm cơ</Label>
                <Input
                  id="editMuscleGroup"
                  placeholder="Nhóm cơ"
                  value={editingExercise.muscleGroup || ""}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      muscleGroup: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDifficulty">Độ khó</Label>
                <Select
                  value={editingExercise.difficulty || ""}
                  onValueChange={(value) =>
                    setEditingExercise({ ...editingExercise, difficulty: value })
                  }
                >
                  <SelectTrigger id="editDifficulty">
                    <SelectValue placeholder="Chọn độ khó" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Dễ</SelectItem>
                    <SelectItem value="MEDIUM">Trung bình</SelectItem>
                    <SelectItem value="HARD">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTags">Tags</Label>
                <Input
                  id="editTags"
                  placeholder="Tags"
                  value={
                    editingExercise.tags
                      ? Array.isArray(editingExercise.tags)
                        ? editingExercise.tags.join(", ")
                        : editingExercise.tags
                      : ""
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const tagsArray = e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag.length > 0);
                    setEditingExercise({ ...editingExercise, tags: tagsArray });
                  }}
                />
              </div>
              
              <MediaUploader
                label="Hình ảnh/Video"
                mediaList={(editingExercise.mediaList || []).map(exerciseMediaToMediaItem)}
                onMediaChange={(mediaList) =>
                  setEditingExercise({ 
                    ...editingExercise, 
                    mediaList: mediaList.map((item, idx) => {
                      const existing = editingExercise.mediaList?.[idx];
                      return mediaItemToExerciseMedia(item, existing?.id);
                    })
                  })
                }
                maxSize={10}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']}
                acceptedTypesLabel="JPEG, PNG, GIF, WebP, MP4"
                multiple={false}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingExercise(null)}>
                Hủy
              </Button>
              <Button
                onClick={onUpdateExercise}
                disabled={isUpdating || !editingExercise.name.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {isUpdating ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm({ open: false });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài tập</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn xóa vĩnh viễn bài tập "<strong>{deleteConfirm.name}</strong>"? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false })}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={bulkDeleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteConfirm({ open: false, count: 0 });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài tập</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn xóa vĩnh viễn <strong>{bulkDeleteConfirm.count} bài tập</strong> này? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkDeleteConfirm({ open: false, count: 0 })}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa tất cả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
