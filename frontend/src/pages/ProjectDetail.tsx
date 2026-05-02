import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
} from "@dnd-kit/core";

import { useApp, statusLabel } from "@/store/AppContext";
import type { Project, Task, TaskStatus, Priority, User } from "@/types";
import { UserAvatar } from "@/components/UserAvatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    projects, tasks, users, currentUser,
    moveTask, deleteTask, updateProjectMembers,
  } = useApp();

  const project = projects.find((p) => p.id === id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!project) return <Navigate to="/projects" replace />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const isAdmin = currentUser.role === "admin";
  const isMember = project.memberIds.includes(currentUser.id);
  if (!isAdmin && !isMember) return <Navigate to="/projects" replace />;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectMembers = project.memberIds.map((mid) => users.find((u) => u.id === mid)!).filter(Boolean);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    if (COLUMNS.includes(overId as TaskStatus)) {
      moveTask(taskId, overId as TaskStatus);
    }
  };

  const activeTask = activeId ? projectTasks.find((t) => t.id === activeId) : null;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex items-center gap-3 text-sm">
        <Link to="/projects" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex -space-x-2 mr-2">
            {projectMembers.slice(0, 5).map((m) => <UserAvatar key={m.id} user={m} size="sm" />)}
            {projectMembers.length > 5 && (
              <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center justify-center ring-2 ring-background">
                +{projectMembers.length - 5}
              </div>
            )}
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => setMembersOpen(true)}>
              <Users className="h-4 w-4 mr-1" /> Members
            </Button>
          )}
          <Button onClick={() => { setEditingTask(null); setTaskOpen(true); }} className="gradient-primary text-white shadow-glow">
            <Plus className="h-4 w-4 mr-1" /> New task
          </Button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              status={col}
              tasks={projectTasks.filter((t) => t.status === col)}
              users={users}
              onEdit={(t) => { setEditingTask(t); setTaskOpen(true); }}
              onDelete={(t) => {
                if (!isAdmin) return;
                if (confirm(`Delete task "${t.title}"?`)) { deleteTask(t.id); toast.success("Task deleted"); }
              }}
              canDelete={isAdmin}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} users={users} dragging />}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        projectId={project.id}
        editingTask={editingTask}
        members={projectMembers}
      />

      <MembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        project={project}
        users={users}
        onSave={(ids) => { updateProjectMembers(project.id, ids); toast.success("Members updated"); }}
      />
    </div>
  );
}

function KanbanColumn({ status, tasks, users, onEdit, onDelete, canDelete }: {
  status: TaskStatus; tasks: Task[]; users: User[];
  onEdit: (t: Task) => void; onDelete: (t: Task) => void; canDelete: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const accent = {
    todo: "bg-muted-foreground",
    in_progress: "bg-warning",
    done: "bg-success",
  }[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-card/60 backdrop-blur-sm p-4 transition-all min-h-[400px]",
        isOver && "ring-2 ring-primary bg-accent/40",
      )}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={cn("h-2 w-2 rounded-full", accent)} />
        <h3 className="font-semibold text-sm">{statusLabel[status]}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((t) => (
          <DraggableTask key={t.id} task={t} users={users} onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6 border-2 border-dashed rounded-xl">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableTask({ task, users, onEdit, onDelete, canDelete }: {
  task: Task; users: User[];
  onEdit: (t: Task) => void; onDelete: (t: Task) => void; canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <TaskCard task={task} users={users} onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} />
    </div>
  );
}

function TaskCard({ task, users, onEdit, onDelete, canDelete, dragging }: {
  task: Task; users: User[];
  onEdit?: (t: Task) => void; onDelete?: (t: Task) => void; canDelete?: boolean;
  dragging?: boolean;
}) {
  const assignee = users.find((u) => u.id === task.assigneeId);
  const overdue = task.status !== "done" && isPast(parseISO(task.dueDate));

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 shadow-elegant hover:shadow-elegant-lg transition-all cursor-grab active:cursor-grabbing",
        overdue && "border-destructive/40 bg-destructive/[0.03]",
        dragging && "rotate-2 shadow-elegant-lg cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-snug flex-1">{task.title}</h4>
        {canDelete && onDelete && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="text-muted-foreground hover:text-destructive p-1 -m-1 rounded"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <PriorityBadge priority={task.priority} />
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
          overdue ? "text-destructive border-destructive/30 bg-destructive/10" : "text-muted-foreground border-border bg-muted/50",
        )}>
          <CalendarIcon className="h-3 w-3" />
          {format(parseISO(task.dueDate), "MMM d")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <UserAvatar user={assignee} size="sm" />
        {onEdit && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function TaskDialog({ open, onOpenChange, projectId, editingTask, members }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  projectId: string; editingTask: Task | null; members: User[];
}) {
  const { createTask, updateTask } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");

  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description);
        setPriority(editingTask.priority);
        setStatus(editingTask.status);
        setDueDate(editingTask.dueDate.slice(0, 10));
        setAssigneeId(editingTask.assigneeId ?? "");
      } else {
        setTitle(""); setDescription(""); setPriority("medium");
        setStatus("todo"); setDueDate(""); setAssigneeId("");
      }
    }
  }, [open, editingTask]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    const iso = new Date(dueDate).toISOString();
    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(), description: description.trim(), priority,
        status, dueDate: iso, assigneeId: assigneeId || null,
      });
      toast.success("Task updated");
    } else {
      createTask({
        projectId, title: title.trim(), description: description.trim(),
        priority, status, dueDate: iso, assigneeId: assigneeId || null,
      });
      toast.success("Task created");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editingTask ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ttitle">Title</Label>
            <Input id="ttitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tdesc">Description</Label>
            <Textarea id="tdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tdate">Due date</Label>
              <Input id="tdate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId || "none"} onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary text-white">
              {editingTask ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MembersDialog({ open, onOpenChange, project, users, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  project: Project; users: User[]; onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>(project.memberIds);
  useEffect(() => { if (open) setIds(project.memberIds); }, [open, project.memberIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Manage members</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-72 overflow-auto">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
              <Checkbox
                checked={ids.includes(u.id)}
                onCheckedChange={(c) => setIds((prev) => c ? [...prev, u.id] : prev.filter((x) => x !== u.id))}
              />
              <UserAvatar user={u} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">{u.role}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(ids); onOpenChange(false); }} className="gradient-primary text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
