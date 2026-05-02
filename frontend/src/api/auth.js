import api from "./axios";

export const loginUser = (credentials) => api.post("/auth/login", credentials);

export const signupUser = (data) => api.post("/auth/signup", data);

export const getCurrentUser = () => api.get("/auth/me");
