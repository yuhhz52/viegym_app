import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileEditModalProps {
  isOpen: boolean;
  saving: boolean;
  formData: {
    fullName: string;
    phone: string;
    gender: string;
    birthDate: string;
    heightCm: string;
    weightKg: string;
    bodyFatPercent: string;
    experienceLevel: string;
    goal: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ProfileEditModal({
  isOpen,
  saving,
  formData,
  onFormChange,
  onSave,
  onClose,
}: ProfileEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-xl mt-4 shadow-sm border border-slate-100 p-6 space-y-4">
      <h3 className="font-bold text-lg text-slate-800 mb-4">Chỉnh sửa hồ sơ</h3>

      <div>
        <label className="text-sm text-slate-600">Họ và tên</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => onFormChange("fullName", e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-600">Số điện thoại</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => onFormChange("phone", e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-600">Giới tính</label>
          <select
            value={formData.gender}
            onChange={(e) => onFormChange("gender", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Chọn giới tính</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Ngày sinh</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => onFormChange("birthDate", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-600">Chiều cao (cm)</label>
          <input
            type="number"
            value={formData.heightCm}
            onChange={(e) => onFormChange("heightCm", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Cân nặng (kg)</label>
          <input
            type="number"
            value={formData.weightKg}
            onChange={(e) => onFormChange("weightKg", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Tỉ lệ mỡ (%)</label>
          <input
            type="number"
            value={formData.bodyFatPercent}
            onChange={(e) => onFormChange("bodyFatPercent", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-600">Cấp độ kinh nghiệm</label>
          <select
            value={formData.experienceLevel}
            onChange={(e) => onFormChange("experienceLevel", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Chọn cấp độ</option>
            <option value="BEGINNER">Người mới bắt đầu</option>
            <option value="INTERMEDIATE">Trung bình</option>
            <option value="ADVANCED">Nâng cao</option>
            <option value="EXPERT">Chuyên gia</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Mục tiêu</label>
          <select
            value={formData.goal}
            onChange={(e) => onFormChange("goal", e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">Chọn mục tiêu</option>
            <option value="LOSE_WEIGHT">Giảm cân</option>
            <option value="BUILD_MUSCLE">Tăng cơ</option>
            <option value="MAINTAIN">Duy trì</option>
            <option value="IMPROVE_ENDURANCE">Cải thiện sức bền</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button onClick={onSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Save size={16} className="mr-2" />
          Lưu thay đổi
        </Button>
        <Button onClick={onClose} disabled={saving} variant="outline" className="flex-1">
          <X size={16} className="mr-2" />
          Hủy
        </Button>
      </div>
    </div>
  );
}
