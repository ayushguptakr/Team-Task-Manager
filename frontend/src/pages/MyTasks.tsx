import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp, statusLabel } from "@/store/AppContext";
import { format, isPast, parseISO } from "date-fns";
import { PriorityBadge } from "@/components/PriorityBadge";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyTasks() {
  const { tasks, projects, currentUser, updateTask } = useApp();

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks
      .filter((t) => t.assigneeId === currentUser.id)
      .sort((a, b) => +parseISO(a.dueDate) - +parseISO(b.dueDate));
  }, [tasks, currentUser]);

  const grouped = {
    todo: myTasks.filter((t) => t.status === "todo"),
    in_progress: myTasks.filter((t) => t.status === "in_progress"),
    done: myTasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-1">Everything assigned to you across all projects.</p>
      </header>

      {myTasks.length === 0 ? (
        <div className="bg-card rounded-2xl border-2 border-dashed p-12 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No tasks assigned to you</p>
          <p className="text-sm text-muted-foreground">Enjoy the calm.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <section key={status}>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {statusLabel[status]} / {grouped[status].length}
              </h2>
              <div className="bg-card rounded-2xl border shadow-elegant overflow-hidden divide-y">
                {grouped[status].length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">Nothing here.</div>
                ) : grouped[status].map((t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  const overdue = t.status !== "done" && isPast(parseISO(t.dueDate));
                  return (
                    <div key={t.id} className={cn("px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors", overdue && "bg-destructive/5")}>
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={(e) => updateTask(t.id, { status: e.target.checked ? "done" : "todo" })}
                        className="h-4 w-4 accent-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium truncate", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</div>
                        <Link to={`/projects/${t.projectId}`} className="text-xs text-muted-foreground hover:text-primary">
                          {project?.name}
                        </Link>
                      </div>
                      <PriorityBadge priority={t.priority} />
                      <div className={cn("text-xs font-medium whitespace-nowrap", overdue ? "text-destructive" : "text-muted-foreground")}>
                        {format(parseISO(t.dueDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
