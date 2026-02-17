// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import commonReducer from "./features/common";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    common: commonReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
