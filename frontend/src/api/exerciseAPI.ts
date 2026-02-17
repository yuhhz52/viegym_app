import apiClient from "./apiClient";
import type { ApiResponse, Exercise, GetExercisesParams} from "../pages/Exercises/Type";


export interface ExercisesAPIResponse {
  exercises: Exercise[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Lấy danh sách bài tập phân trang
export const getExercisesAPI = async (
  params?: GetExercisesParams
): Promise<ExercisesAPIResponse> => {
  const pageParams = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
    tag: params?.tag,
    difficulty: params?.difficulty,
    muscleGroup: params?.muscleGroup,
  };

  const res = await apiClient.get<ApiResponse<any>>("/api/exercises", {
    params: pageParams,
  });

  const paginatedData = res.data.result ?? {};

  // Backend trả về PagingResponse với structure: { data, total, page, size }
  const exercises = Array.isArray(paginatedData.data)
    ? paginatedData.data
    : [];

  const totalElements = paginatedData.total ?? 0;
  const totalPages = totalElements > 0 ? Math.ceil(totalElements / (pageParams.size || 10)) : 1;

  return {
    exercises,
    totalElements,
    totalPages,
    page: paginatedData.page ?? pageParams.page,
    size: paginatedData.size ?? pageParams.size,
  };
};


export const getExerciseByIdAPI = async (id: string): Promise<Exercise> => {
  const res = await apiClient.get<ApiResponse<Exercise>>(`/api/exercises/${id}`);
  return res.data.result;
};

export const createExerciseAPI = async (data: Omit<Exercise, "id">): Promise<Exercise> => {
  const res = await apiClient.post<ApiResponse<Exercise>>("/api/exercises", data);
  return res.data.result;
};

export const updateExerciseAPI = async (id: string, data: Partial<Exercise>): Promise<Exercise> => {
  const res = await apiClient.put<ApiResponse<Exercise>>(`/api/exercises/${id}`, data);
  return res.data.result;
};

export const deleteExerciseAPI = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/exercises/${id}`);
};
