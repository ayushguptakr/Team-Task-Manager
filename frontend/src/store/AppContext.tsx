import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Project, Task, TaskStatus, Priority } from "@/types";
import { seedUsers, seedProjects, seedTasks } from "@/data/seed";

interface AppState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  currentUser: User | null;
}

interface AppContextValue extends AppState {
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;

  createProject: (data: { name: string; description: string; memberIds: string[] }) => void;
  updateProjectMembers: (projectId: string, memberIds: string[]) => void;
  deleteProject: (projectId: string) => void;

  createTask: (data: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
}

const STORAGE_KEY = "taskflow.state.v1";
const SESSION_KEY = "taskflow.session.v1";

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const session = localStorage.getItem(SESSION_KEY);
      const currentUser = session ? parsed.users.find((u: User) => u.id === session) ?? null : null;
      return { ...parsed, currentUser };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
  return { users: seedUsers, projects: seedProjects, tasks: seedTasks, currentUser: null };
}

function persist(state: AppState) {
  const { currentUser, ...rest } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  if (currentUser) localStorage.setItem(SESSION_KEY, currentUser.id);
  else localStorage.removeItem(SESSION_KEY);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { persist(state); }, [state]);

  const value: AppContextValue = {
    ...state,
    login: (email, password) => {
      const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
      if (!u) return { ok: false, error: "Invalid email or password" };
      setState((s) => ({ ...s, currentUser: u }));
      return { ok: true };
    },
    signup: (name, email, password) => {
      if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: "Email already in use" };
      }
      const colors = ["245 75% 60%", "200 70% 55%", "145 65% 45%", "35 95% 55%", "330 75% 60%", "265 70% 60%"];
      const newUser: User = {
        id: uid(), name, email, password, role: "member",
        avatarColor: colors[state.users.length % colors.length],
      };
      setState((s) => ({ ...s, users: [...s.users, newUser], currentUser: newUser }));
      return { ok: true };
    },
    logout: () => setState((s) => ({ ...s, currentUser: null })),

    createProject: ({ name, description, memberIds }) => {
      const me = state.currentUser;
      if (!me) return;
      const ids = Array.from(new Set([me.id, ...memberIds]));
      setState((s) => ({
        ...s,
        projects: [...s.projects, { id: uid(), name, description, memberIds: ids, createdAt: new Date().toISOString() }],
      }));
    },
    updateProjectMembers: (projectId, memberIds) =>
      setState((s) => ({ ...s, projects: s.projects.map((p) => p.id === projectId ? { ...p, memberIds } : p) })),
    deleteProject: (projectId) =>
      setState((s) => ({
        ...s,
        projects: s.projects.filter((p) => p.id !== projectId),
        tasks: s.tasks.filter((t) => t.projectId !== projectId),
      })),

    createTask: (data) =>
      setState((s) => ({ ...s, tasks: [...s.tasks, { ...data, id: uid(), createdAt: new Date().toISOString() }] })),
    updateTask: (id, patch) =>
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    deleteTask: (id) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
    moveTask: (id, status) =>
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const priorityLabel: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };
export const statusLabel: Record<TaskStatus, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
