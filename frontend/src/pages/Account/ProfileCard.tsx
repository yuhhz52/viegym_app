import { Camera, Mail } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import type { UserInfo } from "@/types/auth";
import { translateGender, translateExperienceLevel } from "./utils";

interface ProfileCardProps {
  user: UserInfo;
  previewUrl: string | null;
  selectedFile: File | null;
  uploading: boolean;
  error: string | null;
  success: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
}

export function ProfileCard({
  user,
  previewUrl,
  selectedFile,
  uploading,
  error,
  success,
  onFileSelect,
  onUpload,
  onCancel,
}: ProfileCardProps) {
  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith("http")
        ? user.avatarUrl
        : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/media/${user.avatarUrl}`;
    }
    return "";
  };

  const getInitials = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-gray-700 transition-colors">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-slate-100 dark:border-gray-700 shadow-lg">
            <AvatarImage src={getAvatarUrl()} alt={user.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-600 to-slate-700 dark:from-orange-700 dark:to-gray-800 text-white text-3xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="avatar-input" className="absolute -bottom-1 -right-1 p-2 rounded-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition shadow-lg cursor-pointer">
            <Camera size={14} className="text-white" />
          </label>
          <input type="file" id="avatar-input" accept="image/*" onChange={onFileSelect} className="hidden" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.fullName}</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-1">
            <Mail size={14} />
            {user.email}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-medium">
              {translateExperienceLevel(user.experienceLevel)}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 text-xs font-medium">
              {translateGender(user.gender)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4 text-center bg-red-50 dark:bg-red-950 p-2 rounded-lg">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-400 text-sm mt-4 text-center bg-green-50 dark:bg-green-950 p-2 rounded-lg">{success}</p>}

      {/* Upload Section */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-gray-700 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-gray-300 text-center mb-3">
            Tệp: <span className="font-medium text-slate-800 dark:text-white">{selectedFile.name}</span>
          </p>
          <div className="flex gap-2">
            <Button onClick={onUpload} disabled={uploading} className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white">
              <Upload size={16} className="mr-2" />
              {uploading ? "Đang tải..." : "Tải lên"}
            </Button>
            <Button onClick={onCancel} disabled={uploading} variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
              <X size={16} className="mr-2" />
              Hủy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
