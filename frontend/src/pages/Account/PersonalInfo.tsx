import { User, Calendar } from "lucide-react";
import type { UserInfo } from "@/types/auth";
import { translateGender } from "./utils";

interface PersonalInfoProps {
  user: UserInfo;
}

export function PersonalInfo({ user }: PersonalInfoProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 flex items-center gap-2">
        <User size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-slate-800 dark:text-white">Thông tin cá nhân</h3>
      </div>
      {[
        { icon: Calendar, label: "Ngày sinh", value: user.birthDate || "Chưa cập nhật" },
        { icon: User, label: "Giới tính", value: translateGender(user.gender) },
      ].map((item, i) => (
        <div key={i} className={`flex items-center justify-between px-4 py-3 ${i === 0 ? "border-b border-slate-100 dark:border-gray-700" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
              <item.icon size={16} className="text-slate-500 dark:text-gray-400" />
            </div>
            <span className="text-slate-600 dark:text-gray-300">{item.label}</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
