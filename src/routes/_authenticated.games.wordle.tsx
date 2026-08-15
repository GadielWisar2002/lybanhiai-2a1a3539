import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/games/wordle")({
  beforeLoad: () => {
    throw redirect({ to: "/games/reto-relampago" });
  },
});
