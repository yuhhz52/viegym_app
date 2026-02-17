import axios from "axios";
import { API_BASE_URL } from "./constant";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000, 
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(true);
  });
  failedQueue = [];
};


apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/logout")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[apiClient] Gọi refresh endpoint (backend sẽ đọc refresh token từ cookie)");
        
        const response = await apiClient.post("/api/auth/refresh", {});
        console.log("[apiClient] Refresh response:", response.data);
        console.log("[apiClient]  Backend đã set cookie mới");
        
        processQueue();
        return apiClient(originalRequest);
      } catch (err) {
        console.error("[apiClient]  Refresh endpoint error:", err);
        processQueue(err);
        console.error("[apiClient]  Refresh token failed, logging out...");

        window.dispatchEvent(new CustomEvent("auth:refresh-failed"));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);



export default apiClient;
