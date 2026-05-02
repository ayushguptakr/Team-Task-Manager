import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { User, Project, Task, TaskStatus, Priority } from "@/types";
import { TOKEN_KEY } from "@/api/axios";
import { getCurrentUser, loginUser, signupUser } from "@/api/auth";
import {
  addProjectMember as addProjectMemberApi,
  createProject as createProjectApi,
  deleteProject as deleteProjectApi,
  getProjects,
  removeProjectMember as removeProjectMemberApi,
} from "@/api/projects";
import {
  createTask as createTaskApi,
  deleteTask as deleteTaskApi,
  getTasks,
  updateTask as updateTaskApi,
  updateTaskStatus,
} from "@/api/tasks";
import { getDashboard } from "@/api/dashboard";

type Operation = "auth" | "projects" | "tasks" | "dashboard";
type Result = { ok: boolean; error?: string };
type ApiRecord = Record<string, unknown>;

interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  overdueTaskList: Task[];
  tasksAssignedToMe: Task[];
}

interface AppState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  dashboard: DashboardData | null;
  currentUser: User | null;
}

interface AppContextValue extends AppState {
  loading: Record<Operation, boolean>;
  errors: Record<Operation, string | null>;
  login: (email: string, password: string) => Promise<Result>;
  signup: (name: string, email: string, password: string) => Promise<Result>;
  logout: () => void;
  reload: () => Promise<void>;

  createProject: (data: { name: string; description: string; memberIds: string[] }) => Promise<Result>;
  updateProjectMembers: (projectId: string, memberIds: string[]) => Promise<Result>;
  deleteProject: (projectId: string) => Promise<Result>;

  createTask: (data: Omit<Task, "id" | "createdAt">) => Promise<Result>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<Result>;
  deleteTask: (id: string) => Promise<Result>;
  moveTask: (id: string, status: TaskStatus) => Promise<Result>;
}

const emptyLoading: Record<Operation, boolean> = {
  auth: false,
  projects: false,
  tasks: false,
  dashboard: false,
};

const emptyErrors: Record<Operation, string | null> = {
  auth: null,
  projects: null,
  tasks: null,
  dashboard: null,
};

const AppContext = createContext<AppContextValue | null>(null);

const getId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const record = value as { _id?: string; id?: string };
    return record._id ?? record.id ?? "";
  }
  return "";
};

const asRecord = (value: unknown): ApiRecord => (typeof value === "object" && value !== null ? value as ApiRecord : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);

const avatarColors = ["245 75% 60%", "200 70% 55%", "145 65% 45%", "35 95% 55%", "330 75% 60%", "265 70% 60%"];

const colorForId = (id: string) => {
  const total = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
};

const mapUser = (user: unknown): User => {
  const record = asRecord(user);
  const id = getId(user);
  return {
    id,
    name: asString(record.name, "Unknown user"),
    email: asString(record.email),
    avatarColor: asString(record.avatarColor, colorForId(id)),
    role: record.role === "admin" ? "admin" : "member",
  };
};

const mapProject = (project: unknown): Project => {
  const record = asRecord(project);
  return {
    id: getId(project),
    name: asString(record.name, "Untitled project"),
    description: asString(record.description),
    memberIds: asArray(record.members).map((member) => getId(asRecord(member).user)),
    createdAt: asString(record.createdAt, new Date().toISOString()),
  };
};

const mapTask = (task: unknown): Task => {
  const record = asRecord(task);
  const priority = record.priority === "low" || record.priority === "high" ? record.priority : "medium";
  const status = record.status === "in_progress" || record.status === "done" ? record.status : "todo";

  return {
    id: getId(task),
    projectId: getId(record.project),
    title: asString(record.title, "Untitled task"),
    description: asString(record.description),
    priority,
    dueDate: asString(record.dueDate, new Date().toISOString()),
    assigneeId: record.assignee ? getId(record.assignee) : null,
    status,
    createdAt: asString(record.createdAt, new Date().toISOString()),
  };
};

const getApiMessage = (error: unknown, fallback: string) => {
  const record = asRecord(error);
  const response = asRecord(record.response);
  const data = asRecord(response.data);
  return asString(data.message, asString(record.message, fallback));
};

