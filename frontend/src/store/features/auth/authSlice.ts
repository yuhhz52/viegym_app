import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, LoginPayload, RegisterPayload, UserInfo } from "../../../types/auth";
import { loginAPI, registerAPI, getMyInfoAPI, logoutAPI } from "../../../api/authApi";

// ---- Thunks ----

// Login
export const loginUser = createAsyncThunk<
  UserInfo,
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const data = await loginAPI(payload);
    
    // Backend đã set cookie HttpOnly cho API calls và WebSocket
    // WebSocket sẽ tự động gửi cookie (browser tự động làm)
    console.log("[loginUser] ✓ Backend đã set cookie HttpOnly");
    console.log("[loginUser] ✓ WebSocket sẽ tự động dùng cookie (browser tự động gửi)");
    
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? "Đăng nhập thất bại");
  }
});

// Register
export const registerUser = createAsyncThunk<
  UserInfo,
  RegisterPayload,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const data = await registerAPI(payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? "Đăng ký thất bại");
  }
});

// Lấy thông tin người dùng từ cookie JWT
export const fetchCurrentUser = createAsyncThunk<
  UserInfo | null,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    // Backend sẽ đọc token từ cookie HttpOnly (withCredentials: true)
    console.log("[fetchCurrentUser] Gọi API với cookie (backend sẽ đọc từ cookie)");
    
    const data = await getMyInfoAPI(); 
    console.log("[fetchCurrentUser] ✓ Lấy thông tin user thành công:", data);
    return data;
  } catch (err: any) {
    // Nếu là 401 (Unauthorized), không phải lỗi - user chưa đăng nhập
    if (err?.response?.status === 401) {
      console.warn("[fetchCurrentUser] 401 Unauthorized - user chưa đăng nhập");
      return null;
    }
    // Các lỗi khác (network, timeout, etc.)
    const errorMsg = err?.message || JSON.stringify(err);
    console.error("[fetchCurrentUser] ✗ Lỗi khi lấy thông tin user:", errorMsg);
    console.error("[fetchCurrentUser] Error status:", err?.response?.status);
    console.error("[fetchCurrentUser] Error response:", err?.response?.data);
    return rejectWithValue("Không thể lấy thông tin người dùng: " + errorMsg);
  }
});


// Logout
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutAPI(); // backend xóa cookie
    } catch (err) {
      return rejectWithValue("Đăng xuất thất bại");
    }
  }
);

// ---- Initial State ----
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// ---- Slice ----
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // --- LOGIN ---
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng nhập thất bại";
    });

    // --- REGISTER ---
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng ký thất bại";
    });

    // --- FETCH CURRENT USER ---
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<UserInfo | null>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null; // Clear error on success
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isLoading = false; // Đảm bảo luôn set false
      state.user = null;
      // Chỉ set error nếu không phải 401 (401 là bình thường khi chưa đăng nhập)
      if (action.payload && !action.payload.includes("401")) {
        state.error = action.payload;
      } else {
        state.error = null;
      }
    });

    // --- LOGOUT ---

    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng xuất thất bại";
    });

  },
});

export const { clearAuth, updateUser } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export default authSlice.reducer;
