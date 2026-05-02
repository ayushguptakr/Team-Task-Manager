import api from "./axios";

export const getTasks = (params) => api.get("/tasks", { params });

export const createTask = (data) => api.post("/tasks", data);

export const updateTaskStatus = (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status });

export const updateTask = (taskId, data) => api.patch(`/tasks/${taskId}`, data);

export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
