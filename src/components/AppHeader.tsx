import { Link } from "@tanstack/react-router";
import streakCap from "@/assets/streak-cap.png";
import { Bell } from "lucide-react";
import type { ReactNode } from "react";

export function AppHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={streakCap} alt="Lybanhi" width={28} height={28} className="size-7" />
          <span className="font-display text-lg font-bold text-primary">Lybanhi</span>
        </Link>
        <div className="flex items-center gap-2">
          {right}
          <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Notifications">
            <Bell className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
