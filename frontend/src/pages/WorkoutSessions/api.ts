import apiClient from '@/api/apiClient';
import type {
  WorkoutSessionRequest,
  WorkoutSessionResponse,
  SessionExerciseLogRequest,
  SessionExerciseLogResponse,
  ApiResponse,
  WorkoutProgramResponse,
  ExerciseResponse
} from '@/pages/WorkoutSessions/type';
export const createSession = async (
  data: WorkoutSessionRequest
): Promise<WorkoutSessionResponse> => {
  const response = await apiClient.post<ApiResponse<WorkoutSessionResponse>>(
    '/api/workouts/sessions',
    {
      ...data,
      sessionDate: new Date(data.sessionDate).toISOString(),
    }
  );
  return response.data.result;
};

export const getAllSessions = async (): Promise<WorkoutSessionResponse[]> => {
  const response = await apiClient.get<ApiResponse<WorkoutSessionResponse[]>>('/api/workouts/sessions');
  return response.data.result;
};

/**
 * Get a specific workout session by ID
 */
export const getSessionById = async (id: string): Promise<WorkoutSessionResponse> => {
  const response = await apiClient.get<ApiResponse<WorkoutSessionResponse>>(`/api/workouts/sessions/${id}`);
  return response.data.result;
};

/**
 * Update an existing workout session
 */
export const updateSession = async (
  id: string,
  data: WorkoutSessionRequest
): Promise<WorkoutSessionResponse> => {
  try {
    const requestData: any = {
      durationMinutes: data.durationMinutes,
      sessionDate: new Date(data.sessionDate).toISOString(),
    };
    
    // Only include optional fields if they exist
    if (data.programId) {
      requestData.programId = data.programId;
    }
    if (data.notes !== undefined) {
      requestData.notes = data.notes;
    }
    
    const response = await apiClient.put<ApiResponse<WorkoutSessionResponse>>(
      `/api/workouts/sessions/${id}`,
      requestData
    );
    return response.data.result;
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('403 Forbidden: Không có quyền cập nhật session này', error.response.data);
      throw new Error('Không có quyền cập nhật buổi tập này. Vui lòng kiểm tra lại.');
    }
    throw error;
  }
};

/**
 * Delete a workout session
 */
export const deleteSession = async (id: string): Promise<string> => {
  const response = await apiClient.delete<ApiResponse<string>>(`/api/workouts/sessions/${id}`);
  return response.data.result;
};

/**
 * Create test workout session for today (testing purposes)
 */
export const createTestSessionToday = async (): Promise<WorkoutSessionResponse> => {
  const response = await apiClient.post<ApiResponse<WorkoutSessionResponse>>(
    '/api/workouts/sessions/test/today'
  );
  return response.data.result;
};

/**
 * Get all programs for dropdown selection
 * Returns user's programs + public programs (works for all roles including USER)
 */
export const getAllPrograms = async (): Promise<WorkoutProgramResponse[]> => {
  try {
    // Use /programs endpoint which works for all authenticated users
    // It returns user's programs + public programs from others
    const response = await apiClient.get<ApiResponse<WorkoutProgramResponse[]>>(
      '/api/programs'
    );
    console.log('Programs loaded:', response.data.result);
    return response.data.result || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách chương trình:', error);
    return [];
  }
};

/**
 * Get saved programs for current user
 * Returns only programs that the user has saved from Explore section
 */
export const getSavedPrograms = async (): Promise<WorkoutProgramResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<WorkoutProgramResponse[]>>(
      '/api/programs/saved'
    );
    console.log('Saved programs loaded:', response.data.result);
    return response.data.result || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách chương trình đã lưu:', error);
    return [];
  }
};

/**
 * Get all exercises for dropdown selection
 */
export const getAllExercises = async (): Promise<ExerciseResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ExerciseResponse[]>>(
      '/api/exercises/list'
    );
    console.log('Exercises loaded:', response.data.result);
    return response.data.result || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách bài tập:', error);
    return [];
  }
};

/**
 * Create a personal program for current user
 */
export const createUserProgram = async (data: {
  title: string;
  description?: string;
  goal?: string;
  durationWeeks?: number;
}): Promise<WorkoutProgramResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<WorkoutProgramResponse>>(
      '/api/programs/my/create',
      data
    );
    console.log('Personal program created:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('Lỗi khi tạo chương trình cá nhân:', error);
    throw error;
  }
};

// ============ EXERCISE LOGS ENDPOINTS ============

/**
 * Get all logs for a specific session
 */
export const getLogsBySession = async (sessionId: string): Promise<SessionExerciseLogResponse[]> => {
  try {
    const response = await apiClient.get<ApiResponse<SessionExerciseLogResponse[]>>(
      `/api/workouts/sessions/${sessionId}/logs`
    );
    return response.data.result || [];
  } catch (error: any) {
    if (error.response) {
      console.error(`API Error [${error.response.status}]: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.status === 400) {
        console.error('Session không hợp lệ hoặc không thuộc về bạn');
      } else if (error.response.status === 403) {
        console.error('Không có quyền truy cập session này');
      }
    } else {
      console.error(`Lỗi khi tải logs cho session ${sessionId}:`, error);
    }
    return [];
  }
};

/**
 * Create a new exercise log for a session
 */
export const createLog = async (
  sessionId: string,
  data: SessionExerciseLogRequest
): Promise<SessionExerciseLogResponse> => {
  const response = await apiClient.post<ApiResponse<SessionExerciseLogResponse>>(
    `/api/workouts/sessions/${sessionId}/logs`,
    data
  );
  return response.data.result;
};

/**
 * Update an existing exercise log
 */
export const updateLog = async (
  id: string,
  data: SessionExerciseLogRequest
): Promise<SessionExerciseLogResponse> => {
  const response = await apiClient.put<ApiResponse<SessionExerciseLogResponse>>(
    `/api/workouts/logs/${id}`,
    data
  );
  return response.data.result;
};

/**
 * Delete an exercise log
 */
export const deleteLog = async (id: string): Promise<string> => {
  const response = await apiClient.delete<ApiResponse<string>>(`/api/workouts/logs/${id}`);
  return response.data.result;
};
