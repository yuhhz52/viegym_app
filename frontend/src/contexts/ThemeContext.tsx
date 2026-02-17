import { createContext, useContext, useEffect, useState,type ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const authState = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!authState?.user;

  const [theme, setThemeState] = useState<Theme>(() => {
    // Lấy theme từ localStorage hoặc mặc định là "light"
    const savedTheme = localStorage.getItem("viegym-theme") as Theme;
    return savedTheme || "light";
  });

  // Sync theme từ user data khi login
  useEffect(() => {
    if (isAuthenticated && authState?.user) {
      const userDarkMode = (authState.user as any).darkMode ?? false;
      const userTheme: Theme = userDarkMode ? "dark" : "light";
      setThemeState(userTheme);
      localStorage.setItem("viegym-theme", userTheme);
    }
  }, [isAuthenticated, authState?.user]);

  useEffect(() => {
    // Apply theme class vào document root
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Lưu vào localStorage
    localStorage.setItem("viegym-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
