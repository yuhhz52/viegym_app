export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const loginWithGoogleAPI = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
};
