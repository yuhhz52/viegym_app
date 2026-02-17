import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface CommonState {
  isLoading: boolean
}
const initialState: CommonState = {
  isLoading: false,
}

export const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})
export const { setLoading } = commonSlice.actions
export default commonSlice.reducer

export const selectIsLoading = (state: { common: CommonState }) => state.common.isLoading
