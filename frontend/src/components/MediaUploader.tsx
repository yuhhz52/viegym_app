import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import apiClient from "@/api/apiClient";

interface MediaItem {
  url: string;
  mediaType: string;
  caption?: string;
  orderNo: number;
}

interface MediaUploaderProps {
  label?: string;
  mediaList: MediaItem[];
  onMediaChange: (mediaList: MediaItem[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  acceptedTypesLabel?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function MediaUploader({
  label = "Hình ảnh",
  mediaList,
  onMediaChange,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  acceptedTypesLabel = "JPEG, PNG, GIF, WebP",
  multiple = false,
  disabled = false
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSizeBytes = maxSize * 1024 * 1024;
    const filesToUpload = Array.from(files);

    // Validate all files first
    for (const file of filesToUpload) {
      if (file.size > maxSizeBytes) {
        setError(`Kích thước file phải nhỏ hơn ${maxSize}MB`);
        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        setError(`Chỉ hỗ trợ file: ${acceptedTypesLabel}`);
        return;
      }
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Upload files sequentially to avoid overwhelming the server
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post<any>('/api/media/upload', formData);
        const uploadedUrl = res.data.result || res.data.url;
        
        if (!uploadedUrl) {
          throw new Error('Không nhận được URL từ server');
        }

        uploadedUrls.push(uploadedUrl);
      }

      // Create new media items
      const newMediaItems = uploadedUrls.map((url, index) => ({
        url,
        mediaType: filesToUpload[index].type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        orderNo: mediaList.length + index + 1
      }));

      onMediaChange([...mediaList, ...newMediaItems]);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload thất bại';
      console.error('Upload error:', err);
      setError(errorMsg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = [...mediaList];
    updated.splice(index, 1);
    // Re-order remaining items
    const reordered = updated.map((item, idx) => ({
      ...item,
      orderNo: idx + 1
    }));
    onMediaChange(reordered);
  };

  const inputId = `media-uploader-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <input
        id={inputId}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        multiple={multiple}
        style={{ display: 'none' }}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || disabled}
        className="w-full gap-2"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Đang tải...' : `Tải lên ${label.toLowerCase()}`}
      </Button>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {/* Media Preview Grid */}
      {mediaList && mediaList.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {mediaList.map((media, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {media.mediaType === 'VIDEO' ? (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMedia(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {(!mediaList || mediaList.length === 0) && (
        <div className="flex items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center text-gray-400">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Chưa có {label.toLowerCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
