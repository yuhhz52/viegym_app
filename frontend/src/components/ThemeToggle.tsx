import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { userApi } from "@/api/userApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const authState = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!authState?.user;
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;

    const newTheme = theme === "light" ? "dark" : "light";
    
    // Update UI immediately
    toggleTheme();

    // Sync với backend nếu user đã login
    if (isAuthenticated) {
      setLoading(true);
      try {
        await userApi.updateSettings({
          darkMode: newTheme === "dark",
        });
        console.log("✅ Theme synced with backend");
      } catch (error) {
        console.error("❌ Failed to sync theme:", error);
        // Rollback nếu API fail
        setTheme(theme);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="relative w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Toggle theme"
      title={theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-800" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
}
