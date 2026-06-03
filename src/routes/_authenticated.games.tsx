import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getDashboard } from "@/lib/quiz.functions";
import { listUnlockedBlooks, equipBlook, BLOOKS, convertXpToCoins, unlockGame, type Blook } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { Gamepad2, Lock, Sparkles, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";

const GamesSearchSchema = z.object({
  tab: z.enum(["play", "locker", "avatar", "bank"]).optional(),
});

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Games — Lybanhi" }] }),
  validateSearch: (search) => GamesSearchSchema.parse(search),
  component: GamesHub,
});

function GamesHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tab } = Route.useSearch();

  const getDash = useServerFn(getDashboard);
  const listBlooks = useServerFn(listUnlockedBlooks);
  const equipAvatar = useServerFn(equipBlook);
  const convertXp = useServerFn(convertXpToCoins);
  const unlock = useServerFn(unlockGame);

  const { data: dash, isLoading: dashLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const { data: locker, isLoading: lockerLoading } = useQuery({ queryKey: ["unlockedBlooks"], queryFn: () => listBlooks() });

  const [activeTab, setActiveTab] = useState<"play" | "locker" | "avatar" | "bank">(tab ?? "play");
  const [amountToConvert, setAmountToConvert] = useState(1);
  const [showConfirmBankModal, setShowConfirmBankModal] = useState(false);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const coins = dash?.streak.coins ?? 0;
  const totalXp = dash?.streak.total_xp ?? 0;
  const unlockedGames = dash?.streak.unlocked_games ?? [];

  const isGoldQuestUnlocked = unlockedGames.includes("gold-quest");
  const isSpaceRushUnlocked = unlockedGames.includes("space-rush");

  const convertMutation = useMutation({
    onMutate: () => {
      setShowConfirmBankModal(false);
    },
    mutationFn: (amount: number) => convertXp({ data: { amount } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("games.convertSuccess", { xp: amountToConvert * 7000, coins: amountToConvert, currency: "Sombreritos", defaultValue: `Successfully converted ${amountToConvert * 7000} XP into ${amountToConvert} Sombreritos!` }));
      setAmountToConvert(1);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (gameId: string) => unlock({ data: { gameId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("games.unlockSuccess", "Game successfully unlocked!"));
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  const equipMutation = useMutation({
    mutationFn: (blookId: string | null) => equipAvatar({ data: { blookId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unlockedBlooks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("games.activeBlook", "Active Blook") + "!");
    },
    onError: () => toast.error(t("common.error")),
  });

  if (dashLoading) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto max-w-md px-5 pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
          </div>
          
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
          </div>
        </div>
      </>
    );
  }

  if (activeTab === "avatar") {
    return (
      <div className="animate-in fade-in duration-300">
        <AvatarCustomizer
          inline={false}
          onClose={() => {
            setActiveTab("play");
            navigate({ to: "/games", search: { tab: "play" } });
          }}
        />
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-3xl px-5 pt-4 pb-24">
        {/* Hub Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("games.title", { defaultValue: "Games" })}</h1>
            <p className="text-xs text-muted-foreground">{t("games.subtitle", { defaultValue: "Spend coins to play & collect avatars!" })}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3 py-1.5 font-display text-sm font-bold text-gold-foreground shadow-sm">
            <img src={streakCap} alt="" className="size-4 shrink-0 select-none" />
            <span>{coins}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 flex gap-2 border-b border-border pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
          {(["play", "locker", "avatar", "bank"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-sm font-semibold capitalize transition px-3 ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "bank" ? t("games.convertXp", { defaultValue: "Convertir XP" }) :
               tab === "avatar" ? t("games.avatar", { defaultValue: "Avatar" }) :
               t(`games.${tab}`, { defaultValue: tab })}
            </button>
          ))}
        </div>

        {/* Play Tab */}
        {activeTab === "play" && (
          <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: "wordle",
                title: "Wordle de carreras",
                style: "Léxico / Vocabulario",
                desc: "Adivina palabras relacionadas con carreras universitarias y áreas de estudio en 6 intentos. Incluye retroalimentación por color y tarjeta de carrera.",
                cost: 100,
                path: "/games/wordle",
                styleColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
              },
              {
                id: "complete-concept",
                title: "Completa el concepto",
                style: "Drag & Drop / Conceptos",
                desc: "Arrastra la palabra correcta al espacio en blanco para completar la definición académica antes de que se agote el tiempo (60s).",
                cost: 200,
                path: "/games/complete-concept",
                styleColor: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
              },
              {
                id: "hangman",
                title: "Ahorcado universitario",
                style: "Ahorcado / Términos",
                desc: "Salva al personaje con estados de ánimo adivinando términos técnicos y académicos reales. Obtén pistas de carreras universitarias.",
                cost: 300,
                path: "/games/hangman",
                styleColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
              },
              {
                id: "order-idea",
                title: "Ordena la idea",
                style: "Reconstrucción de ideas",
                desc: "Ordena fragmentos de definiciones, hipótesis o conceptos académicos mezclados aleatoriamente en el menor tiempo posible.",
                cost: 400,
                path: "/games/order-idea",
                styleColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
              },
              {
                id: "connect-area",
                title: "Conecta tu área",
                style: "Asociación de pares",
                desc: "Conecta términos con áreas de estudio, herramientas con carreras, o conceptos con su definición bajo un límite de 60 segundos.",
                cost: 500,
                path: "/games/connect-area",
                styleColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
              },
              {
                id: "dictation",
                title: "Dictado académico con IA",
                style: "Dictado / Ortografía",
                desc: "Escucha términos universitarios reales en audio y escríbelos. El análisis ortográfico detecta errores y te enseña las reglas.",
                cost: 600,
                path: "/games/dictation",
                styleColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
              },
              {
                id: "gold-quest",
                title: "Gold Quest",
                style: "Blooket Style",
                desc: "Answer fast-paced trivia questions correctly to open mystery chests. Steal or double your gold against AI players!",
                cost: 500,
                path: "/games/gold-quest",
                styleColor: "bg-primary/10 text-primary border-primary/20",
              },
              {
                id: "space-rush",
                title: "Space Rush",
                style: "Quizizz Style",
                desc: "Blast off into orbit! Answer questions correctly to accelerate your rocket ship and beat simulated competitors.",
                cost: 1000,
                path: "/games/space-rush",
                styleColor: "bg-success/15 text-success border-success/20",
              }
            ].map((game) => {
              const isUnlocked = unlockedGames.includes(game.id);
              return (
                <div key={game.id} className="relative rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between overflow-hidden">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${game.styleColor}`}>
                      {game.style}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-bold">{game.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {game.desc}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                      <span className="text-gold-foreground flex items-center gap-1">
                        <img src={streakCap} alt="" className="size-3.5 select-none" />
                        {isUnlocked ? "Acceso Libre" : `${game.cost} XP`}
                      </span>
                      <span className="text-success">🏆 Gana sombreritos</span>
                    </div>
                  </div>
                  
                  {isUnlocked ? (
                    <button
                      onClick={() => navigate({ to: game.path as any })}
                      className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition active:scale-95 cursor-pointer border-none"
                    >
                      <Gamepad2 className="size-4" /> Empezar juego
                    </button>
                  ) : (
                    <button
                      disabled={unlockMutation.isPending || totalXp < game.cost}
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas desbloquear ${game.title} por ${game.cost} XP?`)) {
                          unlockMutation.mutate(game.id);
                        }
                      }}
                      className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-muted border border-border text-muted-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/40 font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className="size-4 text-muted-foreground" /> Desbloquear por {game.cost} XP
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Locker Tab */}
        {activeTab === "locker" && (
          <section className="mt-5">
            {/* Info Card explaining Blooks & Locker */}
            <div className="mb-5 bg-[#3B6DE8]/5 border border-[#3B6DE8]/15 rounded-2xl p-4 flex gap-3 items-start text-left">
              <span className="text-2xl shrink-0">🎒</span>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">¿Qué es el Locker?</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Aquí se guardan tus <strong>Blooks</strong> (avatares coleccionables). Puedes hacer clic sobre cualquiera que hayas desbloqueado para equiparlo como insignia activa junto a tu nombre de perfil.
                </p>
                <p className="mt-2 text-[11px] text-[#3B6DE8] font-bold flex items-center gap-1">
                  <span>💡</span>
                  <span>Se consiguen comprando paquetes en "Jugar" usando Sombreritos (intercambiados en "Convertir XP").</span>
                </p>
              </div>
            </div>

            {lockerLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("games.collection", { unlocked: locker?.unlockedIds.length || 0, total: Object.keys(BLOOKS).length, defaultValue: `Collection: ${locker?.unlockedIds.length || 0} / ${Object.keys(BLOOKS).length}` })}
                  </span>
                  {locker?.activeBlookId && (
                    <button
                      onClick={() => equipMutation.mutate(null)}
                      className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                    >
                      {t("games.unequip", { defaultValue: "Unequip Active Blook" })}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {Object.values(BLOOKS).map((b) => {
                    const isUnlocked = locker?.unlockedIds.includes(b.id);
                    const isActive = locker?.activeBlookId === b.id;
                    const borderCls = isActive
                      ? "border-2 border-primary ring-2 ring-primary/20 scale-105"
                      : "border border-border";

                    return (
                      <button
                        key={b.id}
                        disabled={!isUnlocked || equipMutation.isPending}
                        onClick={() => equipMutation.mutate(b.id)}
                        className={`flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-card transition active:scale-95 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed ${borderCls} ${
                          !isUnlocked ? "opacity-40 grayscale" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="text-3xl select-none">{isUnlocked ? b.emoji : "❓"}</div>
                        <span className="truncate w-full text-[9px] font-bold text-center leading-tight">
                          {isUnlocked ? t(`games.blookName.${b.id}`, { defaultValue: b.name }) : t("games.locked", { defaultValue: "Locked" })}
                        </span>
                        {isUnlocked && (
                          <span className={`text-[7px] px-1 rounded-full font-bold uppercase ${
                            b.rarity === "legendary" ? "bg-amber-400/20 text-amber-600" :
                            b.rarity === "epic" ? "bg-purple-500/20 text-purple-600" :
                            b.rarity === "rare" ? "bg-emerald-400/20 text-emerald-600" :
                            "bg-blue-400/20 text-blue-600"
                          }`}>
                            {t(`games.rarity.${b.rarity}`, { defaultValue: b.rarity })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

      {/* Bank Tab Rendering */}
      {activeTab === "bank" && (
        <section className="mt-5 space-y-5 animate-in fade-in duration-300">
          {/* XP Status & Progress */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold flex items-center gap-1.5 text-muted-foreground">
                  <Trophy className="size-4 text-gold-foreground" />
                  <span>{t("profile.totalXp", { defaultValue: "Total XP" })}</span>
                </h3>
                <p className="mt-0.5 text-2xl font-black font-display text-primary">{totalXp.toLocaleString()} XP</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{t("games.conversionRate", { defaultValue: "Rate: 7,000 XP = 1 Cap" })}</span>
                {totalXp % 7000 !== 0 && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-semibold">
                    {t("games.xpRequired", { count: 7000 - (totalXp % 7000), defaultValue: `${7000 - (totalXp % 7000)} XP needed for next Cap` })}
                  </p>
                )}
              </div>
            </div>

            {/* Custom elegant Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>{t("games.progressToNext", { defaultValue: "Progress to next Cap" })}</span>
                <span>{Math.min(100, Math.round(((totalXp % 7000) / 7000) * 100))}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted border border-border shadow-inner relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
                  style={{ width: `${Math.min(100, Math.round(((totalXp % 7000) / 7000) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Converter Panel */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-5">
            <h3 className="font-display text-sm font-bold text-foreground">{t("games.chooseAmount", { defaultValue: "Choose how many Caps you want to obtain:" })}</h3>
            
            {Math.floor(totalXp / 7000) > 0 ? (
              <div className="space-y-5">
                {/* Select amount controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    disabled={amountToConvert <= 1}
                    onClick={() => setAmountToConvert(p => Math.max(1, p - 1))}
                    className="size-10 grid place-items-center rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed font-black transition active:scale-90 font-bold"
                  >
                    -
                  </button>
                  <div className="text-center min-w-24">
                    <span className="text-3xl font-black font-display text-primary flex items-center justify-center gap-1 leading-none">
                      <img src={streakCap} alt="" className="size-6 shrink-0" />
                      {amountToConvert}
                    </span>
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      = {(amountToConvert * 7000).toLocaleString()} XP
                    </span>
                  </div>
                  <button
                    disabled={amountToConvert >= Math.floor(totalXp / 7000)}
                    onClick={() => setAmountToConvert(p => Math.min(Math.floor(totalXp / 7000), p + 1))}
                    className="size-10 grid place-items-center rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed font-black transition active:scale-90 font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Converter Slider */}
                <div className="px-2">
                  <input
                    type="range"
                    min={1}
                    max={Math.floor(totalXp / 7000)}
                    value={amountToConvert}
                    onChange={(e) => setAmountToConvert(Number(e.target.value))}
                    className="w-full h-2 bg-muted border border-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
                    <span>1 Cap</span>
                    <span>{Math.floor(totalXp / 7000)} Caps Max</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmBankModal(true)}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold font-bold text-gold-foreground shadow-elegant transition active:scale-[0.98] hover:opacity-95 cursor-pointer"
                >
                  <Trophy className="size-4 text-gold-foreground animate-pulse" />
                  <span>{t("games.convertButton", { defaultValue: "Convert to Caps" })}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6 px-4 space-y-2 rounded-2xl border border-dashed border-border bg-muted/30">
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("games.noXpForConversion", { defaultValue: "Not enough XP yet!" })}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {t("games.earnMoreXpAlert", { defaultValue: "You need at least 7,000 XP to perform a conversion. Answer more quizzes in the Prep section to earn XP!" })}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bank Conversion Confirmation Modal */}
      {showConfirmBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-elegant space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-2xl bg-gold/10 text-gold-foreground grid place-items-center mx-auto text-xl">🎓</div>
            <h3 className="text-center font-display text-lg font-black text-foreground">
              {t("games.convertXp", { defaultValue: "Convertir XP" })}
            </h3>
            <p className="text-center text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {t("games.confirmConversion", {
                xp: (amountToConvert * 7000).toLocaleString(),
                coins: amountToConvert,
                defaultValue: `Are you sure you want to convert ${(amountToConvert * 7000).toLocaleString()} XP into ${amountToConvert} Graduation Caps?`
              })}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmBankModal(false)}
                className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition active:scale-95 cursor-pointer"
              >
                {t("common.back", { defaultValue: "Volver" })}
              </button>
              <button
                disabled={convertMutation.isPending}
                onClick={() => convertMutation.mutate(amountToConvert)}
                className="flex-1 h-11 rounded-xl bg-gold text-gold-foreground text-xs font-bold shadow-sm hover:opacity-95 transition active:scale-[0.95] disabled:opacity-60 cursor-pointer"
              >
                {convertMutation.isPending ? "..." : t("common.continue", { defaultValue: "Confirmar" })}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
