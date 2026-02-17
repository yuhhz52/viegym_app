import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { API_BASE_URL } from '@/constants/api';

// API Response wrapper (matching web app)
export interface ApiResponse<T> {
  result: T;
  code: number;
  message: string;
}

// Auth types (matching web app)
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  fullName: string;
  roles: string[];
  avatar?: string;
  avatarUrl?: string;
  createdDate?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  bodyFatPercent?: number;
  experienceLevel?: string;
  goal?: string;
  status?: string;
  isActive?: boolean;
  
  // Stats
  streakDays?: number;
  lastStreakUpdate?: string;
  totalWorkouts?: number;
  totalVolume?: number;
  
  // Daily Goals
  dailyCalorieGoal?: number;
  dailyWaterGoal?: number;
  dailyWorkoutMins?: number;
  
  // Settings
  darkMode?: boolean;
  notifications?: boolean;
  language?: string;
}

// Program Exercise type (matching backend ProgramExerciseResponse)
export interface ProgramExerciseResponse {
  id?: string;
  dayOfProgram?: number;
  orderNo?: number;
  sets?: number;
  reps?: string;
  weightScheme?: string;
  restSeconds?: number;
  notes?: string;
  exercise?: {
    id: string;
    name?: string;
    muscleGroup?: string;
    difficulty?: string;
    equipment?: string;
    description?: string;
    instructions?: string;
    mediaList?: Array<{
      id?: string;
      url: string;
      mediaType?: 'IMAGE' | 'VIDEO';
      orderNo?: number;
    }>;
  };
}

// Workout types (matching web app)
export interface WorkoutProgramResponse {
  id: string;
  title: string;
  name?: string;
  description?: string;
  exercises?: ProgramExerciseResponse[]; // Changed from ExerciseResponse[] to ProgramExerciseResponse[]
  durationWeeks?: number;
  duration?: number;
  difficulty?: string;
  level?: string;
  intensity?: string;
  goal?: string;
  creatorName?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  mediaList?: Array<{
    id?: string;
    url: string;
    mediaType?: 'IMAGE' | 'VIDEO';
    orderNo?: number;
  }>;
  visibility?: 'PUBLIC' | 'PRIVATE';
  createdByName?: string;
}

export interface WorkoutSessionRequest {
  programId?: string;
  sessionDate: string;
  durationMinutes: number;
  notes?: string;
}

export interface WorkoutSessionResponse {
  id: string;
  programId?: string;
  sessionDate: string;
  durationMinutes: number;
  notes?: string;
  userId: string;
  createdDate: string;
  updatedDate: string;
}

export interface ExerciseResponse {
  id: string;
  name: string;
  description?: string;
  muscleGroup?: string;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
  instructions?: string[];
  tags?: string[];
  metadata?: any;
  mediaList?: ExerciseMedia[];
}

export interface ExerciseMedia {
  id: string;
  mediaType: string;
  url: string;
  caption?: string;
  orderNo?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export interface CoachResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  certifications?: string[];
  rating?: number;
  clientCount?: number;
}

export interface SessionExerciseLogRequest {
  sessionId?: string; // Optional - can be passed in URL
  exerciseId: string;
  setNumber?: number;
  repsDone?: number;
  weightUsed?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  bodyWeight?: number;
  completed?: boolean;
  setNotes?: string;
  // Legacy format support
  sets?: SetRequest[];
  restTime?: number;
  notes?: string;
}

export interface SessionExerciseLogResponse {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber?: number;
  repsDone?: number;
  weightUsed?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  bodyWeight?: number;
  setNotes?: string;
  completed?: boolean;
  volume?: number;
  displayValue?: string;
  createdAt?: string;
  updatedAt?: string;
  exercise?: ExerciseResponse;
  // Legacy support for old format
  sets?: SetResponse[];
  restTime?: number;
  notes?: string;
}

export interface SetRequest {
  reps: number;
  weight: number;
  restTime?: number;
  notes?: string;
}

