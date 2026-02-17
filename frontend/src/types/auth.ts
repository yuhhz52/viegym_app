export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string; 
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  bodyFatPercent?: number;
  experienceLevel?: string;
  goal?: string;
  avatarUrl?: string;
  status?: string;
  isActive?: boolean;
  roles?: string[];

  // Stats
  streakDays?: number;
  lastStreakUpdate?: string;
  totalWorkouts?: number;
  totalVolume?: number;

  // Daily Goals
  dailyWaterGoal?: number;
  dailyCalorieGoal?: number;
  dailyWorkoutMins?: number;

  darkMode?: boolean;
  notifications?: boolean;
  language?: string;

  accessToken?: string;
  refreshToken?: string;
}


export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface AuthState {
  user: UserInfo | null;    
  isLoading: boolean;
  error: string | null;
}
