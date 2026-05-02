import { useMemo, useState } from "react";
import { useApp } from "@/store/AppContext";
import { CheckCircle2, Clock, ListTodo, AlertTriangle, type LucideIcon } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { tasks, projects, users, currentUser } = useApp();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return projects;
    return projects.filter((p) => p.memberIds.includes(currentUser.id));
  }, [projects, currentUser]);

  const visibleTasks = useMemo(() => {
    const projectIds = new Set(visibleProjects.map((p) => p.id));
    return tasks
      .filter((t) => projectIds.has(t.projectId))
      .filter((t) => projectFilter === "all" || t.projectId === projectFilter)
      .filter((t) => assigneeFilter === "all" || t.assigneeId === assigneeFilter);
  }, [tasks, visibleProjects, projectFilter, assigneeFilter]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter((t) => t.status === "done").length;
    const inProgress = visibleTasks.filter((t) => t.status === "in_progress").length;
    const overdue = visibleTasks.filter((t) => t.status !== "done" && isPast(parseISO(t.dueDate))).length;
    return { total, done, inProgress, overdue };
  }, [visibleTasks]);

  const overdueTasks = visibleTasks
    .filter((t) => t.status !== "done" && isPast(parseISO(t.dueDate)))
    .sort((a, b) => +parseISO(a.dueDate) - +parseISO(b.dueDate));

  const userById = (id: string | null) => users.find((u) => u.id === id) ?? null;
  const projectById = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">A bird's-eye view of your team's work.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="primary" />
        <StatCard label="Completed" value={stats.done} icon={CheckCircle2} accent="success" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} accent="warning" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="destructive" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-card"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {visibleProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-card"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <section className="bg-card rounded-2xl border shadow-elegant overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold">Overdue tasks</h2>
          <span className="ml-auto text-xs text-muted-foreground">{overdueTasks.length} item(s)</span>
        </div>
        {overdueTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">Nothing overdue. Great work!</div>
        ) : (
          <ul className="divide-y">
            {overdueTasks.map((t) => {
              const project = projectById(t.projectId);
              return (
                <li key={t.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/projects/${t.projectId}`} className="font-medium hover:text-primary truncate block">
                      {t.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{project?.name}</div>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <div className="text-xs font-medium text-destructive whitespace-nowrap">
                    Due {format(parseISO(t.dueDate), "MMM d")}
                  </div>
                  <UserAvatar user={userById(t.assigneeId)} size="sm" />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: LucideIcon; accent: "primary" | "success" | "warning" | "destructive";
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[accent];
  return (
    <div className="bg-card rounded-2xl border p-5 shadow-elegant hover:shadow-elegant-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
