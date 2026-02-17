import apiClient from "./apiClient";

export interface UpdateSettingsRequest {
  darkMode?: boolean;
  notifications?: boolean;
  language?: string;
}

export const userApi = {
  // Get current user info
  getCurrentUser: async () => {
    const response = await apiClient.get("/api/user/my-info");
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: UpdateSettingsRequest) => {
    const response = await apiClient.patch("/api/user/settings", settings);
    return response.data;
  },
};
