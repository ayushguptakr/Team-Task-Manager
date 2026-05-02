export type Role = "admin" | "member";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
  password?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  assigneeId: string | null;
  status: TaskStatus;
  createdAt: string;
}
