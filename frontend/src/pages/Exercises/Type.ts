export interface MediaItem {
  id: string;
  mediaType: string;
  url: string;
  caption: string;
  orderNo: number;
}

export interface ExerciseMedia {
  id: string
  mediaType: string
  url: string
  caption?: string
  orderNo?: number
}

export interface ExerciseMetadata {
  reps?: number
  sets?: number
  [key: string]: any
}

export interface Exercise {
  id: string
  name: string
  description?: string
  muscleGroup?: string
  difficulty?: string
  tags?: string[]
  metadata?: ExerciseMetadata   
  mediaList?: ExerciseMedia[]
}

export interface GetExercisesParams {
  tag?: string;
  difficulty?: string;
  muscleGroup?: string;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  result: T[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
}


// Kiểu response chung
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