export interface SetResponse {
  id: string;
  reps: number;
  weight: number;
  restTime?: number;
  notes?: string;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem('refreshToken');
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        return null;
      }

      const requestBody = JSON.stringify({
        refreshToken: refreshToken
      });

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        body: requestBody,
      });

      if (!response.ok) {
        if (response.status === 403) {
          await AsyncStorage.multiRemove(['token', 'refreshToken']);
        } else {
          await AsyncStorage.removeItem('token');
        }
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.result?.accessToken || data.result?.token;
      const newRefreshToken = data.result?.refreshToken;
      
      if (newAccessToken) {
        await AsyncStorage.setItem('token', newAccessToken);
        
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }
        
        return newAccessToken;
      }

      return null;
    } catch (error) {
      console.error('Refresh token error:', error);
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
      return null;
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Required for ngrok
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401 && !isRetry) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onRefreshed(newToken);
            // Retry the original request with new token
            return this.request<T>(endpoint, options, true);
          } else {
            const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            (error as any).isAuthError = true;
            (error as any).status = 401;
            throw error;
          }
        } else {
          // Wait for the token to be refreshed
          return new Promise((resolve, reject) => {
            this.addRefreshSubscriber(async (token: string) => {
              try {
                const result = await this.request<T>(endpoint, options, true);
                resolve(result);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      }
      
      const error = await response.json().catch(() => ({
        message: 'Network error',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }

  // Auth methods (matching web app)
  async login(data: LoginPayload): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Store tokens if available in response body
    if (response.result && 'accessToken' in response.result) {
      await AsyncStorage.setItem('token', (response.result as any).accessToken);
    }
    
    if (response.result && 'refreshToken' in response.result) {
      await AsyncStorage.setItem('refreshToken', (response.result as any).refreshToken);
    }
    
    return response.result;
  }

  async register(data: RegisterPayload): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
    }
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken?: string } | null> {
    const newToken = await this.refreshAccessToken();
    if (newToken) {
      const refreshToken = await this.getRefreshToken();
      return { 
        accessToken: newToken, 
        refreshToken: refreshToken || undefined 
      };
    }
    return null;
  }

  async getUserInfo(): Promise<ApiResponse<UserInfo>> {
    return await this.request<ApiResponse<UserInfo>>('/api/user/my-info');
  }

  async getMyInfo(): Promise<UserInfo> {
    const response = await this.getUserInfo();
    return response.result;
  }

  async getMyInfoWithCookies(): Promise<UserInfo> {
    const response = await fetch(`${this.baseURL}/api/user/my-info`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json() as ApiResponse<UserInfo>;
    return data.result;
  }

  async updateCurrentUser(data: Partial<UserInfo>): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/user/my-info', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async updateProfile(data: Partial<UserInfo>): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async updateSettings(data: {
    darkMode?: boolean;
    notifications?: boolean;
    language?: string;
  }): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async updateDailyGoals(data: {
    dailyCalorieGoal?: number;
    dailyWaterGoal?: number;
    dailyWorkoutMins?: number;
  }): Promise<UserInfo> {
    const response = await this.request<ApiResponse<UserInfo>>('/api/user/daily-goals', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async updateAvatar(formData: FormData): Promise<UserInfo> {
    try {
      const token = await this.getAuthToken();
      
      console.log('[Avatar] Auth token:', token ? 'Present' : 'Missing');
      console.log('[Avatar] API URL:', `${this.baseURL}/api/user/avatar`);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/api/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          // Don't set Content-Type for FormData - let the browser/RN set it with boundary
        },
        body: formData,
      });

      console.log('[Avatar] Response status:', response.status);
      console.log('[Avatar] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Avatar] Upload failed:', errorText);
        throw new Error(`Failed to upload avatar: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[Avatar] Upload response:', data);
      
      if (!data.result) {
        throw new Error('No result in response');
      }
      
      return data.result;
    } catch (error: any) {
      console.error('[Avatar] Upload error:', error);
      throw error;
    }
  }

  // Workout Programs (matching web app)
  async getWorkoutPrograms(): Promise<WorkoutProgramResponse[]> {
    const response = await this.request<ApiResponse<WorkoutProgramResponse[]>>('/api/programs');
    return response.result;
  }

  async getWorkoutProgram(id: string): Promise<WorkoutProgramResponse> {
    const response = await this.request<ApiResponse<WorkoutProgramResponse>>(`/api/programs/${id}`);
    return response.result;
  }

  async getPopularPrograms(limit: number = 10): Promise<WorkoutProgramResponse[]> {
    const response = await this.request<ApiResponse<WorkoutProgramResponse[]>>(`/api/programs/popular?limit=${limit}`);
    return response.result;
  }

  async getProgramStats(programId: string): Promise<{
    programId: string;
    averageRating: number;
    totalRatings: number;
    totalSaves: number;
    isSaved: boolean;
    userRating: number | null;
  }> {
    const response = await this.request<ApiResponse<any>>(`/api/programs/${programId}/stats`);
    return response.result;
  }

  async saveProgram(programId: string): Promise<void> {
    await this.request(`/api/programs/${programId}/save`, {
      method: 'POST',
    });
  }

  async unsaveProgram(programId: string): Promise<void> {
    await this.request(`/api/programs/${programId}/save`, {
      method: 'DELETE',
    });
  }

  async rateProgram(programId: string, data: { rating: number; review?: string }): Promise<any> {
    const response = await this.request<ApiResponse<any>>(`/api/programs/${programId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  async getSavedPrograms(): Promise<WorkoutProgramResponse[]> {
    const response = await this.request<ApiResponse<WorkoutProgramResponse[]>>('/api/programs/saved');
    return response.result || [];
  }

  async createUserProgram(data: {
    title: string;
    description?: string;
    goal?: string;
    durationWeeks?: number;
  }): Promise<WorkoutProgramResponse> {
    const response = await this.request<ApiResponse<WorkoutProgramResponse>>('/api/programs/my/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.result;
  }

  // Workout Sessions (matching web app)
  async createWorkoutSession(session: WorkoutSessionRequest): Promise<WorkoutSessionResponse> {
    const response = await this.request<ApiResponse<WorkoutSessionResponse>>('/api/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify({
        ...session,
        sessionDate: new Date(session.sessionDate).toISOString(),
      }),
    });
    return response.result;
  }

  async getWorkoutSessions(): Promise<WorkoutSessionResponse[]> {
    const response = await this.request<ApiResponse<WorkoutSessionResponse[]>>('/api/workouts/sessions');
    return response.result;
  }

  async getWorkoutSession(id: string): Promise<WorkoutSessionResponse> {
    const response = await this.request<ApiResponse<WorkoutSessionResponse>>(`/api/workouts/sessions/${id}`);
    return response.result;
  }

  async getSessionById(id: string): Promise<WorkoutSessionResponse> {
    const response = await this.request<ApiResponse<WorkoutSessionResponse>>(`/api/workouts/sessions/${id}`);
    return response.result;
  }

  async updateWorkoutSession(id: string, session: Partial<WorkoutSessionRequest>): Promise<WorkoutSessionResponse> {
    const response = await this.request<ApiResponse<WorkoutSessionResponse>>(`/api/workouts/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
    return response.result;
  }

  async deleteWorkoutSession(id: string): Promise<void> {
    await this.request(`/api/workouts/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Exercises (matching web app)
  async getExercises(params?: {
    tag?: string;
    difficulty?: string;
    muscleGroup?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ExerciseResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.muscleGroup) queryParams.append('muscleGroup', params.muscleGroup);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    
    const url = `/api/exercises${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await this.request<ApiResponse<PaginatedResponse<ExerciseResponse>>>(url);
    return response.result;
  }

  async getAllExercisesList(): Promise<ExerciseResponse[]> {
    const response = await this.request<ApiResponse<ExerciseResponse[]>>('/api/exercises/list');
    return response.result;
  }

  async getCoaches(): Promise<CoachResponse[]> {
    const response = await this.request<ApiResponse<CoachResponse[]>>('/api/user/coaches');
    return response.result;
  }

  async getExercise(id: string): Promise<ExerciseResponse> {
    // Use same endpoint as web app: /api/exercises/{id}
    const response = await this.request<ApiResponse<ExerciseResponse>>(`/api/exercises/${id}`);
    return response.result;
  }

  async searchExercises(query: string): Promise<ExerciseResponse[]> {
    const response = await this.request<ApiResponse<ExerciseResponse[]>>(`/api/workouts/exercises/search?q=${encodeURIComponent(query)}`);
    return response.result;
  }

  // Exercise Logs (matching web app)
  async createExerciseLog(log: SessionExerciseLogRequest): Promise<SessionExerciseLogResponse> {
    if (!log.sessionId) {
      throw new Error('sessionId is required');
    }
    // Remove sessionId from body as it's in the URL
    const { sessionId, ...logBody } = log;
    const response = await this.request<ApiResponse<SessionExerciseLogResponse>>(
      `/api/workouts/sessions/${sessionId}/logs`, 
      {
        method: 'POST',
        body: JSON.stringify(logBody),
      }
    );
    return response.result;
  }

  async getSessionExerciseLogs(sessionId: string): Promise<SessionExerciseLogResponse[]> {
    const response = await this.request<ApiResponse<SessionExerciseLogResponse[]>>(`/api/workouts/sessions/${sessionId}/logs`);
    return response.result;
  }

  async getLogsBySession(sessionId: string): Promise<SessionExerciseLogResponse[]> {
    const response = await this.request<ApiResponse<SessionExerciseLogResponse[]>>(`/api/workouts/sessions/${sessionId}/logs`);
    const logs = response.result;
    // Calculate volume for each log
    return logs.map(log => ({
      ...log,
      volume: log.sets?.reduce((sum, set) => sum + (set.reps * set.weight), 0) || 0
    }));
  }

  async getAllExercises(): Promise<ExerciseResponse[]> {
    const response = await this.request<ApiResponse<ExerciseResponse[]>>('/api/exercises/list');
    return response.result;
  }

  async updateExerciseLog(id: string, log: Partial<SessionExerciseLogRequest>): Promise<SessionExerciseLogResponse> {
    const response = await this.request<ApiResponse<SessionExerciseLogResponse>>(`/api/workouts/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(log),
    });
    return response.result;
  }

  async deleteExerciseLog(id: string): Promise<void> {
    await this.request(`/api/workouts/logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Progress & Analytics
  async getProgressStats(period: 'week' | 'month' | 'year'): Promise<{
    totalWorkouts: number;
    totalWeight: number;
    totalTime: number;
    averageWorkoutTime: number;
  }> {
    const response = await this.request<ApiResponse<any>>(`/api/workouts/progress/stats?period=${period}`);
    return response.result;
  }

  async getTopExercises(period: 'week' | 'month' | 'year'): Promise<{
    name: string;
    volume: number;
    sessions: number;
  }[]> {
    const response = await this.request<ApiResponse<any>>(`/api/workouts/progress/top-exercises?period=${period}`);
    return response.result;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API exports (matching web app structure)
export const authApi = {
  login: (data: LoginPayload) => apiClient.login(data),
  register: (data: RegisterPayload) => apiClient.register(data),
  logout: () => apiClient.logout(),
  getMyInfo: () => apiClient.getMyInfo(),
  getMyInfoWithCookies: () => apiClient.getMyInfoWithCookies(),
  updateCurrentUser: (data: Partial<UserInfo>) => apiClient.updateCurrentUser(data),
  updateProfile: (data: Partial<UserInfo>) => apiClient.updateProfile(data),
  updateSettings: (data: { darkMode?: boolean; notifications?: boolean; language?: string }) => 
    apiClient.updateSettings(data),
  updateDailyGoals: (data: { dailyCalorieGoal?: number; dailyWaterGoal?: number; dailyWorkoutMins?: number }) =>
    apiClient.updateDailyGoals(data),
  updateAvatar: (formData: FormData) => apiClient.updateAvatar(formData),
  refreshToken: () => apiClient.refreshToken(),
};

// Workout API exports (matching web app structure)
export const workoutApi = {
  // Programs
  getAllPrograms: () => apiClient.getWorkoutPrograms(),
  getProgram: (id: string) => apiClient.getWorkoutProgram(id),
  getPopularPrograms: (limit?: number) => apiClient.getPopularPrograms(limit || 10),
  getProgramStats: (programId: string) => apiClient.getProgramStats(programId),
  saveProgram: (programId: string) => apiClient.saveProgram(programId),
  unsaveProgram: (programId: string) => apiClient.unsaveProgram(programId),
  rateProgram: (programId: string, data: { rating: number; review?: string }) => 
    apiClient.rateProgram(programId, data),
  getSavedPrograms: () => apiClient.getSavedPrograms(),
  createUserProgram: (data: { title: string; description?: string; goal?: string; durationWeeks?: number }) =>
    apiClient.createUserProgram(data),

  // Sessions
  createSession: (session: WorkoutSessionRequest) => apiClient.createWorkoutSession(session),
  getAllSessions: () => apiClient.getWorkoutSessions(),
  getSession: (id: string) => apiClient.getWorkoutSession(id),
  getSessionById: (id: string) => apiClient.getSessionById(id),
  updateSession: (id: string, session: Partial<WorkoutSessionRequest>) => 
    apiClient.updateWorkoutSession(id, session),
  deleteSession: (id: string) => apiClient.deleteWorkoutSession(id),

  // Exercises
  getExercises: (params?: { tag?: string; difficulty?: string; muscleGroup?: string; page?: number; size?: number }) => 
    apiClient.getExercises(params),
  getAllExercisesList: () => apiClient.getAllExercisesList(),
  getCoaches: () => apiClient.getCoaches(),
  getExercise: (id: string) => apiClient.getExercise(id),
  searchExercises: (query: string) => apiClient.searchExercises(query),

  // Exercise logs
  createExerciseLog: (log: SessionExerciseLogRequest) => apiClient.createExerciseLog(log),
  createLog: (sessionId: string, log: Omit<SessionExerciseLogRequest, 'sessionId'>) => 
    apiClient.createExerciseLog({ ...log, sessionId }),
  getSessionExerciseLogs: (sessionId: string) => apiClient.getSessionExerciseLogs(sessionId),
  getLogsBySession: (sessionId: string) => apiClient.getLogsBySession(sessionId),
  updateExerciseLog: (id: string, log: Partial<SessionExerciseLogRequest>) => 
    apiClient.updateExerciseLog(id, log),
  deleteExerciseLog: (id: string) => apiClient.deleteExerciseLog(id),
  
  // All exercises
  getAllExercises: () => apiClient.getAllExercises(),
};

export const progressApi = {
  getStats: (period: 'week' | 'month' | 'year') => apiClient.getProgressStats(period),
  getTopExercises: (period: 'week' | 'month' | 'year') => apiClient.getTopExercises(period),
};

// Explore API exports (matching web app structure)
export const exploreApi = {
  getAllPublicPrograms: () => apiClient.getWorkoutPrograms(),
  getPopularPrograms: (limit?: number) => apiClient.getPopularPrograms(limit || 10),
  getProgramDetail: (id: string) => apiClient.getWorkoutProgram(id),
  getProgramStats: (programId: string) => apiClient.getProgramStats(programId),
  saveProgram: (programId: string) => apiClient.saveProgram(programId),
  unsaveProgram: (programId: string) => apiClient.unsaveProgram(programId),
  rateProgram: (programId: string, data: { rating: number; review?: string }) =>
    apiClient.rateProgram(programId, data),
  getCoaches: () => apiClient.getCoaches(),
};

// Home Dashboard API
export const dashboardApi = {
  async getDashboardStats(): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    totalTime: number;
    weekStreak: number;
  }> {
    try {
      // Get user info which contains totalWorkouts, totalVolume, streakDays
      const userInfo = await apiClient.getMyInfo();
      
      // Get all sessions to calculate totalTime
      const sessions = await apiClient.getWorkoutSessions();
      const totalTime = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
      
      // Calculate weekStreak from streakDays (approximate: 7 days = 1 week)
      const weekStreak = userInfo.streakDays ? Math.floor(userInfo.streakDays / 7) : 0;
      
      return {
        totalWorkouts: userInfo.totalWorkouts || 0,
        totalVolume: userInfo.totalVolume || 0,
        totalTime: totalTime,
        weekStreak: weekStreak,
      };
    } catch (error) {
      console.error('[dashboardApi] getDashboardStats error:', error);
      // Fallback: try to get from user info only
      try {
        const userInfo = await apiClient.getMyInfo();
        return {
          totalWorkouts: userInfo.totalWorkouts || 0,
          totalVolume: userInfo.totalVolume || 0,
          totalTime: 0,
          weekStreak: userInfo.streakDays ? Math.floor(userInfo.streakDays / 7) : 0,
        };
      } catch (fallbackError) {
        console.error('[dashboardApi] Fallback getDashboardStats error:', fallbackError);
        return { totalWorkouts: 0, totalVolume: 0, totalTime: 0, weekStreak: 0 };
      }
    }
  },

  async getRecentSessions(limit: number = 5): Promise<WorkoutSessionResponse[]> {
    const sessions = await apiClient.getWorkoutSessions();
    return sessions.slice(0, limit);
  },

  async getPopularPrograms(limit: number = 5): Promise<WorkoutProgramResponse[]> {
    const programs = await apiClient.getWorkoutPrograms();
    return programs.slice(0, limit);
  },

  async getWeeklyProgress(): Promise<{
    day: string;
    workouts: number;
  }[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/workouts/dashboard/weekly`, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('[dashboardApi] getWeeklyProgress error:', error);
      return [];
    }
  },
};

// Google OAuth setup for mobile
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your actual client ID

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true,
    }),
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const { authentication } = result;
        // Send the Google token to your backend
        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: authentication?.accessToken,
          }),
        });
        
        const data = await response.json();
        if (data.result && data.result.token) {
          await AsyncStorage.setItem('token', data.result.token);
          return data.result;
        }
      }
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  return {
    request,
    response,
    promptAsync,
    handleGoogleLogin,
  };
};

