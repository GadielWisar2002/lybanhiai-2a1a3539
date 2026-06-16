import { createFileRoute, useNavigate, useLocation, Outlet, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getDashboard } from "@/lib/quiz.functions";
import { listUnlockedBlooks, equipBlook, BLOOKS, convertXpToCoins, unlockGame, buyBlookDirect, BLOOK_COSTS, type Blook, devAddXp, devAddCoins, devResetProgress, devToggleUnlockGame, devSetLevel } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { Gamepad2, Lock, Sparkles, Trophy, Settings, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";
import streakCap from "@/assets/streak-cap.png";
import { useAuth } from "@/hooks/use-auth";

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
  const location = useLocation();
  const qc = useQueryClient();
  const { tab } = Route.useSearch();

  const isRootGamesPath = location.pathname === "/games" || location.pathname === "/games/";

  if (!isRootGamesPath) {
    return <Outlet />;
  }

  const getDash = useServerFn(getDashboard);
  const listBlooks = useServerFn(listUnlockedBlooks);
  const equipAvatar = useServerFn(equipBlook);
  const convertXp = useServerFn(convertXpToCoins);
  const unlock = useServerFn(unlockGame);
  const buyDirect = useServerFn(buyBlookDirect);

  const addDevXp = useServerFn(devAddXp);
  const addDevCoins = useServerFn(devAddCoins);
  const resetDevProgress = useServerFn(devResetProgress);
  const toggleDevGame = useServerFn(devToggleUnlockGame);
  const setDevLvl = useServerFn(devSetLevel);

  const [devMode, setDevMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lybanhi_dev_mode");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [simulatedSeasonLevel, setSimulatedSeasonLevel] = useState(1);

  const { data: dash, isLoading: dashLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const { data: locker, isLoading: lockerLoading } = useQuery({ queryKey: ["unlockedBlooks"], queryFn: () => listBlooks() });

  const [activeTab, setActiveTab] = useState<"play" | "locker" | "avatar" | "bank">(tab === "avatar" ? "avatar" : (tab ?? "play"));
  const [amountToConvert, setAmountToConvert] = useState(1);
  const [showConfirmBankModal, setShowConfirmBankModal] = useState(false);
  const [selectedBlookToBuy, setSelectedBlookToBuy] = useState<Blook | null>(null);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab as any);
    }
  }, [tab]);

  const { user } = useAuth();
  const isDeveloper = user?.email?.toLowerCase() === "debanhivillanueva@colegiomaranatha.edu.mx" || 
                      user?.email?.toLowerCase()?.includes("debanhivillanueva@colegiomaranatha") ||
                      user?.email?.toLowerCase()?.includes("debanhivillanuevacolegiomaranatha") ||
                      dash?.email?.toLowerCase() === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                      dash?.email?.toLowerCase()?.includes("debanhivillanueva@colegiomaranatha") ||
                      dash?.email?.toLowerCase()?.includes("debanhivillanuevacolegiomaranatha") ||
                      dash?.isDeveloper === true;

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

  const buyBlookMutation = useMutation({
    mutationFn: (blookId: string) => buyDirect({ data: { blookId } }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["unlockedBlooks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡Desbloqueaste a ${data.blook.name}! 🎉`);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  const handleToggleDevMode = (checked: boolean) => {
    setDevMode(checked);
    if (typeof window !== "undefined") {
      localStorage.setItem("lybanhi_dev_mode", checked ? "true" : "false");
    }
    toast.info(checked ? "Modo Desarrollador Activado 🛠️" : "Modo Desarrollador Desactivado 🔒");
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleDevAddXp = async (amount: number) => {
    try {
      await addDevXp({ data: { amount } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡XP Ajustado! ${amount > 0 ? "+" : ""}${amount} XP.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleDevAddCoins = async (amount: number) => {
    try {
      await addDevCoins({ data: { amount } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡Sombreritos Ajustados! ${amount > 0 ? "+" : ""}${amount} Sombreritos.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleDevReset = async () => {
    if (confirm("¿Estás seguro de reiniciar TODO tu progreso? Se borrarán Blooks y XP.")) {
      try {
        await resetDevProgress();
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["unlockedBlooks"] });
        toast.success("Progreso reiniciado correctamente.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    }
  };

  const handleDevSetLvl = async (level: number) => {
    try {
      await setDevLvl({ data: { level } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡Nivel de usuario simulado!: Rango Nivel ${level}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleDevToggleGame = async (gameId: string, unlocked: boolean) => {
    try {
      await toggleDevGame({ data: { gameId, unlocked } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Juego ${gameId} ${unlocked ? "Desbloqueado" : "Bloqueado"} en base de datos.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleSimulateReward = () => {
    handleDevAddCoins(5);
    handleDevAddXp(50);
    toast.success("🎁 Recompensa Diaria Simulada: +5 Sombreritos, +50 XP");
  };

  const handleSimulateMission = () => {
    handleDevAddXp(120);
    handleDevAddCoins(3);
    toast.success("⚔️ Misión Completada Simulada: +120 XP, +3 Sombreritos");
  };

  const handleSimulateEvent = () => {
    toast.info("🔥 Evento Especial Simulado: 'Maratón de Lógica y Algoritmos' (Doble XP por 1 hora)");
  };

  const handleSimulateSeason = () => {
    const nextLvl = Math.min(20, simulatedSeasonLevel + 1);
    setSimulatedSeasonLevel(nextLvl);
    toast.success(`✨ Pase de Temporada: ¡Subiste al Nivel ${nextLvl} de la Temporada! Recompensas listas.`);
  };

  if (dashLoading) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto max-w-6xl px-5 pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
          </div>
          
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
            <div className="h-44 animate-pulse rounded-3xl bg-muted animate-in fade-in" />
          </div>
        </div>
      </>
    );
  }



  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-24">
        {/* Hub Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("games.title", { defaultValue: "Games" })}</h1>
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              <p>{t("games.subtitle", { defaultValue: "¡Juega y colecciona Blooks!" })}</p>
              <p className="text-[10px] font-bold text-slate-500">Sesión: {dash?.email} | Rol: {isDeveloper ? "developer" : "student"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDeveloper && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDevPanel(true)}
                  className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold px-3 py-1.5 rounded-full text-xs hover:bg-rose-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Settings className="size-3.5 animate-spin-slow" />
                  <span>Panel Dev 🛠️</span>
                </button>
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-bold">
                  <label htmlFor="dev-mode-toggle" className="cursor-pointer select-none">Bypass Dev</label>
                  <input
                    id="dev-mode-toggle"
                    type="checkbox"
                    checked={devMode}
                    onChange={(e) => handleToggleDevMode(e.target.checked)}
                    className="accent-rose-500 size-3.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
            {/* XP Balance Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 font-display text-sm font-bold text-blue-400 shadow-sm" title="Experiencia total">
              <Trophy className="size-4 shrink-0 text-blue-400" />
              <span>{totalXp.toLocaleString()} XP</span>
            </div>
            {/* Coins Balance Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3.5 py-1.5 font-display text-sm font-bold text-gold-foreground shadow-sm" title="Sombreritos">
              <img src={streakCap} alt="" className="size-4 shrink-0 select-none" />
              <span>{coins}</span>
            </div>
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
               tab === "avatar" ? t("avatar", { defaultValue: "Avatar" }) :
               t(`games.${tab}`, { defaultValue: tab })}
            </button>
          ))}
        </div>

        {/* Play Tab */}
        {activeTab === "play" && (
          <div className="mt-6 space-y-8 animate-in fade-in duration-300">
            {/* Juegos Premium Educativos Section */}
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-slate-900/10 to-indigo-950/20 p-6 shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)] relative overflow-hidden group">
              {/* Glow effects */}
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-500/10 blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/25">
                      ✨ Premium & Competitivo
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/25 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                      Próximamente
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                    Juegos Premium Educativos
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    Nuevos desafíos diseñados para el desarrollo académico avanzado y la competencia intercolegial de alto rendimiento.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                    <Sparkles className="size-3.5 text-purple-400 animate-pulse" />
                    <span>Ligas Ranked</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                    <Trophy className="size-3.5 text-indigo-400" />
                    <span>Olimpiadas</span>
                  </div>
                </div>
              </div>

              {/* Holographic Cards Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* QUIZ CLASH PLAYABLE CARD */}
                {(() => {
                  const isUnlocked = (isDeveloper && devMode) || unlockedGames.includes("quiz-clash");
                  return (
                    <div className="relative rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-[#0A0E23] p-5 shadow-[0_0_25px_-3px_rgba(168,85,247,0.25)] flex flex-col justify-between overflow-hidden group/card hover:border-purple-400 hover:shadow-[0_0_35px_-3px_rgba(168,85,247,0.45)] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-purple-500/0 opacity-50 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm shadow-purple-500/25 animate-pulse">
                            ⚔️ Competitivo 1v1
                          </span>
                          {isUnlocked && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-bold text-slate-100 flex items-center gap-1.5">
                          Quiz Clash
                        </h3>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          Enfréntate 1v1 a otros estudiantes en duelos de preguntas en tiempo real. ¡Domina tu especialidad y sube hasta Maestro!
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold">
                          <span className={`${isUnlocked ? 'text-emerald-400' : 'text-purple-400'} flex items-center gap-1`}>
                            {isUnlocked ? (
                              <Sparkles className="size-3.5" />
                            ) : (
                              <Trophy className="size-3.5 text-purple-400" />
                            )}
                            <span>{isUnlocked ? "Acceso Libre" : "1,200 XP"}</span>
                          </span>
                          <span className="text-success flex items-center gap-1">
                            <img src={streakCap} alt="" className="size-3.5 select-none" />
                            <span>Gana sombreritos</span>
                          </span>
                        </div>
                      </div>
                      
                      {isUnlocked ? (
                        <button
                          onClick={() => navigate({ to: "/games/quiz-clash" })}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 font-bold text-xs tracking-wider text-white transition active:scale-95 cursor-pointer border-none shadow-md shadow-purple-500/20"
                        >
                          <Gamepad2 className="size-4" /> Empezar Arena
                        </button>
                      ) : (
                        <button
                          disabled={unlockMutation.isPending || totalXp < 1200}
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que deseas desbloquear Quiz Clash por 1,200 XP?`)) {
                              unlockMutation.mutate("quiz-clash");
                            }
                          }}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 font-bold text-xs tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock className="size-4 text-purple-400" /> Desbloquear por 1,200 XP
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* MUNDO CONSTRUCTOR PLAYABLE CARD */}
                {(() => {
                  const isUnlocked = (isDeveloper && devMode) || unlockedGames.includes("mundo-constructor");
                  return (
                    <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-[#0A0E23] p-5 shadow-[0_0_25px_-3px_rgba(16,185,129,0.2)] flex flex-col justify-between overflow-hidden group/card hover:border-emerald-400 hover:shadow-[0_0_35px_-3px_rgba(16,185,129,0.4)] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-emerald-500/0 opacity-50 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="inline-block rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm shadow-emerald-500/20">
                            🏗️ Sandbox Educativo
                          </span>
                          {isUnlocked && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-bold text-slate-100 flex items-center gap-1.5">
                          Mundo Constructor
                        </h3>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          Edifica tu propio imperio del saber en una cuadrícula interactiva. Gana bloques y materiales respondiendo preguntas de materias reales.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold">
                          <span className={`${isUnlocked ? 'text-emerald-400' : 'text-emerald-500/80'} flex items-center gap-1`}>
                            {isUnlocked ? (
                              <Sparkles className="size-3.5" />
                            ) : (
                              <Trophy className="size-3.5 text-emerald-400" />
                            )}
                            <span>{isUnlocked ? "Acceso Libre" : "1,500 XP"}</span>
                          </span>
                          <span className="text-success flex items-center gap-1">
                            <img src={streakCap} alt="" className="size-3.5 select-none" />
                            <span>Gana sombreritos</span>
                          </span>
                        </div>
                      </div>
                      
                      {isUnlocked ? (
                        <button
                          onClick={() => navigate({ to: "/games/mundo-constructor" })}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 font-bold text-xs tracking-wider text-white transition active:scale-95 cursor-pointer border-none shadow-md shadow-emerald-500/20"
                        >
                          <Gamepad2 className="size-4" /> Empezar Mundo
                        </button>
                      ) : (
                        <button
                          disabled={unlockMutation.isPending || totalXp < 1500}
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que deseas desbloquear Mundo Constructor por 1,500 XP?`)) {
                              unlockMutation.mutate("mundo-constructor");
                            }
                          }}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold text-xs tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock className="size-4 text-emerald-400" /> Desbloquear por 1,500 XP
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* CIUDAD DEL CONOCIMIENTO CARD */}
                {(() => {
                  const isUnlocked = (isDeveloper && devMode) || unlockedGames.includes("ciudad-conocimiento");
                  return (
                    <div className="relative rounded-2xl border-2 border-sky-500/40 bg-gradient-to-b from-sky-950/30 to-[#0A0E23] p-5 shadow-[0_0_25px_-3px_rgba(14,165,233,0.2)] flex flex-col justify-between overflow-hidden group/card hover:border-sky-400 hover:shadow-[0_0_35px_-3px_rgba(14,165,233,0.4)] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 to-sky-500/0 opacity-50 pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="inline-block rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm shadow-sky-500/20">
                            🏗️ Tycoon / Gestión
                          </span>
                          {isUnlocked && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-bold text-slate-100 flex items-center gap-1.5">
                          Ciudad del Conocimiento
                        </h3>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          Construye y administra tu propia urbe académica desde cero. Contrata profesores, crea carreras universitarias, realiza investigaciones y equilibra tus métricas.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold">
                          <span className={`${isUnlocked ? 'text-sky-400' : 'text-sky-500/80'} flex items-center gap-1`}>
                            {isUnlocked ? (
                              <Sparkles className="size-3.5" />
                            ) : (
                              <Trophy className="size-3.5 text-sky-400" />
                            )}
                            <span>{isUnlocked ? "Acceso Libre" : "1,600 XP"}</span>
                          </span>
                          <span className="text-success flex items-center gap-1">
                            <img src={streakCap} alt="" className="size-3.5 select-none" />
                            <span>Gana sombreritos</span>
                          </span>
                        </div>
                      </div>
                      
                      {isUnlocked ? (
                        <button
                          onClick={() => navigate({ to: "/games/ciudad-conocimiento" })}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 font-bold text-xs tracking-wider text-white transition active:scale-95 cursor-pointer border-none shadow-md shadow-sky-500/20"
                        >
                          <Gamepad2 className="size-4" /> Administrar Ciudad
                        </button>
                      ) : (
                        <button
                          disabled={unlockMutation.isPending || totalXp < 1600}
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que deseas desbloquear Ciudad del Conocimiento por 1,600 XP?`)) {
                              unlockMutation.mutate("ciudad-conocimiento");
                            }
                          }}
                          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 font-bold text-xs tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock className="size-4 text-sky-400" /> Desbloquear por 1,600 XP
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Coming Soon Cards */}
                {[
                  {
                    title: "Olimpiada de Lógica Global",
                    desc: "Competición intercolegial con problemas matemáticos complejos y razonamiento lógico-espacial en tiempo real.",
                    badge: "Competitivo Ranked",
                    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                  },
                  {
                    title: "Simulador Aeroespacial",
                    desc: "Física de partículas y simulación de trayectorias orbitales. Aplica álgebra y trigonometría para guiar misiones espaciales.",
                    badge: "Física Avanzada",
                    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                  },
                  {
                    title: "Laboratorio Clínico Virtual",
                    desc: "Diagnósticos médicos basados en estudios de casos de microbiología, bioquímica y genética aplicada.",
                    badge: "Ciencias de la Salud",
                    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                  }
                ].map((pGame, i) => (
                  <div key={i} className="relative rounded-2xl border border-purple-500/15 bg-slate-950/40 p-4 flex flex-col justify-between overflow-hidden group/card hover:border-purple-500/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${pGame.badgeColor}`}>
                        {pGame.badge}
                      </span>
                      <h4 className="mt-2 font-display text-sm font-bold text-slate-200">{pGame.title}</h4>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {pGame.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-purple-500/10 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-purple-400/80 flex items-center gap-1">
                        <Lock className="size-3 text-purple-400" />
                        <span>Zona Cerrada</span>
                      </span>
                      <span className="text-slate-500 uppercase tracking-wider">Próxima Temporada</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator & Regular Title */}
            <div className="pt-2">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <span>🎮</span> Juegos Regulares
              </h2>
              <p className="text-xs text-muted-foreground">Colección estándar de actividades didácticas.</p>
            </div>

            {/* Normal Games Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  id: "wordle",
                  title: "Wordle de carreras",
                  style: "Léxico / Vocabulario",
                  desc: "Adivina palabras relacionadas con carreras universitarias y áreas de estudio en 6 intentos. Incluye retroalimentación por color y tarjeta de carrera.",
                  cost: 100,
                  path: "/games/wordle",
                  styleColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                }
              ].map((game) => {
                const isUnlocked = (isDeveloper && devMode) || unlockedGames.includes(game.id);
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
                        <span className={`${isUnlocked ? 'text-emerald-500' : 'text-blue-400'} flex items-center gap-1`}>
                          {isUnlocked ? (
                            <Sparkles className="size-3.5" />
                          ) : (
                            <Trophy className="size-3.5 text-blue-400" />
                          )}
                          <span>{isUnlocked ? "Acceso Libre" : `${game.cost} XP`}</span>
                        </span>
                        <span className="text-success flex items-center gap-1">
                          <img src={streakCap} alt="" className="size-3.5 select-none" />
                          <span>Gana sombreritos</span>
                        </span>
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
          </div>
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
                  Aquí se guardan tus <strong>Blooks</strong> (insignias coleccionables). Puedes hacer clic sobre cualquiera que hayas desbloqueado para equiparlo como insignia activa junto a tu nombre de perfil.
                </p>
                <p className="mt-2 text-[11px] text-[#3B6DE8] font-bold flex items-center gap-1">
                  <span>💡</span>
                  <span>Puedes conseguirlos comprando paquetes en la pestaña de Juegos, o adquirirlos directamente aquí haciendo clic sobre cualquier Blook bloqueado.</span>
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
                        disabled={equipMutation.isPending || buyBlookMutation.isPending}
                        onClick={() => {
                          if (isUnlocked) {
                            equipMutation.mutate(b.id);
                          } else {
                            setSelectedBlookToBuy(b);
                          }
                        }}
                        className={`flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-card transition active:scale-95 cursor-pointer border ${borderCls} ${
                          !isUnlocked ? "hover:bg-muted/10 opacity-75" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className={`text-3xl select-none transition ${!isUnlocked ? "grayscale opacity-50" : ""}`}>
                          {b.emoji}
                        </div>
                        <span className="truncate w-full text-[9px] font-bold text-center leading-tight">
                          {t(`games.blookName.${b.id}`, { defaultValue: b.name })}
                        </span>
                        {isUnlocked ? (
                          <span className={`text-[7px] px-1 rounded-full font-bold uppercase ${
                            b.rarity === "legendary" ? "bg-amber-400/20 text-amber-600" :
                            b.rarity === "epic" ? "bg-purple-500/20 text-purple-600" :
                            b.rarity === "rare" ? "bg-emerald-400/20 text-emerald-600" :
                            "bg-blue-400/20 text-blue-600"
                          }`}>
                            {t(`games.rarity.${b.rarity}`, { defaultValue: b.rarity })}
                          </span>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-gold/15 text-gold-foreground flex items-center gap-0.5 mt-0.5 border border-gold/20 leading-none">
                            <Lock className="size-1.5 shrink-0" />
                            <span>{BLOOK_COSTS[b.rarity]}</span>
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

      {activeTab === "avatar" && (
        <section className="mt-5 animate-in fade-in duration-300">
          <AvatarCustomizer />
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

      {/* Direct Blook Purchase Confirmation Modal */}
      {selectedBlookToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-elegant space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto text-4xl select-none">
              {selectedBlookToBuy.emoji}
            </div>
            <h3 className="text-center font-display text-lg font-black text-foreground">
              Comprar {t(`games.blookName.${selectedBlookToBuy.id}`, { defaultValue: selectedBlookToBuy.name })}
            </h3>
            <p className="text-center text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              ¿Estás seguro de que deseas desbloquear este Blook por{" "}
              <span className="font-bold text-primary">{BLOOK_COSTS[selectedBlookToBuy.rarity]} Sombreritos</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedBlookToBuy(null)}
                className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition active:scale-95 cursor-pointer"
              >
                {t("common.back", { defaultValue: "Volver" })}
              </button>
              <button
                disabled={buyBlookMutation.isPending}
                onClick={async () => {
                  await buyBlookMutation.mutateAsync(selectedBlookToBuy.id);
                  setSelectedBlookToBuy(null);
                }}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition active:scale-[0.95] disabled:opacity-60 cursor-pointer"
              >
                {buyBlookMutation.isPending ? "..." : t("common.continue", { defaultValue: "Confirmar" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Testing Panel Modal */}
      {showDevPanel && isDeveloper && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-card border-l border-border p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-display font-black text-lg text-rose-500 flex items-center gap-2">
                  <Settings className="size-5" /> Panel de Pruebas Developer
                </h3>
                <button
                  onClick={() => setShowDevPanel(false)}
                  className="text-muted-foreground hover:text-foreground font-black text-sm cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>

              {/* Dev Mode switch */}
              <div className="mt-5 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-rose-400">Developer Mode (Bypass Locks)</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Accede temporalmente a todos los juegos sin pagar su costo.</p>
                </div>
                <input
                  type="checkbox"
                  checked={devMode}
                  onChange={(e) => handleToggleDevMode(e.target.checked)}
                  className="accent-rose-500 size-5 cursor-pointer"
                />
              </div>

              {/* Gestión de Contenidos */}
              <div className="mt-5 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-2">
                <div>
                  <h4 className="font-bold text-xs text-indigo-400">Gestión de Contenidos (Libros)</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Administra los libros y capítulos de la plataforma.</p>
                </div>
                <Link
                  to="/admin-books"
                  onClick={() => setShowDevPanel(false)}
                  className="mt-1 flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm text-center"
                >
                  <BookOpen className="size-4" />
                  Ir al Administrador de Libros
                </Link>
              </div>

              {/* Resource Editor */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Ajuste de Recursos (BD)</h4>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">Añadir XP</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDevAddXp(1000)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      +1,000 XP
                    </button>
                    <button
                      onClick={() => handleDevAddXp(10000)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      +10,000 XP
                    </button>
                    <button
                      onClick={() => handleDevAddXp(-2000)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      -2,000 XP
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">Añadir Sombreritos</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDevAddCoins(5)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      +5 Caps
                    </button>
                    <button
                      onClick={() => handleDevAddCoins(50)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      +50 Caps
                    </button>
                    <button
                      onClick={() => handleDevAddCoins(-10)}
                      className="flex-1 py-2 bg-[#17224D] border border-[#3B6DE8]/20 hover:border-primary text-[10px] font-bold rounded-lg cursor-pointer transition active:scale-95 text-white"
                    >
                      -10 Caps
                    </button>
                  </div>
                </div>
              </div>

              {/* Levels & Simulator triggers */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Simulación de Sistemas</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDevSetLvl(1)}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Nivel 1 (0 XP)
                  </button>
                  <button
                    onClick={() => handleDevSetLvl(10)}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Nivel 10 (2.7k XP)
                  </button>
                  <button
                    onClick={handleSimulateReward}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Recompensa Diaria
                  </button>
                  <button
                    onClick={handleSimulateMission}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Misión Completada
                  </button>
                  <button
                    onClick={handleSimulateEvent}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Evento Especial
                  </button>
                  <button
                    onClick={handleSimulateSeason}
                    className="py-2 px-3 border border-border text-[10px] font-bold rounded-lg hover:bg-muted transition text-left cursor-pointer"
                  >
                    Simular Pase Temporada (Lvl {simulatedSeasonLevel})
                  </button>
                </div>
              </div>

              {/* Game unlock checkboxes */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Desbloqueo de Juegos en BD</h4>
                <div className="max-h-[160px] overflow-y-auto border border-border rounded-xl p-3 space-y-2 text-xs scrollbar-thin">
                  {[
                    { id: "wordle", name: "Wordle de carreras" },
                    { id: "complete-concept", name: "Completa el concepto" },
                    { id: "hangman", name: "Ahorcado universitario" },
                    { id: "order-idea", name: "Ordena la idea" },
                    { id: "connect-area", name: "Conecta tu área" },
                    { id: "dictation", name: "Dictado académico" },
                    { id: "gold-quest", name: "Gold Quest" },
                    { id: "space-rush", name: "Space Rush" },
                    { id: "criaturas-conocimiento", name: "Criaturas del Conocimiento" },
                    { id: "rpg-academico", name: "RPG Académico" },
                    { id: "centro-investigacion", name: "Centro de Investigación" },
                    { id: "torre-infinita", name: "Torre Infinita del Saber" },
                    { id: "escape-room", name: "Escape Room Educativo" },
                    { id: "runner-conocimiento", name: "Runner del Conocimiento" },
                    { id: "battle-royale", name: "Battle Royale Académico" },
                    { id: "laboratorio-inventores", name: "Laboratorio de Inventores" },
                    { id: "ciudad-conocimiento", name: "Ciudad del Conocimiento" },
                    { id: "ligas-campeones", name: "Ligas de Campeones" },
                    { id: "simulador-examenes", name: "Simulador de Exámenes" },
                    { id: "quiz-clash", name: "Quiz Clash (Premium)" },
                    { id: "mundo-constructor", name: "Mundo Constructor (Premium)" },
                  ].map(game => {
                    const isRealUnlocked = unlockedGames.includes(game.id);
                    return (
                      <div key={game.id} className="flex justify-between items-center">
                        <span className="truncate max-w-[200px]">{game.name}</span>
                        <input
                          type="checkbox"
                          checked={isRealUnlocked}
                          onChange={(e) => handleDevToggleGame(game.id, e.target.checked)}
                          className="accent-primary cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Danger Zone Reset */}
            <div className="border-t border-border pt-4 mt-6">
              <button
                onClick={handleDevReset}
                className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive hover:bg-destructive-glow text-white font-bold text-xs transition active:scale-95 cursor-pointer border-none"
              >
                <RefreshCw className="size-4 animate-spin-slow" />
                <span>Reiniciar Progreso de Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
