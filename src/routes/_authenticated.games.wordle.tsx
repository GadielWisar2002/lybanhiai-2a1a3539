import { createFileRoute } from "@tanstack/react-router";
import { RetoRelampagoGame } from "./_authenticated.games.reto-relampago";

export const Route = createFileRoute("/_authenticated/games/wordle")({
  head: () => ({ meta: [{ title: "Reto Relámpago — Trivia Educativa — Lybanhi" }] }),
  component: RetoRelampagoGame,
});

export default RetoRelampagoGame;