// Utility functions for workout naming (similar to web app)
export const generateWorkoutName = (notes?: string, sessionDate?: Date): string => {
  const now = sessionDate || new Date();
  const timeOfDay = now.getHours();
  
  let timeLabel = '';
  if (timeOfDay < 12) {
    timeLabel = 'Sáng';
  } else if (timeOfDay < 17) {
    timeLabel = 'Chiều';
  } else {
    timeLabel = 'Tối';
  }
  
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = dayNames[now.getDay()];
  
  if (notes && notes.trim()) {
    return `${notes} - ${timeLabel}`;
  }
  
  return `${timeLabel} ${dayName}`;
};

// Notification types (matching web app)
export enum NotificationType {
  ACHIEVEMENT = 'ACHIEVEMENT',
  WORKOUT = 'WORKOUT',
  STREAK = 'STREAK',
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
  SOCIAL = 'SOCIAL',
  COACH_MESSAGE = 'COACH_MESSAGE',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PROGRAM_UPDATE = 'PROGRAM_UPDATE',
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  data?: Record<string, any>;
}

// Community types
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  status?: string | null;
  createdAt: string;
  authorName: string;
  authorAvatar?: string | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser?: boolean;
  reportCount?: number;
  isReportedByCurrentUser?: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  parentCommentId?: string | null;
  replies: PostComment[];
}

