import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import "@/i18n";
import { useTranslation } from "react-i18next";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "LybanhiAI — Descubre el proposito por el que fuiste creado" },
      { name: "description", content: "En Lybanhi AI podrás descubrir tu vocación según tus gustos y habilidades. Recibe guías y apoyo especializado para tu examen de admisión universitaria." },
      { name: "theme-color", content: "#1E40AF" },
      { property: "og:title", content: "LybanhiAI — Descubre el proposito por el que fuiste creado" },
      { name: "twitter:title", content: "LybanhiAI — Descubre el proposito por el que fuiste creado" },
      { property: "og:description", content: "En Lybanhi AI podrás descubrir tu vocación según tus gustos y habilidades. Recibe guías y apoyo especializado para tu examen de admisión universitaria." },
      { name: "twitter:description", content: "En Lybanhi AI podrás descubrir tu vocación según tus gustos y habilidades. Recibe guías y apoyo especializado para tu examen de admisión universitaria." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/794ed2e6-1118-4b20-b029-9722f4ff88f2" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/794ed2e6-1118-4b20-b029-9722f4ff88f2" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&family=Rajdhani:wght@400;500;600;700;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function LangSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("lybanhi_lang");
    const browserLanguage = window.navigator.language.slice(0, 2);
    const nextLanguage = savedLanguage ?? (["es", "en", "fr"].includes(browserLanguage) ? browserLanguage : "es");
    const currentLang = i18n.language ? i18n.language.slice(0, 2) : "";
    if (nextLanguage !== currentLang) void i18n.changeLanguage(nextLanguage);
  }, [i18n]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    window.localStorage.setItem("lybanhi_lang", i18n.language.slice(0, 2));
  }, [i18n.language]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LangSync />
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