const collectUsers = (currentUser: User | null, rawProjects: unknown[], rawTasks: unknown[]) => {
  const usersById = new Map<string, User>();
  const add = (user: unknown) => {
    if (!user) return;
    const mapped = mapUser(user);
    if (mapped.id) usersById.set(mapped.id, mapped);
  };

  add(currentUser);

  rawProjects.forEach((project) => {
    const record = asRecord(project);
    asArray(record.members).forEach((member) => add(asRecord(member).user));
    add(record.createdBy);
  });

  rawTasks.forEach((task) => {
    const record = asRecord(task);
    add(record.assignee);
    add(record.createdBy);
  });

  return Array.from(usersById.values());
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    users: [],
    projects: [],
    tasks: [],
    dashboard: null,
    currentUser: null,
  });
  const [loading, setLoading] = useState<Record<Operation, boolean>>({ ...emptyLoading, auth: true });
  const [errors, setErrors] = useState<Record<Operation, string | null>>(emptyErrors);

  const setOperation = (operation: Operation, isLoading: boolean, error: string | null = null) => {
    setLoading((current) => ({ ...current, [operation]: isLoading }));
    setErrors((current) => ({ ...current, [operation]: error }));
  };

  const loadAppData = useCallback(async (user: User) => {
    setOperation("projects", true);
    setOperation("tasks", true);
    setOperation("dashboard", true);

    try {
      const projectsResponse = await getProjects();
      const rawProjects = projectsResponse.data?.data?.projects ?? [];
      const projectIds = rawProjects.map((project: unknown) => getId(project)).filter(Boolean);

      const taskResponses = await Promise.all(projectIds.map((projectId: string) => getTasks({ projectId })));
      const rawTasks = taskResponses.flatMap((response) => response.data?.data?.tasks ?? []);

      let dashboard: DashboardData | null = null;

      try {
        const dashboardResponse = await getDashboard();
        const rawDashboard = dashboardResponse.data?.data;
        dashboard = rawDashboard
          ? {
              totalTasks: rawDashboard.totalTasks ?? 0,
              completedTasks: rawDashboard.completedTasks ?? 0,
              inProgressTasks: rawDashboard.inProgressTasks ?? 0,
              overdueTasks: rawDashboard.overdueTasks ?? 0,
              overdueTaskList: (rawDashboard.overdueTaskList ?? []).map(mapTask),
              tasksAssignedToMe: (rawDashboard.tasksAssignedToMe ?? []).map(mapTask),
            }
          : null;
        setOperation("dashboard", false);
      } catch (error) {
        setOperation("dashboard", false, getApiMessage(error, "Unable to load dashboard"));
      }

      setState((current) => ({
        ...current,
        users: collectUsers(user, rawProjects, rawTasks),
        projects: rawProjects.map(mapProject),
        tasks: rawTasks.map(mapTask),
        dashboard,
        currentUser: user,
      }));

      setOperation("projects", false);
      setOperation("tasks", false);
    } catch (error) {
      const message = getApiMessage(error, "Unable to load workspace data");
      setOperation("projects", false, message);
      setOperation("tasks", false, message);
    }
  }, []);

  const reload = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setState({ users: [], projects: [], tasks: [], dashboard: null, currentUser: null });
      setOperation("auth", false);
      return;
    }

    setOperation("auth", true);

    try {
      const response = await getCurrentUser();
      const user = mapUser(response.data?.data?.user);
      setOperation("auth", false);
      await loadAppData(user);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setState({ users: [], projects: [], tasks: [], dashboard: null, currentUser: null });
      setOperation("auth", false, getApiMessage(error, "Your session has expired"));
    }
  }, [loadAppData]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<AppContextValue>(() => {
    const authenticate = async (request: Promise<unknown>, fallback: string): Promise<Result> => {
      setOperation("auth", true);

      try {
        const response = await request;
        const responseRecord = asRecord(response);
        const data = asRecord(asRecord(responseRecord.data).data);
        const token = asString(data.accessToken, asString(data.token));

        if (!token) {
          throw new Error("Authentication token was not returned");
        }

        localStorage.setItem(TOKEN_KEY, token);
        const user = mapUser(data.user);
        setState((current) => ({ ...current, currentUser: user }));
        setOperation("auth", false);
        await loadAppData(user);
        return { ok: true };
      } catch (error) {
        const message = getApiMessage(error, fallback);
        localStorage.removeItem(TOKEN_KEY);
        setOperation("auth", false, message);
        return { ok: false, error: message };
      }
    };

    return {
      ...state,
      loading,
      errors,
      reload,
      login: (email, password) => authenticate(loginUser({ email, password }), "Invalid email or password"),
      signup: (name, email, password) => authenticate(signupUser({ name, email, password }), "Unable to create account"),
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ users: [], projects: [], tasks: [], dashboard: null, currentUser: null });
        setErrors(emptyErrors);
      },

      createProject: async ({ name, description }) => {
        setOperation("projects", true);

        try {
          const response = await createProjectApi({ name, description });
          const rawProject = response.data?.data?.project;
          setState((current) => ({
            ...current,
            projects: [mapProject(rawProject), ...current.projects],
            users: collectUsers(current.currentUser, [rawProject], []),
          }));
          setOperation("projects", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to create project");
          setOperation("projects", false, message);
          return { ok: false, error: message };
        }
      },

      updateProjectMembers: async (projectId, memberIds) => {
        setOperation("projects", true);

        try {
          const project = state.projects.find((item) => item.id === projectId);
          const currentMemberIds = new Set(project?.memberIds ?? []);
          const nextMemberIds = new Set(memberIds);
          let latestRawProject: unknown = null;

          for (const userId of memberIds) {
            if (!currentMemberIds.has(userId)) {
              const user = state.users.find((item) => item.id === userId);
              if (user?.email) {
                const response = await addProjectMemberApi(projectId, { email: user.email, role: "member" });
                latestRawProject = response.data?.data?.project;
              }
            }
          }

          for (const userId of currentMemberIds) {
            if (!nextMemberIds.has(userId)) {
              const response = await removeProjectMemberApi(projectId, userId);
              latestRawProject = response.data?.data?.project;
            }
          }

          if (latestRawProject) {
            setState((current) => ({
              ...current,
              projects: current.projects.map((item) => (item.id === projectId ? mapProject(latestRawProject) : item)),
              users: collectUsers(current.currentUser, [latestRawProject], []),
            }));
          }

          setOperation("projects", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to update project members");
          setOperation("projects", false, message);
          return { ok: false, error: message };
        }
      },

      deleteProject: async (projectId) => {
        setOperation("projects", true);

        try {
          await deleteProjectApi(projectId);
          setState((current) => ({
            ...current,
            projects: current.projects.filter((project) => project.id !== projectId),
            tasks: current.tasks.filter((task) => task.projectId !== projectId),
          }));
          setOperation("projects", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to delete project");
          setOperation("projects", false, message);
          return { ok: false, error: message };
        }
      },

      createTask: async (data) => {
        setOperation("tasks", true);

        try {
          const response = await createTaskApi({
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            dueDate: data.dueDate,
            project: data.projectId,
            assignee: data.assigneeId,
          });
          const rawTask = response.data?.data?.task;
          setState((current) => ({
            ...current,
            tasks: [mapTask(rawTask), ...current.tasks],
            users: collectUsers(current.currentUser, [], [rawTask]),
          }));
          setOperation("tasks", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to create task");
          setOperation("tasks", false, message);
          return { ok: false, error: message };
        }
      },

      updateTask: async (id, patch) => {
        setOperation("tasks", true);

        try {
          const response = await updateTaskApi(id, {
            title: patch.title,
            description: patch.description,
            priority: patch.priority,
            status: patch.status,
            dueDate: patch.dueDate,
            assignee: patch.assigneeId,
          });
          const rawTask = response.data?.data?.task;
          setState((current) => ({
            ...current,
            tasks: current.tasks.map((task) => (task.id === id ? mapTask(rawTask) : task)),
            users: collectUsers(current.currentUser, [], [rawTask]),
          }));
          setOperation("tasks", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to update task");
          setOperation("tasks", false, message);
          return { ok: false, error: message };
        }
      },

      deleteTask: async (id) => {
        setOperation("tasks", true);

        try {
          await deleteTaskApi(id);
          setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
          setOperation("tasks", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to delete task");
          setOperation("tasks", false, message);
          return { ok: false, error: message };
        }
      },

      moveTask: async (id, status) => {
        setOperation("tasks", true);

        try {
          const response = await updateTaskStatus(id, status);
          const rawTask = response.data?.data?.task;
          setState((current) => ({
            ...current,
            tasks: current.tasks.map((task) => (task.id === id ? mapTask(rawTask) : task)),
          }));
          setOperation("tasks", false);
          return { ok: true };
        } catch (error) {
          const message = getApiMessage(error, "Unable to update task status");
          setOperation("tasks", false, message);
          return { ok: false, error: message };
        }
      },
    };
  }, [errors, loadAppData, loading, reload, state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const priorityLabel: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };
export const statusLabel: Record<TaskStatus, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