export interface CreatePostRequest {
  title?: string;
  content: string;
  mediaUrls?: string[];
}

export interface ReportPostRequest {
  reason: string;
  description?: string;
}

// Notification API (matching web app)
export const notificationApi = {
  async getNotifications(): Promise<NotificationResponse[]> {
    const response = await apiClient.request<ApiResponse<NotificationResponse[]>>('/api/notifications');
    return response.result || [];
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.request<ApiResponse<{ count: number }>>('/api/notifications/unread/count');
      return response.result?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.request(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.request('/api/notifications/read-all', { method: 'PUT' });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.request(`/api/notifications/${id}`, { method: 'DELETE' });
  },
};

// Community API
export const communityApi = {
  async getAllPosts(): Promise<CommunityPost[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 [communityApi] Token:', token ? 'exists' : 'missing');
      if (!token) {
        console.warn('⚠️ [communityApi] No token - user not authenticated');
        return [];
      }
      
      console.log('📡 [communityApi] Fetching posts from /api/community/posts');
      const response = await apiClient.request<ApiResponse<CommunityPost[]>>('/api/community/posts');
      console.log(' [communityApi] Response received:', {
        hasResult: !!response.result,
        resultType: typeof response.result,
        isArray: Array.isArray(response.result),
        length: response.result?.length,
        code: response.code,
        message: response.message,
        fullResponse: response
      });
      
      return response.result || [];
    } catch (error) {
      console.error('[communityApi] Error fetching posts:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  },

  async getPostById(postId: string): Promise<CommunityPost> {
    const response = await apiClient.request<ApiResponse<CommunityPost>>(
      `/api/community/posts/${postId}`
    );
    return response.result;
  },

  async createPost(data: CreatePostRequest): Promise<CommunityPost> {
    const response = await apiClient.request<ApiResponse<CommunityPost>>(
      '/api/community/posts',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.result;
  },

  async toggleLike(postId: string): Promise<{ likeCount: number; isLikedByCurrentUser: boolean }> {
    const response = await apiClient.request<ApiResponse<{ likeCount: number; isLikedByCurrentUser: boolean }>>(
      `/api/community/posts/${postId}/likes`,
      { method: 'POST' }
    );
    return response.result;
  },

  async unlikePost(postId: string): Promise<{ likeCount: number; isLikedByCurrentUser: boolean }> {
    const response = await apiClient.request<ApiResponse<{ likeCount: number; isLikedByCurrentUser: boolean }>>(
      `/api/community/posts/${postId}/likes`,
      { method: 'DELETE' }
    );
    return response.result;
  },

  async getComments(postId: string): Promise<PostComment[]> {
    try {
      console.log('💬 [communityApi] Fetching comments for post:', postId);
      const response = await apiClient.request<ApiResponse<PostComment[]>>(
        `/api/community/posts/${postId}/comments`
      );
      console.log('✅ [communityApi] Comments response:', {
        fullResponse: JSON.stringify(response, null, 2),
        hasResult: !!response.result,
        resultType: typeof response.result,
        isArray: Array.isArray(response.result),
        resultLength: Array.isArray(response.result) ? response.result.length : 'N/A',
        code: response.code,
        message: response.message
      });
      
      // Ensure we return an array
      if (Array.isArray(response.result)) {
        console.log('✅ [communityApi] Returning comments array:', response.result.length);
        return response.result;
      } else if (response.result) {
        console.warn('⚠️ [communityApi] Result is not an array, converting:', response.result);
        return [response.result];
      } else {
        console.warn('⚠️ [communityApi] No result in response, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('❌ [communityApi] Error fetching comments:', {
        error,
        postId,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async addComment(postId: string, content: string, parentCommentId?: string): Promise<PostComment> {
    const payload: { content: string; parentCommentId?: string } = { content };
    if (parentCommentId) {
      payload.parentCommentId = parentCommentId;
    }

    const response = await apiClient.request<ApiResponse<PostComment>>(
      `/api/community/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return response.result;
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.request(`/api/community/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async reportPost(postId: string, data: ReportPostRequest): Promise<string> {
    const response = await apiClient.request<ApiResponse<string>>(
      `/api/community/posts/${postId}/report`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.result;
  },

  async uploadMedia(file: File | Blob, fileName?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file as any, fileName);

    const response = await apiClient.request<ApiResponse<string>>(
      '/api/media/upload',
      {
        method: 'POST',
        body: formData as any,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      }
    );
    return response.result;
  },
};

export default apiClient;