import { Link } from "@tanstack/react-router";
import { Home, BookOpen, NotebookPen, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const { t } = useTranslation();
  const items = [
    { to: "/dashboard", icon: Home, label: t("nav.dashboard") },
    { to: "/library", icon: BookOpen, label: t("nav.library") },
    { to: "/prep", icon: NotebookPen, label: t("nav.prep") },
    { to: "/profile", icon: User, label: t("nav.profile") },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-muted-foreground transition data-[status=active]:text-primary data-[status=active]:bg-primary/10 data-[status=active]:font-semibold"
              activeOptions={{ exact: false }}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
