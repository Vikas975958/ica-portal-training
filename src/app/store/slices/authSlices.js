import { createSlice } from "@reduxjs/toolkit";
import { emptyStore } from "../actions";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "authSlice",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
      state.isAuthenticated = Boolean(token);

      if (typeof window !== "undefined") {
        if (token) {
          localStorage.setItem("accessToken", token);
          document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`;
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      } else {
        state.user = action.payload;
      }
      if (typeof window !== "undefined" && state.user) {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.dispatchEvent(new Event("auth_logout"));
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(emptyStore, () => initialState);
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
