import apiClient from "@/api/apiClient";
import type { ProgramResponse, ProgramRequest, ProgramExercise, ProgramExerciseRequest } from "./type";

export const getAllProgramsAPI = async (): Promise<ProgramResponse[]> => {
  const response = await apiClient.get("/api/programs/list");
  const data = response.data as { result: ProgramResponse[] };
  return data.result;
};

export const createProgramAPI = async (data: ProgramRequest): Promise<ProgramResponse> => {
  const response = await apiClient.post("/api/programs", data);
  const responseData = response.data as { result: ProgramResponse };
  return responseData.result;
};

export const updateProgramAPI = async (id: string, data: ProgramRequest): Promise<ProgramResponse> => {
  const response = await apiClient.put(`/api/programs/${id}`, data);
  const responseData = response.data as { result: ProgramResponse };
  return responseData.result;
};

export const deleteProgramAPI = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/programs/${id}`);
};

export const getProgramExercisesAPI = async (programId: string): Promise<ProgramExercise[]> => {
  const response = await apiClient.get(`/api/programs/${programId}/exercises`);
  const data = response.data as { result: ProgramExercise[] };
  return data.result;
};

export const addExerciseToProgramAPI = async (programId: string, data: ProgramExerciseRequest): Promise<ProgramExercise> => {
  const response = await apiClient.post(`/api/programs/${programId}/exercises`, data);
  const responseData = response.data as { result: ProgramExercise };
  return responseData.result;
};

export const updateProgramExerciseAPI = async (exerciseId: string, data: ProgramExerciseRequest): Promise<ProgramExercise> => {
  const response = await apiClient.put(`/api/programs/exercises/${exerciseId}`, data);
  const responseData = response.data as { result: ProgramExercise };
  return responseData.result;
};

export const deleteProgramExerciseAPI = async (exerciseId: string): Promise<void> => {
  await apiClient.delete(`/api/programs/exercises/${exerciseId}`);
};
