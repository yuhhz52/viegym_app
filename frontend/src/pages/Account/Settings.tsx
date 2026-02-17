import { Bell, Moon } from "lucide-react";

interface SettingsProps {
  notifications: boolean;
  darkMode: boolean;
  saving: boolean;
  onNotificationsToggle: (value: boolean) => void;
  onDarkModeToggle: (value: boolean) => void;
}

function SettingToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? "bg-orange-600 dark:bg-orange-500" : "bg-slate-300 dark:bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function Settings({
  notifications,
  darkMode,
  saving,
  onNotificationsToggle,
  onDarkModeToggle,
}: SettingsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
        <h3 className="font-bold text-slate-800 dark:text-white">Cài đặt</h3>
      </div>

      {/* Notifications Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Bell size={18} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <span className="text-slate-700 dark:text-gray-200 font-medium">Thông báo</span>
            <p className="text-xs text-slate-500 dark:text-gray-400">Nhận thông báo về hoạt động</p>
          </div>
        </div>
        <SettingToggle value={notifications} onChange={onNotificationsToggle} disabled={saving} />
      </div>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
            <Moon size={18} className="text-slate-600 dark:text-gray-300" />
          </div>
          <div>
            <span className="text-slate-700 dark:text-gray-200 font-medium">Chế độ tối</span>
            <p className="text-xs text-slate-500 dark:text-gray-400">Giao diện tối cho mắt</p>
          </div>
        </div>
        <SettingToggle value={darkMode} onChange={onDarkModeToggle} disabled={saving} />
      </div>
    </div>
  );
}
