export interface ProgramMedia {
  id?: string;
  mediaType: string;
  url: string;
  caption?: string | null;
  orderNo?: number | null;
}

export interface ProgramExercise {
  id?: string;
  dayOfProgram: number;
  orderNo: number;
  sets: number;
  reps: string;
  weightScheme: string;
  restSeconds: number;
  notes?: string;
  exercise: {
    id: string;
    name?: string;
  };
}

export interface Program {
  id: string;
  title: string;
  description: string;
  goal: string;
  durationWeeks: number;
  visibility: string;
  mediaList: ProgramMedia[];
  exercises: ProgramExercise[];
  createdByName?: string;
  averageRating?: number;
  totalRatings?: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface ProgramRequest {
  title: string;
  description: string;
  goal: string;
  durationWeeks: number;
  visibility: string;
  mediaList?: ProgramMedia[];
}
