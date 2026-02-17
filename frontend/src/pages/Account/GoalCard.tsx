import { Target, ChevronRight } from "lucide-react";
import type { UserInfo } from "@/types/auth";
import { translateGoal } from "./utils";

interface GoalCardProps {
  user: UserInfo;
}

export function GoalCard({ user }: GoalCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-slate-700 dark:from-blue-700 dark:to-gray-800 rounded-xl p-4 mt-4 shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center">
          <Target size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-blue-100 dark:text-blue-200 text-sm">Mục tiêu hiện tại</p>
          <p className="text-white font-bold">{translateGoal(user.goal)}</p>
        </div>
        <ChevronRight size={20} className="text-white/60" />
      </div>
    </div>
  );
}
