import apiClient from "./apiClient";

export interface CoachStatsResponse {
  totalClients: number;
  activeClients: number;
  totalPrograms: number;
  totalWorkoutsSessions: number;
  avgClientProgress: number;
  newClientsThisMonth: number;
  activeProgramsAssigned: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface ClientResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  experienceLevel?: string;
  avatarUrl?: string;
  totalWorkouts: number;
  totalVolume: number;
  streakDays: number;
  joinedDate: string;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
  notes?: string;
}

export interface AddClientRequest {
  clientId: string;
  notes?: string;
}

export interface AssignProgramRequest {
  clientId: string;
  programId: string;
  notes?: string;
}

export interface CoachBalanceResponse {
  availableBalance: number | string; // Backend trả về BigDecimal có thể là string hoặc number
  pendingBalance: number | string;
  totalEarned: number | string;
  totalWithdrawn: number | string;
  bankAccountInfo?: string;
  lastUpdated?: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccountInfo: string;
}

/**
 * Get coach statistics and dashboard data
 */
export const getCoachStatsAPI = async (): Promise<CoachStatsResponse> => {
  const response = await apiClient.get<{ result: CoachStatsResponse }>("/api/coach/stats");
  return response.data.result;
};

/**
 * Get all clients of the current coach
 */
export const getMyClientsAPI = async (): Promise<ClientResponse[]> => {
  const response = await apiClient.get<{ result: ClientResponse[] }>("/api/coach/clients");
  return response.data.result;
};

/**
 * Get active clients only
 */
export const getActiveClientsAPI = async (): Promise<ClientResponse[]> => {
  const response = await apiClient.get<{ result: ClientResponse[] }>("/api/coach/clients/active");
  return response.data.result;
};

/**
 * Get a specific client by ID
 */
export const getClientByIdAPI = async (clientId: string): Promise<ClientResponse> => {
  const response = await apiClient.get<{ result: ClientResponse }>(`/api/coach/clients/${clientId}`);
  return response.data.result;
};

/**
 * Add a new client to the coach's roster
 */
export const addClientAPI = async (request: AddClientRequest): Promise<ClientResponse> => {
  const response = await apiClient.post<{ result: ClientResponse }>("/api/coach/clients", request);
  return response.data.result;
};

/**
 * Remove a client from the coach's roster
 */
export const removeClientAPI = async (clientId: string): Promise<void> => {
  await apiClient.delete(`/api/coach/clients/${clientId}`);
};

/**
 * Update notes for a specific client
 */
export const updateClientNotesAPI = async (clientId: string, notes: string): Promise<ClientResponse> => {
  const response = await apiClient.patch<{ result: ClientResponse }>(`/api/coach/clients/${clientId}/notes`, notes, {
    headers: { "Content-Type": "text/plain" }
  });
  return response.data.result;
};

/**
 * Get all programs created by the current coach
 */
export const getMyProgramsAPI = async (): Promise<any[]> => {
  const response = await apiClient.get<{ result: any[] }>("/api/coach/programs");
  return response.data.result;
};

/**
 * Assign a program to a client
 */
export const assignProgramToClientAPI = async (request: AssignProgramRequest): Promise<void> => {
  await apiClient.post("/api/coach/programs/assign", request);
};

/**
 * Get all programs assigned to a specific client
 */
export const getClientProgramsAPI = async (clientId: string): Promise<any[]> => {
  const response = await apiClient.get<{ result: any[] }>(`/api/coach/clients/${clientId}/programs`);
  return response.data.result;
};

/**
 * Get coach's balance information
 */
export const getCoachBalanceAPI = async (): Promise<CoachBalanceResponse> => {
  const response = await apiClient.get<{ result: CoachBalanceResponse }>("/api/coach/balance");
  return response.data.result;
};

/**
 * Request withdrawal
 */
export const withdrawAPI = async (request: WithdrawRequest): Promise<CoachBalanceResponse> => {
  const response = await apiClient.post<{ result: CoachBalanceResponse }>("/api/coach/withdraw", request);
  return response.data.result;
};
