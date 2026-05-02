import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  user: Pick<User, "name" | "avatarColor"> | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({ user, size = "md", className }: Props) {
  if (!user) {
    return <div className={cn("rounded-full bg-muted", sizes[size], className)} />;
  }
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white shadow-sm ring-2 ring-background",
        sizes[size],
        className,
      )}
      style={{ background: `linear-gradient(135deg, hsl(${user.avatarColor}), hsl(${user.avatarColor} / 0.7))` }}
      title={user.name}
    >
      {initials}
    </div>
  );
}
