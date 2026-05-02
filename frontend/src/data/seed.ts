import type { User, Project, Task } from "@/types";

const today = new Date();
const daysFromNow = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString();
};

export const seedUsers: User[] = [
  { id: "u1", name: "Avery Chen", email: "admin@taskflow.demo", password: "password", role: "admin", avatarColor: "245 75% 60%" },
  { id: "u2", name: "Jordan Patel", email: "jordan@taskflow.demo", password: "password", role: "member", avatarColor: "200 70% 55%" },
  { id: "u3", name: "Riley Kim", email: "riley@taskflow.demo", password: "password", role: "member", avatarColor: "145 65% 45%" },
  { id: "u4", name: "Morgan Diaz", email: "morgan@taskflow.demo", password: "password", role: "member", avatarColor: "35 95% 55%" },
  { id: "u5", name: "Sasha Wolfe", email: "sasha@taskflow.demo", password: "password", role: "member", avatarColor: "330 75% 60%" },
];

export const seedProjects: Project[] = [
  {
    id: "p1",
    name: "Website Redesign",
    description: "Refresh the marketing site with new branding and improved performance.",
    memberIds: ["u1", "u2", "u3", "u4"],
    createdAt: daysFromNow(-30),
  },
  {
    id: "p2",
    name: "Mobile App Launch",
    description: "Ship v1 of the iOS and Android apps with core task management.",
    memberIds: ["u1", "u3", "u4", "u5"],
    createdAt: daysFromNow(-14),
  },
];

export const seedTasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Design hero section", description: "Create 3 hero variants for A/B testing.", priority: "high", dueDate: daysFromNow(-2), assigneeId: "u2", status: "in_progress", createdAt: daysFromNow(-10) },
  { id: "t2", projectId: "p1", title: "Audit current SEO", description: "Run a full audit and produce a prioritized fix list.", priority: "medium", dueDate: daysFromNow(5), assigneeId: "u3", status: "todo", createdAt: daysFromNow(-9) },
  { id: "t3", projectId: "p1", title: "Migrate blog to MDX", description: "Convert legacy blog posts to MDX with frontmatter.", priority: "low", dueDate: daysFromNow(12), assigneeId: "u4", status: "todo", createdAt: daysFromNow(-8) },
  { id: "t4", projectId: "p1", title: "Implement new nav", description: "Build responsive nav per Figma.", priority: "high", dueDate: daysFromNow(3), assigneeId: "u2", status: "in_progress", createdAt: daysFromNow(-6) },
  { id: "t5", projectId: "p1", title: "Set up analytics", description: "Plausible + custom events.", priority: "medium", dueDate: daysFromNow(-5), assigneeId: "u3", status: "done", createdAt: daysFromNow(-15) },
  { id: "t6", projectId: "p1", title: "Footer revamp", description: "Add newsletter signup + social.", priority: "low", dueDate: daysFromNow(8), assigneeId: "u4", status: "done", createdAt: daysFromNow(-12) },
  { id: "t7", projectId: "p2", title: "Push notifications", description: "Integrate FCM/APNs and design templates.", priority: "high", dueDate: daysFromNow(-1), assigneeId: "u5", status: "in_progress", createdAt: daysFromNow(-7) },
  { id: "t8", projectId: "p2", title: "Onboarding flow", description: "3-step welcome with role selection.", priority: "medium", dueDate: daysFromNow(7), assigneeId: "u3", status: "todo", createdAt: daysFromNow(-6) },
  { id: "t9", projectId: "p2", title: "App icon and splash", description: "Final assets for both platforms.", priority: "low", dueDate: daysFromNow(10), assigneeId: "u4", status: "todo", createdAt: daysFromNow(-5) },
  { id: "t10", projectId: "p2", title: "Crash reporting", description: "Wire Sentry into both apps.", priority: "high", dueDate: daysFromNow(2), assigneeId: "u5", status: "in_progress", createdAt: daysFromNow(-4) },
  { id: "t11", projectId: "p2", title: "Beta TestFlight invite", description: "Invite first 50 testers.", priority: "medium", dueDate: daysFromNow(-3), assigneeId: "u1", status: "done", createdAt: daysFromNow(-9) },
  { id: "t12", projectId: "p2", title: "Privacy policy review", description: "Legal review for app store submission.", priority: "high", dueDate: daysFromNow(4), assigneeId: "u1", status: "todo", createdAt: daysFromNow(-3) },
];
