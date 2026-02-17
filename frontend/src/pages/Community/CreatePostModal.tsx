import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Image, X, Loader2 } from "lucide-react";
import { uploadMedia, createPost, type CreatePostRequest } from "./api";
import type { UserInfo, CommunityPost } from "./type";

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserInfo | null;
  onPostCreated: (post: CommunityPost) => void;
}

export default function CreatePostModal({ open, onClose, user, onPostCreated }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidSize) {
        alert(`File ${file.name} quá lớn. Tối đa 10MB`);
        return false;
      }

      if (!isImage && !isVideo) {
        alert(`File ${file.name} không hợp lệ. Chỉ chấp nhận ảnh/video`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setPosting(true);

      // Upload media files first
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploading(true);
        const uploadPromises = mediaFiles.map(file => uploadMedia(file));
        mediaUrls = await Promise.all(uploadPromises);
        setUploading(false);
      }

      // Create post
      const postData: CreatePostRequest = {
        title: title.trim() || undefined,
        content: content.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      };

      const newPost = await createPost(postData);
      onPostCreated(newPost);

      // Reset form
      setTitle("");
      setContent("");
      setMediaFiles([]);
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      setMediaPreviews([]);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Không thể tạo bài viết. Vui lòng thử lại");
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-post-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Chia sẻ hành trình của bạn
          </DialogTitle>
          <p id="create-post-description" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Truyền cảm hứng cho cộng đồng VieGym
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
            <Avatar className="w-12 h-12 ring-2 ring-orange-200 dark:ring-orange-800">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold dark:text-white">{user?.fullName || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400"> Chia sẻ công khai với cộng đồng</p>
            </div>
          </div>

          {/* Title (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề bài viết
            </label>
            <Input
              placeholder=""
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-orange-100 dark:border-orange-900 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung
            </label>
            <Textarea
              placeholder=""
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[140px] border-2 border-orange-100 dark:border-orange-900 resize-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500 text-base"
            />
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className={`grid gap-2 ${mediaPreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden">
                  {mediaFiles[index].type.startsWith("image/") ? (
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-48 object-cover" />
                  ) : (
                    <video src={preview} className="w-full h-48 object-cover" controls />
                  )}
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-2 right-2 p-1.5 bg-gray-900/80 text-white rounded-full hover:bg-gray-900 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media Upload Button */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-800">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thêm ảnh</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Chia sẻ hình ảnh của bạn
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Image size={18} className="mr-1" />
                Chọn file
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || posting || uploading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-6 text-base shadow-lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang tải ảnh/video lên...
              </>
            ) : posting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang chia sẻ với cộng đồng...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Chia sẻ ngay
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
