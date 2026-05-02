import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Projects() {
  const { projects, tasks, users, currentUser, createProject, deleteProject, loading, errors } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const isAdmin = currentUser?.role === "admin";

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return projects;
    return projects.filter((p) => p.memberIds.includes(currentUser.id));
  }, [projects, currentUser, isAdmin]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await createProject({ name: name.trim(), description: description.trim(), memberIds });
    if (!res.ok) { toast.error(res.error ?? "Unable to create project"); return; }
    setName(""); setDescription(""); setMemberIds([]);
    setOpen(false);
    toast.success("Project created");
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <header className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Browse projects you have access to.</p>
          {errors.projects && <p className="text-sm text-destructive mt-2">{errors.projects}</p>}
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white shadow-glow"><Plus className="h-4 w-4 mr-1" />New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pname">Name</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdesc">Description</Label>
                  <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Members</Label>
                  <div className="space-y-2 max-h-48 overflow-auto rounded-lg border p-3">
                    {users.filter((u) => u.id !== currentUser?.id).map((u) => (
                      <label key={u.id} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={memberIds.includes(u.id)}
                          onCheckedChange={(c) =>
                            setMemberIds((prev) => c ? [...prev, u.id] : prev.filter((x) => x !== u.id))
                          }
                        />
                        <UserAvatar user={u} size="sm" />
                        <span className="text-sm">{u.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{u.role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading.projects} className="gradient-primary text-white">
                    {loading.projects ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleProjects.map((p) => {
          const taskCount = tasks.filter((t) => t.projectId === p.id).length;
          const doneCount = tasks.filter((t) => t.projectId === p.id && t.status === "done").length;
          const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
          const members = p.memberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
          return (
            <div key={p.id} className="group bg-card rounded-2xl border p-6 shadow-elegant hover:shadow-elegant-lg hover:-translate-y-0.5 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                  <FolderKanban className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/projects/${p.id}`} className="font-semibold text-lg hover:text-primary block truncate">{p.name}</Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete project "${p.name}"?`)) {
                        const res = await deleteProject(p.id);
                        if (!res.ok) { toast.error(res.error ?? "Unable to delete project"); return; }
                        toast.success("Project deleted");
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">{doneCount}/{taskCount} tasks</span>
                  <span className="text-primary">{pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((m) => m && <UserAvatar key={m.id} user={m} size="sm" />)}
                    {members.length > 4 && (
                      <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center justify-center ring-2 ring-background">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                  <Link to={`/projects/${p.id}`} className="text-xs font-medium text-primary hover:underline">
                    Open board
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {visibleProjects.length === 0 && (
          <div className="col-span-full bg-card rounded-2xl border-2 border-dashed p-12 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">{isAdmin ? "Create your first project to get started." : "Ask an admin to add you to a project."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
