import type {
  UserResponse,
  UserUpdateRequest,
  UserCreationRequest,
  PagingResponse,
} from "./type";
import apiClient from "@/api/apiClient";

export const getAllUsersAPI = async (
  page = 0,
  size = 10
): Promise<PagingResponse<UserResponse>> => {
  const res = await apiClient.get<{ result: PagingResponse<UserResponse> }>(
    "/api/user/all",
    { params: { page, size } }
  );

  return res.data.result;
};


export const updateUserByIdAPI = async (
  id: string,
  data: UserUpdateRequest
): Promise<UserResponse> => {
  const res = await apiClient.patch<{ result: UserResponse }>(`/api/user/${id}`, data);
  return res.data.result;
};

export const deleteUserAPI = async (id: string): Promise<string> => {
  const res = await apiClient.delete<{ result: string }>(`/api/user/${id}`);
  return res.data.result;
};

export const assignRoleAPI = async (
  id: string,
  roleName: string
): Promise<UserResponse> => {
  const res = await apiClient.post<{ result: UserResponse }>(
    `/api/user/${id}/assign-role`,
    null,
    { params: { roleName } }
  );
  return res.data.result;
};

export const removeRoleAPI = async (
  id: string,
  roleName: string
): Promise<UserResponse> => {
  const res = await apiClient.delete<{ result: UserResponse }>(
    `/api/user/${id}/remove-role`,
    { params: { roleName } }
  );
  return res.data.result;
};

export const registerUserAPI = async (
  data: UserCreationRequest
): Promise<UserResponse> => {
  const res = await apiClient.post<{ result: UserResponse }>("/api/user/register", data);
  return res.data.result;
};


export const disableUserAPI = async (id: string): Promise<UserResponse> => {
  const res = await apiClient.post<{ result: UserResponse }>(`/api/user/${id}/disable`);
  return res.data.result;
};

export const enableUserAPI = async (id: string): Promise<UserResponse> => {
  const res = await apiClient.post<{ result: UserResponse }>(`/api/user/${id}/enable`);
  return res.data.result;
};
