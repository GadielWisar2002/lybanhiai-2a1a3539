import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getDashboard } from "@/lib/quiz.functions";
import { listUnlockedBlooks, buyBlookPack, equipBlook, BLOOKS, PACK_COSTS, type PackType, type Blook } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { Gamepad2, Lock, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Games — Lybanhi" }] }),
  component: GamesHub,
});

function GamesHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getDash = useServerFn(getDashboard);
  const listBlooks = useServerFn(listUnlockedBlooks);
  const purchasePack = useServerFn(buyBlookPack);
  const equipAvatar = useServerFn(equipBlook);

  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const { data: locker, isLoading: lockerLoading } = useQuery({ queryKey: ["unlockedBlooks"], queryFn: () => listBlooks() });

  const [activeTab, setActiveTab] = useState<"play" | "locker" | "shop">("play");
  const [revealedBlook, setRevealedBlook] = useState<Blook | null>(null);
  const [openingPack, setOpeningPack] = useState(false);

  const coins = dash?.streak.coins ?? 0;

  const buyMutation = useMutation({
    mutationFn: (pack: PackType) => purchasePack({ data: { pack } }),
    onMutate: () => {
      setOpeningPack(true);
      setRevealedBlook(null);
    },
    onSuccess: (res) => {
      setRevealedBlook(res.blook);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["unlockedBlooks"] });
    },
    onError: (e) => {
      setOpeningPack(false);
      toast.error(e instanceof Error ? e.message : "Error opening pack");
    },
  });

  const equipMutation = useMutation({
    mutationFn: (blookId: string | null) => equipAvatar({ data: { blookId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unlockedBlooks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Avatar equipped!");
    },
    onError: () => toast.error("Failed to equip blook"),
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "from-amber-400 to-yellow-600 border-amber-400 shadow-amber-400/30 text-amber-950";
      case "epic": return "from-purple-500 to-indigo-700 border-purple-500 shadow-purple-500/30 text-purple-955";
      case "rare": return "from-emerald-400 to-teal-600 border-emerald-400 shadow-emerald-400/30 text-emerald-955";
      default: return "from-blue-400 to-cyan-500 border-blue-400 shadow-blue-400/30 text-blue-955";
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "Legendary";
      case "epic": return "Epic";
      case "rare": return "Rare";
      default: return "Common";
    }
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-24">
        {/* Hub Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("nav.games", { defaultValue: "Games" })}</h1>
            <p className="text-xs text-muted-foreground">Spend coins to play & collect avatars!</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3 py-1.5 font-display text-sm font-bold text-gold-foreground shadow-sm">
            🪙 <span>{coins}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 flex gap-2 border-b border-border pb-px">
          {(["play", "locker", "shop"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "play" ? "Play" : tab === "locker" ? "Locker" : "Shop"}
            </button>
          ))}
        </div>

        {/* Play Tab */}
        {activeTab === "play" && (
          <section className="mt-5 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-elegant flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Blooket Style
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">Gold Quest</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Answer fast-paced trivia questions correctly to open mystery chests. Steal or double your gold against AI players!
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-gold-foreground">🪙 Free Entry</span>
                  <span className="text-success">🏆 Win bonus coins</span>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/games/gold-quest" })}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition active:scale-95"
              >
                <Gamepad2 className="size-4" /> Start Quest
              </button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-elegant flex flex-col justify-between opacity-95">
              <div>
                <span className="inline-block rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
                  Quizizz Style
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">Space Rush</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Blast off into orbit! Answer questions correctly to accelerate your rocket ship and beat simulated competitors.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-gold-foreground">🪙 Free Entry</span>
                  <span className="text-success">🏆 Earn speed boosts</span>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/games/space-rush" })}
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-success font-semibold text-success-foreground transition active:scale-95"
              >
                <Sparkles className="size-4" /> Blast Off
              </button>
            </div>
          </section>
        )}

        {/* Locker Tab */}
        {activeTab === "locker" && (
          <section className="mt-5">
            {lockerLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Collection: {locker?.unlockedIds.length || 0} / {Object.keys(BLOOKS).length}
                  </span>
                  {locker?.activeBlookId && (
                    <button
                      onClick={() => equipMutation.mutate(null)}
                      className="text-xs font-bold text-destructive hover:underline"
                    >
                      Unequip Active Blook
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
                        className={`flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-card transition active:scale-95 disabled:scale-100 ${borderCls} ${
                          !isUnlocked ? "opacity-40 grayscale" : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="text-3xl select-none">{isUnlocked ? b.emoji : "❓"}</div>
                        <span className="truncate w-full text-[9px] font-bold text-center leading-tight">
                          {isUnlocked ? b.name : "Locked"}
                        </span>
                        {isUnlocked && (
                          <span className={`text-[7px] px-1 rounded-full font-bold uppercase ${
                            b.rarity === "legendary" ? "bg-amber-400/20 text-amber-600" :
                            b.rarity === "epic" ? "bg-purple-500/20 text-purple-600" :
                            b.rarity === "rare" ? "bg-emerald-400/20 text-emerald-600" :
                            "bg-blue-400/20 text-blue-600"
                          }`}>
                            {getRarityLabel(b.rarity)}
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

        {/* Shop Tab */}
        {activeTab === "shop" && (
          <section className="mt-5 space-y-4">
            {(["medieval", "space", "cyber"] as const).map((pack) => {
              const cost = PACK_COSTS[pack];
              const isAffordable = coins >= cost;

              return (
                <div
                  key={pack}
                  className="rounded-3xl border border-border bg-card p-4 shadow-elegant flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <ShoppingBag className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold capitalize leading-none">{pack} Pack</h3>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {pack === "medieval" ? "🛡️ Common to Legendary Blooks" :
                         pack === "space" ? "🌌 Rare & Epic Boosted" :
                         "⚡ Top-tier Cyber Badges"}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={!isAffordable || buyMutation.isPending}
                    onClick={() => buyMutation.mutate(pack)}
                    className="shrink-0 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gold px-4 font-semibold text-gold-foreground transition active:scale-95 disabled:opacity-60 disabled:scale-100"
                  >
                    <span>🪙 {cost}</span>
                  </button>
                </div>
              );
            })}
          </section>
        )}
      </div>

      {/* Opening Blook Pack Card Flip Overlay Modal */}
      {openingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md px-6">
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            {revealedBlook ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                <div className={`size-48 rounded-3xl border-4 bg-gradient-to-br flex flex-col items-center justify-center shadow-elegant relative overflow-hidden ${getRarityColor(revealedBlook.rarity)}`}>
                  <div className="absolute inset-0 bg-white/10 opacity-30 animate-pulse pointer-events-none" />
                  <span className="text-7xl animate-bounce select-none">{revealedBlook.emoji}</span>
                  <span className="absolute bottom-4 text-xs font-bold tracking-widest uppercase opacity-80">
                    {getRarityLabel(revealedBlook.rarity)} Blook
                  </span>
                </div>
                <h2 className="mt-6 font-display text-2xl font-black text-foreground">
                  You Unlocked: {revealedBlook.name}!
                </h2>
                <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  {revealedBlook.rarity === "legendary" ? "👑 ULTRA RARE BADGE!" : "⭐ Added to your collection!"}
                </p>
                <button
                  onClick={() => setOpeningPack(false)}
                  className="mt-8 px-6 h-11 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-md transition active:scale-95"
                >
                  Awesome!
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="size-48 rounded-3xl border-4 border-dashed border-primary bg-primary/5 flex items-center justify-center shadow-card animate-spin duration-[4s]">
                  <ShoppingBag className="size-16 text-primary animate-pulse" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">Opening Blook Pack...</h3>
                <p className="mt-1 text-xs text-muted-foreground animate-pulse">Good luck!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
