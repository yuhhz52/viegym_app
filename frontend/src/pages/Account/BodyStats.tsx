import { Dumbbell, Ruler, Scale, Activity } from "lucide-react";
import type { UserInfo } from "@/types/auth";

interface BodyStatsProps {
  user: UserInfo;
}

export function BodyStats({ user }: BodyStatsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 flex items-center gap-2">
        <Dumbbell size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-slate-800 dark:text-white">Chỉ số cơ thể</h3>
      </div>
      {[
        { icon: Ruler, label: "Chiều cao", value: user.heightCm ? `${user.heightCm} cm` : "Chưa cập nhật" },
        { icon: Scale, label: "Cân nặng", value: user.weightKg ? `${user.weightKg} kg` : "Chưa cập nhật" },
        { icon: Activity, label: "Tỉ lệ mỡ", value: user.bodyFatPercent ? `${user.bodyFatPercent}%` : "Chưa cập nhật" },
      ].map((stat, i) => (
        <div key={i} className={`flex items-center justify-between px-4 py-3 ${i !== 2 ? "border-b border-slate-100 dark:border-gray-700" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
              <stat.icon size={16} className="text-slate-500 dark:text-gray-400" />
            </div>
            <span className="text-slate-600 dark:text-gray-300">{stat.label}</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-white">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
