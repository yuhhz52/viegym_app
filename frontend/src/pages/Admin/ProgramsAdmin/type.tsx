export interface ProgramExercise {
  id: string;
  dayOfProgram: number;
  orderNo: number;
  sets: number;
  reps: string;
  weightScheme?: string;
  restSeconds?: number;
  notes?: string;
  exercise: {
    id: string;
    name: string;
    muscleGroup?: string;
    difficulty?: string;
  };
}

export interface ProgramResponse {
  id: string;
  title: string;
  name?: string;  // Alias for title
  description: string;
  level?: string;
  goal?: string;
  durationWeeks: number;
  visibility?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  isPublic?: boolean;
  exercises?: ProgramExercise[];
}

export interface ProgramRequest {
  title: string;
  description: string;
  goal?: string;
  durationWeeks: number;
  visibility?: string;
  mediaList?: Array<{
    url: string;
    mediaType: string;
    caption?: string;
    orderNo?: number;
  }>;
}

export interface ProgramExerciseRequest {
  exerciseId: string;
  dayOfProgram: number;
  orderNo: number;
  sets: number;
  reps: string;
  weightScheme?: string;
  restSeconds?: number;
  notes?: string;
}
