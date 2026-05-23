import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/AppHeader";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — Lybanhi" }] }),
  component: Library,
});

function Library() {
  const { t } = useTranslation();
  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4">
        <h1 className="font-display text-2xl font-bold">{t("library.title")}</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{t("library.empty")}</p>
        </div>
      </div>
    </>
  );
}
