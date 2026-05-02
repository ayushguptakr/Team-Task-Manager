import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ListTodo } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { currentUser, login, signup, loading } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@taskflow.demo");
  const [password, setPassword] = useState("password");

  if (currentUser) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = mode === "login" ? await login(email, password) : await signup(name, email, password);
    if (!res.ok) { toast.error(res.error ?? "Something went wrong"); return; }
    toast.success(mode === "login" ? "Welcome back!" : "Account created");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 gradient-subtle">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <ListTodo className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight">TaskFlow</span>
        </div>

        <div className="bg-card rounded-2xl shadow-elegant-lg border p-8">
          <h1 className="text-2xl font-bold mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? "Sign in to manage your team's work." : "Sign up to start managing tasks."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading.auth} className="w-full gradient-primary text-white shadow-glow hover:opacity-95">
              {loading.auth ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
          >
            {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6 text-xs text-muted-foreground bg-accent/50 border border-accent rounded-lg p-3 text-center">
          <strong>Demo:</strong> admin@taskflow.com / password123 (Admin) /
          jordan@taskflow.com / password123 (Member)
        </div>
      </div>
    </div>
  );
}
