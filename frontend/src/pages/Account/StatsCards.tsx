import { Flame, Trophy, TrendingUp } from "lucide-react";
import type { UserInfo } from "@/types/auth";

interface StatsCardsProps {
  user: UserInfo;
}

export function StatsCards({ user }: StatsCardsProps) {
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  const stats = [
    { icon: Flame, label: "Chuỗi ngày", value: user.streakDays || 0, unit: "ngày", color: "bg-gradient-to-br from-orange-500 to-red-500", displayValue: `${user.streakDays || 0}` },
    { icon: Trophy, label: "Bài tập", value: user.totalWorkouts || 0, unit: "", color: "bg-gradient-to-br from-blue-500 to-indigo-600", displayValue: `${user.totalWorkouts || 0}` },
    { icon: TrendingUp, label: "Tổng tạ", value: user.totalVolume || 0, unit: "kg", color: "bg-gradient-to-br from-purple-500 to-pink-500", displayValue: formatVolume(user.totalVolume || 0) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-gray-700 text-center transition-all hover:shadow-md hover:scale-105">
          <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
            <stat.icon size={18} className="text-white" />
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white">
            {stat.displayValue}
            {stat.unit && <span className="text-xs ml-1 font-normal text-slate-500 dark:text-gray-400">{stat.unit}</span>}
          </p>
          <p className="text-slate-500 dark:text-gray-400 text-xs mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
