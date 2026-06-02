import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getDashboard } from "@/lib/quiz.functions";
import { listUnlockedBlooks, buyBlookPack, equipBlook, BLOOKS, PACK_COSTS, convertXpToCoins, unlockGame, type PackType, type Blook } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { Gamepad2, Lock, ShoppingBag, Sparkles, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

const GamesSearchSchema = z.object({
  tab: z.enum(["play", "locker", "shop", "bank"]).optional(),
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
  const purchasePack = useServerFn(buyBlookPack);
  const equipAvatar = useServerFn(equipBlook);
  const convertXp = useServerFn(convertXpToCoins);
  const unlock = useServerFn(unlockGame);

  const { data: dash, isLoading: dashLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const { data: locker, isLoading: lockerLoading } = useQuery({ queryKey: ["unlockedBlooks"], queryFn: () => listBlooks() });

  const [activeTab, setActiveTab] = useState<"play" | "locker" | "shop" | "bank">(tab ?? "play");
  const [revealedBlook, setRevealedBlook] = useState<Blook | null>(null);
  const [openingPack, setOpeningPack] = useState(false);
  const [amountToConvert, setAmountToConvert] = useState(1);
  const [showConfirmBankModal, setShowConfirmBankModal] = useState(false);
  const [selectedShopPack, setSelectedShopPack] = useState<PackType | null>(null);

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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "from-amber-400 to-yellow-600 border-amber-400 shadow-amber-400/30 text-amber-955";
      case "epic": return "from-purple-500 to-indigo-700 border-purple-500 shadow-purple-500/30 text-purple-955";
      case "rare": return "from-emerald-400 to-teal-600 border-emerald-400 shadow-emerald-400/30 text-emerald-955";
      default: return "from-blue-400 to-cyan-500 border-blue-400 shadow-blue-400/30 text-blue-955";
    }
  };

  const getRarityLabel = (rarity: string) => {
    return t(`games.shopSection.rarity.${rarity}`, { defaultValue: rarity });
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-24">
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
          {(["play", "locker", "shop", "bank"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-sm font-semibold capitalize transition px-3 ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "bank" ? t("games.convertXp", { defaultValue: "Convertir XP" }) : t(`games.${tab}`, { defaultValue: tab })}
            </button>
          ))}
        </div>

        {/* Play Tab */}
        {activeTab === "play" && (
          <section className="mt-5 space-y-4">
            <div className="relative rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between overflow-hidden">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {t("games.goldQuest.style", { defaultValue: "Blooket Style" })}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">{t("games.goldQuest.title", { defaultValue: "Gold Quest" })}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("games.goldQuest.desc", { defaultValue: "Answer fast-paced trivia questions correctly to open mystery chests. Steal or double your gold against AI players!" })}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-gold-foreground flex items-center gap-1">
                    <img src={streakCap} alt="" className="size-3.5 select-none" />
                    {isGoldQuestUnlocked ? t("games.goldQuest.free", { defaultValue: "Free Entry" }) : "500 XP"}
                  </span>
                  <span className="text-success">🏆 {t("games.goldQuest.bonus", { defaultValue: "Win bonus coins" })}</span>
                </div>
              </div>
              
              {isGoldQuestUnlocked ? (
                <button
                  onClick={() => navigate({ to: "/games/gold-quest" })}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition active:scale-95 cursor-pointer"
                >
                  <Gamepad2 className="size-4" /> {t("games.goldQuest.start", { defaultValue: "Start Quest" })}
                </button>
              ) : (
                <button
                  disabled={unlockMutation.isPending || totalXp < 500}
                  onClick={() => {
                    if (confirm(t("games.confirmUnlockGoldQuest", { defaultValue: "¿Estás seguro de que deseas desbloquear Gold Quest por 500 XP?" }))) {
                      unlockMutation.mutate("gold-quest");
                    }
                  }}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-muted border border-border text-muted-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/40 font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="size-4 text-muted-foreground" /> {t("games.unlockForXp", { xp: 500, defaultValue: "Unlock for 500 XP" })}
                </button>
              )}
            </div>

            <div className="relative rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between overflow-hidden">
              <div>
                <span className="inline-block rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
                  {t("games.spaceRush.style", { defaultValue: "Quizizz Style" })}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold">{t("games.spaceRush.title", { defaultValue: "Space Rush" })}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("games.spaceRush.desc", { defaultValue: "Blast off into orbit! Answer questions correctly to accelerate your rocket ship and beat simulated competitors." })}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-gold-foreground flex items-center gap-1">
                    <img src={streakCap} alt="" className="size-3.5 select-none" />
                    {isSpaceRushUnlocked ? t("games.spaceRush.free", { defaultValue: "Free Entry" }) : "1000 XP"}
                  </span>
                  <span className="text-success">🏆 {t("games.spaceRush.bonus", { defaultValue: "Earn speed boosts" })}</span>
                </div>
              </div>

              {isSpaceRushUnlocked ? (
                <button
                  onClick={() => navigate({ to: "/games/space-rush" })}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-success font-semibold text-success-foreground transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="size-4" /> {t("games.spaceRush.start", { defaultValue: "Blast Off" })}
                </button>
              ) : (
                <button
                  disabled={unlockMutation.isPending || totalXp < 1000}
                  onClick={() => {
                    if (confirm(t("games.confirmUnlockSpaceRush", { defaultValue: "¿Estás seguro de que deseas desbloquear Space Rush por 1000 XP?" }))) {
                      unlockMutation.mutate("space-rush");
                    }
                  }}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-muted border border-border text-muted-foreground hover:bg-success/15 hover:text-success hover:border-success/40 font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="size-4 text-muted-foreground" /> {t("games.unlockForXp", { xp: 1000, defaultValue: "Unlock for 1000 XP" })}
                </button>
              )}
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
            {(["medieval", "space", "academic", "cyber", "exclusive"] as const).map((pack) => {
              const cost = PACK_COSTS[pack];
              const isAffordable = coins >= cost;

              return (
                <div
                  key={pack}
                  onClick={() => setSelectedShopPack(pack)}
                  className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer hover:border-primary/55 transition active:scale-[0.99] select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <ShoppingBag className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold capitalize leading-none">
                        {t("games.packTitle", { name: t(`games.shopSection.packName.${pack}`, { defaultValue: pack }), defaultValue: `${pack} Pack` })}
                      </h3>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {pack === "medieval" ? t("games.packMedievalDesc", "🛡️ Common to Legendary Blooks") :
                         pack === "space" ? t("games.packSpaceDesc", "🌌 Rare & Epic Boosted") :
                         pack === "academic" ? t("games.packAcademicDesc", "🎓 Academics & Graduation Badges") :
                         pack === "cyber" ? t("games.packCyberDesc", "⚡ Top-tier Cyber Badges") :
                         t("games.packExclusiveDesc", "👑 Exclusive avatars, clothing, accessories & pets")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShopPack(pack);
                    }}
                    className="shrink-0 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gold px-4 font-semibold text-gold-foreground transition active:scale-95 cursor-pointer"
                  >
                    <img src={streakCap} alt="" className="size-4 shrink-0 select-none" />
                    <span>{cost}</span>
                  </button>
                </div>
              );
            })}

            {/* Premium Coins Bundles Shop (Monetization Prep) */}
            <div className="mt-8 pt-6 border-t border-border space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="size-5 text-primary animate-pulse" />
                  <span>{t("games.mockStoreTitle", { defaultValue: "Cap Shop" })}</span>
                </h3>
                <p className="text-xs text-muted-foreground">{t("games.mockStoreSubtitle", { defaultValue: "Purchase Graduation Caps directly (Coming Soon)" })}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { count: 5, price: "$0.99", discount: null },
                  { count: 15, price: "$2.49", discount: "10% OFF" },
                  { count: 40, price: "$4.99", discount: "20% OFF" },
                ].map((bundle, index) => (
                  <button
                    key={index}
                    onClick={() => toast.info(t("games.comingSoon", { defaultValue: "Coming Soon" }) + ": " + t("games.mockStoreSubtitle", { defaultValue: "Purchases will be enabled in the next update!" }))}
                    className="relative rounded-2xl border border-border bg-card p-3 flex flex-col items-center justify-between text-center shadow-card hover:bg-muted/30 transition active:scale-95 cursor-pointer overflow-hidden"
                  >
                    {bundle.discount && (
                      <span className="absolute top-1 right-1 bg-success/20 text-success text-[7px] font-bold px-1 rounded uppercase tracking-wider">
                        {bundle.discount}
                      </span>
                    )}
                    <div className="text-2xl mt-2 select-none">🎓</div>
                    <span className="text-xs font-bold leading-tight mt-1">{t("games.mockStoreBundle", { count: bundle.count, defaultValue: `${bundle.count} Caps` })}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">{bundle.price}</span>
                    <span className="mt-2 w-full py-1 text-[9px] font-bold text-center bg-primary/10 text-primary rounded-lg">
                      {t("games.mockStoreBuy", { price: bundle.price, defaultValue: `Buy for ${bundle.price}` })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
                  {t("games.shopSection.unlockedText", { name: t(`games.blookName.${revealedBlook.id}`, { defaultValue: revealedBlook.name }), defaultValue: `You Unlocked: ${revealedBlook.name}!` })}
                </h2>
                <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  {revealedBlook.rarity === "legendary"
                    ? t("games.shopSection.ultraRare", { defaultValue: "👑 ULTRA RARE BADGE!" })
                    : t("games.shopSection.addedCollection", { defaultValue: "⭐ Added to your collection!" })}
                </p>
                <button
                  onClick={() => setOpeningPack(false)}
                  className="mt-8 px-6 h-11 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {t("games.shopSection.awesomeButton", { defaultValue: "Awesome!" })}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="size-48 rounded-3xl border-4 border-dashed border-primary bg-primary/5 flex items-center justify-center shadow-card animate-spin duration-[4s]">
                  <ShoppingBag className="size-16 text-primary animate-pulse" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">
                  {t("games.shopSection.unlocking", { defaultValue: "Opening Blook Pack..." })}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground animate-pulse">
                  {t("games.shopSection.goodLuck", { defaultValue: "Good luck!" })}
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* Blook Pack Details & Preview Modal */}
      {selectedShopPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-display font-black text-lg text-white capitalize">
                {t("games.packTitle", { name: t(`games.shopSection.packName.${selectedShopPack}`, { defaultValue: selectedShopPack }), defaultValue: `${selectedShopPack} Pack` })}
              </h3>
              <button
                onClick={() => setSelectedShopPack(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold bg-slate-950 border border-slate-800 rounded-xl size-8 flex items-center justify-center cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-2xl border border-slate-850 mb-4">
              {selectedShopPack === "medieval" && "🛡️ Explora los misterios del reino medieval. ¡Desde valientes caballeros comunes hasta reyes legendarios protectores del castillo!"}
              {selectedShopPack === "space" && "🌌 Viaja a los confines del espacio exterior. ¡Contiene astronautas, misteriosos alienígenas, cohetes veloces y ovnis legendarios!"}
              {selectedShopPack === "cyber" && "🤖 Adéntrate en el futuro cibernético. ¡Colecciona robots autónomos, hackers astutos, cíborgs equipados y super inteligencias artificiales!"}
              {selectedShopPack === "academic" && "🎓 El paquete académico definitivo. ¡Contiene lápices, cuadernos, libros, plumas de escribir, mochilas, microscopios, diplomas y el Birrete Legendario!"}
              {selectedShopPack === "exclusive" && "👑 Personaliza tu avatar al máximo nivel. ¡Consigue peinados raros, togas doradas épicas, zapatillas ciber, gafas VR arcanas y al increíble fénix de fuego legendario!"}
            </p>

            {/* Blooks list preview */}
            <div className="space-y-2 mb-5">
              <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Blooks que puedes obtener:
              </h4>
              <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {Object.values(BLOOKS)
                  .filter((b) => b.pack === selectedShopPack)
                  .map((blook) => {
                    let rarityLabel = "Común";
                    let rarityColor = "bg-slate-900 border-slate-800 text-slate-400";
                    let dropChance = "50%";
                    
                    if (blook.rarity === "legendary") {
                      rarityLabel = "Leyenda";
                      rarityColor = "bg-amber-500/10 border-amber-500/20 text-amber-400 font-black animate-pulse";
                      dropChance = "5%";
                    } else if (blook.rarity === "epic") {
                      rarityLabel = "Épico";
                      rarityColor = "bg-purple-500/10 border-purple-500/20 text-purple-400 font-extrabold";
                      dropChance = "15%";
                    } else if (blook.rarity === "rare") {
                      rarityLabel = "Raro";
                      rarityColor = "bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold";
                      dropChance = "30%";
                    }

                    return (
                      <div
                        key={blook.id}
                        className="rounded-xl border border-slate-850 bg-slate-950/70 p-2 flex items-center gap-2"
                      >
                        <span className="text-2xl select-none shrink-0">{blook.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate leading-tight">
                            {t(`games.blookName.${blook.id}`, { defaultValue: blook.name })}
                          </p>
                          <div className="flex gap-1 items-center mt-0.5">
                            <span className={`text-[7px] uppercase tracking-wider px-1 rounded border leading-none ${rarityColor}`}>
                              {rarityLabel}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500">
                              {dropChance}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Purchase Checkout section */}
            <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Costo del paquete:</span>
                <div className="flex items-center gap-1 text-blue-400 font-black font-mono">
                  <span>🎓</span>
                  <span>{PACK_COSTS[selectedShopPack]} Sombreritos</span>
                </div>
              </div>

              {/* Balance indicators & deficits */}
              {coins >= PACK_COSTS[selectedShopPack] ? (
                <div className="w-full bg-blue-950/30 border border-blue-500/20 text-blue-400 rounded-xl p-3 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="size-4 text-blue-400" /> ¡Tienes saldo suficiente! Tu saldo actual: {coins} Sombreritos.
                </div>
              ) : (
                <div className="w-full bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-medium flex gap-2 items-start text-left shadow-sm">
                  <AlertTriangle className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-300">Sombreritos insuficientes</p>
                    <p className="text-[10px] text-red-400/90 mt-0.5 leading-snug">
                      Te faltan {PACK_COSTS[selectedShopPack] - coins} Sombreritos para comprar este paquete.
                    </p>
                    <p className="text-[9px] text-red-500/70 mt-1">
                      Puedes convertir tu XP acumulada en la pestaña **Convertir XP** de este mismo panel de Juegos.
                    </p>
                  </div>
                </div>
              )}

              {/* Purchase confirmation button */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setSelectedShopPack(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  disabled={coins < PACK_COSTS[selectedShopPack] || buyMutation.isPending}
                  onClick={() => {
                    const pack = selectedShopPack;
                    setSelectedShopPack(null); // close preview
                    buyMutation.mutate(pack); // buy
                  }}
                  className={`flex-1 py-2.5 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1 ${
                    coins >= PACK_COSTS[selectedShopPack]
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-blue-500/10 cursor-pointer"
                      : "bg-slate-800 text-slate-500 border border-slate-850 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {buyMutation.isPending ? (
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>🎓</span>
                      Comprar Paquete
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
