import React from "react";
import { Clock, Droplets, Apple, Heart, Save, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserInfo } from "@/types/auth";

interface DailyGoalsProps {
  user: UserInfo;
  editing: boolean;
  goalsData: {
    dailyCalorieGoal: number;
    dailyWaterGoal: number;
    dailyWorkoutMins: number;
  };
  saving: boolean;
  onEdit: (value: boolean) => void;
  onGoalsChange: (field: string, value: number) => void;
  onSave: () => void;
  onCancel?: () => void;
}

export function DailyGoals({
  user: _user,
  editing,
  goalsData,
  saving,
  onEdit,
  onGoalsChange,
  onSave,
  onCancel,
}: DailyGoalsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm border border-slate-100 dark:border-gray-700 p-4 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-orange-600 dark:text-orange-400" />
          Mục tiêu hàng ngày
        </h3>
        {!editing && (
          <button onClick={() => onEdit(true)} className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-500 transition">
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <Droplets size={20} className="text-blue-500 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800 dark:text-white">{goalsData.dailyWaterGoal}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Ly nước</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-xl">
            <Apple size={20} className="text-green-500 dark:text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800 dark:text-white">{goalsData.dailyCalorieGoal}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Calories</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-xl">
            <Heart size={20} className="text-red-500 dark:text-red-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800 dark:text-white">{goalsData.dailyWorkoutMins}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Phút tập</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300">Mục tiêu nước hàng ngày (ly)</label>
            <input
              type="number"
              value={goalsData.dailyWaterGoal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onGoalsChange("dailyWaterGoal", parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300">Mục tiêu calories hàng ngày</label>
            <input
              type="number"
              value={goalsData.dailyCalorieGoal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onGoalsChange("dailyCalorieGoal", parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300">Mục tiêu tập luyện hàng ngày (phút)</label>
            <input
              type="number"
              value={goalsData.dailyWorkoutMins}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onGoalsChange("dailyWorkoutMins", parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={onSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800">
              <Save size={16} className="mr-2" />
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button onClick={() => onCancel ? onCancel() : onEdit(false)} disabled={saving} variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <X size={16} className="mr-2" />
              Hủy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
