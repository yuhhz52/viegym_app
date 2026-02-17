// Workout Session Types
export interface WorkoutSessionRequest {
  programId?: string;
  sessionDate: string | Date;
  durationMinutes: number;
  notes?: string;
}

export interface WorkoutSessionResponse {
  id: string;
  userId: string;
  programId?: string;
  sessionDate: string;
  durationMinutes: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Exercise Types
export type ExerciseType = 
  | 'WEIGHT_AND_REPS'
  | 'BODYWEIGHT_REPS'
  | 'REPS_ONLY'
  | 'TIME_BASED'
  | 'DISTANCE_BASED'
  | 'WEIGHT_AND_TIME'
  | 'ASSISTED_BODYWEIGHT';

// Session Exercise Log Types
export interface SessionExerciseLogRequest {
  exerciseId: string;
  setNumber: number;
  repsDone?: number;
  weightUsed?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  bodyWeight?: number;
  setNotes?: string;
  completed?: boolean;
}

export interface SessionExerciseLogResponse {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
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
}

// Program Types for dropdown
export interface WorkoutProgramResponse {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  goal?: string;
  difficulty?: string;
  durationWeeks?: number;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Exercise Types for dropdown
export interface ExerciseResponse {
  id: string;
  name: string;
  muscleGroup?: string;
  difficulty?: string;
  exerciseType?: ExerciseType;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}


