// API Configuration
// TODO: Để dùng Expo Go, cần dùng ngrok hoặc Development Build
// Xem hướng dẫn trong README_OAUTH_SETUP.md
// Expo Go: Thay bằng ngrok URL (ví dụ: https://abc123.ngrok-free.app)
// Development Build: Có thể dùng localhost với adb reverse
export const API_BASE_URL = 'https://unliberalized-hedgiest-martina.ngrok-free.dev';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // User
  GET_USER_INFO: '/user/myInfo',
  UPDATE_PROFILE: '/user/updateUser',
};
