import api from "./axios";

export const getProjects = () => api.get("/projects");

export const createProject = (data) => api.post("/projects", data);

export const addProjectMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data);

export const removeProjectMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);

export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
