import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Trophy,
  Sparkles,
  ArrowLeft,
  Crown,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Coins,
  Check,
  AlertTriangle,
  Lock,
  RotateCcw,
} from "lucide-react";

import { getDashboard } from "@/lib/quiz.functions";
import {
  AVATAR_ITEMS,
  AvatarItem,
  getPrestigeTitle,
  getPrestigeBadge,
  saveAvatarConfig,
  unlockAvatarItem,
} from "@/lib/avatar.functions";
import { RobloxAvatarRenderer } from "@/components/RobloxAvatarRenderer";

export const Route = createFileRoute("/_authenticated/profile/avatar")({
  component: AvatarCustomizerPage,
});

const PRESTIGE_LEVELS = [
  { xp: 0, title: "Aprendiz", badge: "🌱", color: "from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30" },
  { xp: 500, title: "Estudiante", badge: "📝", color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30" },
  { xp: 1500, title: "Alumno Destacado", badge: "⭐", color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30" },
  { xp: 3500, title: "Académico", badge: "📚", color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30" },
  { xp: 7000, title: "Erudito", badge: "📜", color: "from-indigo-500/20 to-cyan-500/20 text-indigo-400 border-indigo-500/30" },
  { xp: 15000, title: "Leyenda Académica", badge: "🦁", color: "from-red-500/20 to-orange-500/20 text-orange-400 border-red-500/30" },
  { xp: 30000, title: "Rector Supremo", badge: "👑", color: "from-yellow-400/20 to-amber-600/20 text-amber-300 border-amber-400/40 animate-pulse" },
];

function AvatarCustomizerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Load user dashboard query
  const getDash = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDash(),
  });

  const saveAvatar = useServerFn(saveAvatarConfig);
  const unlockItem = useServerFn(unlockAvatarItem);

  const profile = data?.profile;
  const streak = data?.streak;

  const totalXp = streak?.total_xp ?? 0;
  const sombreritos = streak?.coins ?? 0;
  const unlockedItems: string[] = (profile as any)?.unlocked_avatar_items ?? [];

  // Local state for active preview configuration
  const [previewConfig, setPreviewConfig] = useState({
    skinColor: "skin-light-2",
    hairStyle: "hair-short",
    hairColor: "color-black",
    hairHighlight: "hl-none",
    face: "face-happy",
    shirt: "shirt-basic-tee",
    pants: "pants-basic-jeans",
    shoes: "shoes-basic-shoes",
    accessory: "",
    pet: "",
    aura: "",
    outfit: "",
  });

  // Saved active equipped configuration in database
  const [savedConfig, setSavedConfig] = useState<any>(null);

  // Active tab in customizer
  const [activeTab, setActiveTab] = useState<"head" | "clothing" | "xp_shop" | "premium_shop" | "outfits">("head");

  // Modal checkout state
  const [checkoutItem, setCheckoutItem] = useState<AvatarItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Sync state when data loads
  useEffect(() => {
    if (profile?.avatar_config && Object.keys(profile.avatar_config).length > 0) {
      const config = profile.avatar_config as any;
      const loadedConfig = {
        skinColor: config.skinColor || "skin-light-2",
        hairStyle: config.hairStyle || "hair-short",
        hairColor: config.hairColor || "color-black",
        hairHighlight: config.hairHighlight || "hl-none",
        face: config.face || "face-happy",
        shirt: config.shirt || "shirt-basic-tee",
        pants: config.pants || "pants-basic-jeans",
        shoes: config.shoes || "shoes-basic-shoes",
        accessory: config.accessory || "",
        pet: config.pet || "",
        aura: config.aura || "",
        outfit: config.outfit || "",
      };
      setPreviewConfig(loadedConfig);
      setSavedConfig(loadedConfig);
    }
  }, [profile?.avatar_config]);

  // Determine if item is unlocked/owned
  const isItemOwned = (item: AvatarItem) => {
    if (item.currency === "free" || item.cost === 0) return true;
    return unlockedItems.includes(item.id);
  };

  // Determine if preview changes are unsaved
  const hasChanges = savedConfig ? JSON.stringify(previewConfig) !== JSON.stringify(savedConfig) : true;

  // Equip item locally (live preview)
  const selectItem = (item: AvatarItem) => {
    setPreviewConfig((prev) => {
      const updated = { ...prev };

      // Handle special rules (equipping an outfit strips shirt/pants/etc. preview, or vice versa)
      if (item.category === "outfit") {
        updated.outfit = item.id;
        updated.shirt = ""; // reset shirts/pants when full outfit equipped
        updated.pants = "";
      } else {
        if (item.category === "shirt" || item.category === "pants") {
          updated.outfit = ""; // clear outfit when choosing custom shirt/pants
        }
        (updated as any)[item.category === "hair_style" ? "hairStyle" :
                        item.category === "hair_color" ? "hairColor" :
                        item.category === "highlight" ? "hairHighlight" :
                        item.category] = item.id;
      }

      return updated;
    });
  };

  // Unequip slot
  const clearSlot = (category: keyof typeof previewConfig) => {
    setPreviewConfig((prev) => ({
      ...prev,
      [category]: "",
    }));
  };

  // Save current active preview config to Supabase
  const handleSave = async () => {
    try {
      await saveAvatar({ config: previewConfig });
      setSavedConfig(previewConfig);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("avatar.saveSuccess", "¡Avatar guardado y equipado con éxito!"));
    } catch (e: any) {
      toast.error(t("avatar.saveError", "Hubo un error al guardar tu avatar: ") + e.message);
    }
  };

  // Reset to saved configuration
  const handleReset = () => {
    if (savedConfig) {
      setPreviewConfig(savedConfig);
      toast.info(t("avatar.resetSuccess", "Restablecido al avatar equipado."));
    }
  };

  // Checkout unlock process
  const triggerUnlock = (item: AvatarItem) => {
    setCheckoutItem(item);
  };

  const executeUnlock = async () => {
    if (!checkoutItem) return;
    setIsPurchasing(true);
    try {
      const currency = checkoutItem.currency === "xp" ? "xp" : "sombreritos";
      await unlockItem({
        itemId: checkoutItem.id,
        currency,
        cost: checkoutItem.cost,
      });

      // Equip it automatically on preview
      selectItem(checkoutItem);

      // Invalidate queries to fetch updated profiles/streaks
      qc.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success(
        t("avatar.unlockSuccess", {
          defaultValue: `¡Artículo "${checkoutItem.name}" desbloqueado con éxito!`,
          name: checkoutItem.name,
        })
      );
      setCheckoutItem(null);
    } catch (e: any) {
      toast.error(t("avatar.unlockError", "Error al desbloquear: ") + e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Filter items based on category tabs
  const items = Object.values(AVATAR_ITEMS);
  const getTabItems = () => {
    switch (activeTab) {
      case "head":
        return items.filter((item) =>
          ["skin", "hair_style", "hair_color", "highlight", "face"].includes(item.category)
        );
      case "clothing":
        return items.filter((item) =>
          ["shirt", "pants", "shoes"].includes(item.category) && item.currency === "free"
        );
      case "xp_shop":
        return items.filter((item) => item.currency === "xp");
      case "premium_shop":
        return items.filter((item) => item.currency === "sombreritos" && item.category !== "outfit");
      case "outfits":
        return items.filter((item) => item.category === "outfit");
      default:
        return [];
    }
  };

  // Prestige levels calculation
  const currentTitle = getPrestigeTitle(totalXp);
  const currentBadge = getPrestigeBadge(currentTitle);
  const currentLevelIndex = PRESTIGE_LEVELS.findIndex((l) => l.title === currentTitle);
  const nextLevel = currentLevelIndex < PRESTIGE_LEVELS.length - 1 ? PRESTIGE_LEVELS[currentLevelIndex + 1] : null;

  const xpProgressPercent = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalXp - PRESTIGE_LEVELS[currentLevelIndex].xp) /
            (nextLevel.xp - PRESTIGE_LEVELS[currentLevelIndex].xp)) *
            100
        )
      )
    : 100;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="font-semibold text-sm">Cargando el vestidor 3D...</p>
        </div>
      </div>
    );
  }

  const tabItems = getTabItems();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Dynamic Aura Particles Background */}
      <div className="absolute inset-0 bg-radial-at-t from-slate-900 via-slate-950 to-slate-950 z-0 pointer-events-none opacity-80" />

      {/* Top sticky balance indicators & Back button */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="size-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition active:scale-95 cursor-pointer text-slate-300"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display font-black text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Vestidor Virtual</span>
              <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-md font-mono">3D</span>
            </h1>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">Crea tu identidad académica</p>
          </div>
        </div>

        {/* Currency balances floating pills */}
        <div className="flex items-center gap-2">
          {/* XP */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl shadow-inner">
            <Trophy className="size-3.5 text-yellow-400" />
            <span className="font-mono font-black text-xs text-yellow-400">{totalXp}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">XP</span>
          </div>

          {/* Sombreritos */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl shadow-inner">
            <span className="text-sm">🎓</span>
            <span className="font-mono font-black text-xs text-blue-400">{sombreritos}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Visual 3D Roblox Sandbox */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          {/* Prestige level Card banner */}
          <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl mb-4 flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl select-none">
              {currentBadge}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase leading-none">RANGO ACADÉMICO</span>
                <span className="text-xs font-semibold text-primary">{currentTitle}</span>
              </div>
              
              {/* Prestige Gauge */}
              <div className="mt-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-900">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-1 text-[9px] text-slate-500">
                <span>{totalXp} XP</span>
                {nextLevel ? (
                  <span>Faltan {nextLevel.xp - totalXp} XP para {nextLevel.title} {nextLevel.badge}</span>
                ) : (
                  <span>¡Rector Supremo Máximo alcanzado! 👑</span>
                )}
              </div>
            </div>
          </div>

          {/* Real CSS 3D Roblox Render Window */}
          <div className="w-full aspect-[4/5] max-h-[380px] bg-slate-900/40 border border-slate-800/60 rounded-3xl relative shadow-[inset_0_2px_20px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
            {/* Soft grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#090d16_90%),linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100%_100%,32px_32px] opacity-20 pointer-events-none" />

            <RobloxAvatarRenderer config={previewConfig as any} scale={1.05} autoRotate={false} />

            {/* Float helper status */}
            <div className="absolute top-3 left-4 flex gap-1.5">
              {previewConfig.outfit ? (
                <span className="text-[9px] font-black uppercase bg-indigo-900/60 text-indigo-200 border border-indigo-500/20 px-2 py-0.5 rounded shadow">
                  Conjunto equipado
                </span>
              ) : null}
              {previewConfig.aura ? (
                <span className="text-[9px] font-black uppercase bg-yellow-900/60 text-yellow-200 border border-yellow-500/20 px-2 py-0.5 rounded shadow animate-pulse">
                  Aura Activa
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column: Beautiful customizer item selectors */}
        <div className="lg:col-span-7 flex flex-col">
          
          {/* Categories Tab Navigation Bar */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 border border-slate-800/70 rounded-2xl overflow-x-auto scrollbar-none mb-4">
            <button
              onClick={() => setActiveTab("head")}
              className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                activeTab === "head" ? "bg-primary text-white border-primary shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💇‍♂️ Rostro y Cabello
            </button>
            <button
              onClick={() => setActiveTab("clothing")}
              className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                activeTab === "clothing" ? "bg-primary text-white border-primary shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              👕 Ropa Gratis
            </button>
            <button
              onClick={() => setActiveTab("xp_shop")}
              className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                activeTab === "xp_shop" ? "bg-primary text-white border-primary shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🎒 Tienda XP
            </button>
            <button
              onClick={() => setActiveTab("premium_shop")}
              className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                activeTab === "premium_shop" ? "bg-primary text-white border-primary shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🎓 Premium
            </button>
            <button
              onClick={() => setActiveTab("outfits")}
              className={`px-3 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap cursor-pointer transition-all ${
                activeTab === "outfits" ? "bg-primary text-white border-primary shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              👑 Conjuntos
            </button>
          </div>

          {/* Showcase grid of customization items */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-4 flex-1 min-h-[300px] max-h-[480px] overflow-y-auto shadow-2xl relative">
            {tabItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                <span className="text-3xl">📭</span>
                <p className="text-xs mt-2 font-semibold">No se encontraron artículos en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tabItems.map((item) => {
                  const owned = isItemOwned(item);
                  const isEquipped =
                    item.category === "outfit"
                      ? previewConfig.outfit === item.id
                      : item.category === "hair_style"
                      ? previewConfig.hairStyle === item.id
                      : item.category === "hair_color"
                      ? previewConfig.hairColor === item.id
                      : item.category === "highlight"
                      ? previewConfig.hairHighlight === item.id
                      : (previewConfig as any)[item.category] === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`relative rounded-2xl border bg-slate-950 p-3 flex flex-col items-center justify-between text-center transition cursor-pointer select-none group shadow ${
                        isEquipped
                          ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                          : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
                      }`}
                    >
                      {/* Cost currency badge */}
                      {!owned && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-lg text-[9px] font-bold shadow-sm">
                          {item.currency === "xp" ? (
                            <>
                              <Trophy className="size-2 text-yellow-400" />
                              <span className="text-yellow-400">{item.cost}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px]">🎓</span>
                              <span className="text-blue-400 font-mono">{item.cost}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Owned Check badge */}
                      {owned && isEquipped && (
                        <div className="absolute top-2 right-2 size-4.5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white shadow font-black">
                          ✓
                        </div>
                      )}

                      {/* Locked item indicator overlay */}
                      {!owned && (
                        <div className="absolute top-2 left-2 text-slate-500 group-hover:text-slate-400">
                          <Lock className="size-3" />
                        </div>
                      )}

                      {/* Display visual Emoji */}
                      <span className="text-3xl my-2.5 transition-transform duration-200 group-hover:scale-110">
                        {item.emoji}
                      </span>

                      {/* Detail title */}
                      <div className="w-full">
                        <p className="text-[11px] font-black text-slate-200 truncate px-1">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">
                          {item.category === "hair_style" ? "Corte" :
                           item.category === "hair_color" ? "Color Cabello" :
                           item.category === "highlight" ? "Mechas" :
                           item.category === "shirt" ? "Camisa" :
                           item.category === "pants" ? "Pantalones" :
                           item.category === "shoes" ? "Calzado" :
                           item.category === "accessory" ? "Accesorio" :
                           item.category === "aura" ? "Efecto Aura" :
                           item.category === "pet" ? "Mascota" :
                           item.category === "face" ? "Rostro" : item.category}
                        </p>
                      </div>

                      {/* Context action buttons below each grid item */}
                      <div className="mt-2.5 w-full">
                        {owned ? (
                          isEquipped ? (
                            <span className="inline-flex w-full justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 py-1 text-[9px] font-black uppercase">
                              Equipado
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectItem(item);
                              }}
                              className="w-full rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 py-1 text-[9px] font-black uppercase transition active:scale-95 cursor-pointer"
                            >
                              Equipar
                            </button>
                          )
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerUnlock(item);
                            }}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black hover:opacity-90 py-1 text-[9px] uppercase shadow-md transition active:scale-95 cursor-pointer"
                          >
                            Desbloquear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick slot clean options helper */}
          <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-slate-400 bg-slate-900/30 p-2 border border-slate-800/30 rounded-2xl">
            <span className="font-semibold text-slate-500 self-center pl-1">Limpiar slots:</span>
            {previewConfig.accessory && (
              <button
                onClick={() => clearSlot("accessory")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-xl text-slate-300 transition cursor-pointer"
              >
                🎓 Quitar Accesorio
              </button>
            )}
            {previewConfig.pet && (
              <button
                onClick={() => clearSlot("pet")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-xl text-slate-300 transition cursor-pointer"
              >
                🦉 Quitar Mascota
              </button>
            )}
            {previewConfig.aura && (
              <button
                onClick={() => clearSlot("aura")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-xl text-slate-300 transition cursor-pointer"
              >
                ✨ Quitar Aura
              </button>
            )}
            {previewConfig.outfit && (
              <button
                onClick={() => clearSlot("outfit")}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded-xl text-slate-300 transition cursor-pointer"
              >
                👑 Quitar Conjunto
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Floating Save / Changes controls bar at the bottom */}
      {hasChanges && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex flex-col">
            <p className="text-xs font-black text-white flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-yellow-500 animate-ping"></span>
              Cambios sin guardar
            </p>
            <p className="text-[10px] text-slate-400">Tienes ajustes de avatar pendientes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 transition active:scale-95 text-xs font-bold cursor-pointer"
            >
              Deshacer
            </button>
            <button
              onClick={handleSave}
              className="px-4.5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:opacity-90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Check className="size-3.5" /> Guardar Todo
            </button>
          </div>
        </div>
      )}

      {/* PRESTIGE OVERVIEW MODAL INFO BOX (Floating preview details) */}
      <footer className="mt-8 text-center text-[10px] text-slate-500 relative z-10 px-4">
        <p>Lybanhi Academic 3D Avatar Engine • Estilo Roblox Moderno</p>
        <p className="mt-1">Compatible con futuras experiencias interactivas y mundos 3D</p>
      </footer>

      {/* CheckOut Unlocking Transaction Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <span className="text-5xl my-4 bg-slate-950 border border-slate-800 size-20 rounded-2xl flex items-center justify-center shadow-inner">
                {checkoutItem.emoji}
              </span>
              <h3 className="font-display font-black text-lg text-white">¿Desbloquear Artículo?</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Estás a punto de desbloquear <strong>{checkoutItem.name}</strong> para tu colección de avatar.
              </p>

              {/* Deductions breakdown */}
              <div className="w-full bg-slate-950/70 border border-slate-850 rounded-2xl p-3 my-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Costo del artículo:</span>
                <div className="flex items-center gap-1">
                  {checkoutItem.currency === "xp" ? (
                    <>
                      <Trophy className="size-3.5 text-yellow-400" />
                      <span className="font-mono font-black text-sm text-yellow-400">{checkoutItem.cost} XP</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🎓</span>
                      <span className="font-mono font-black text-sm text-blue-400">{checkoutItem.cost} Sombreritos</span>
                    </>
                  )}
                </div>
              </div>

              {/* Verification alert if insufficient currency */}
              {(checkoutItem.currency === "xp" ? totalXp : sombreritos) < checkoutItem.cost ? (
                <div className="w-full bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl p-3 text-[11px] font-medium flex gap-2 items-start text-left mb-4">
                  <AlertTriangle className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-300">Monedas insuficientes</p>
                    <p className="text-[10px] text-red-400/90 mt-0.5">
                      {checkoutItem.currency === "xp"
                        ? "Te falta resolver más exámenes en la sección de Prep para acumular el XP necesario."
                        : "Necesitas convertir tu XP acumulado en el Banco de Sombreritos en el panel de Juegos."}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Action check buttons */}
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => setCheckoutItem(null)}
                  disabled={isPurchasing}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeUnlock}
                  disabled={
                    isPurchasing ||
                    (checkoutItem.currency === "xp" ? totalXp : sombreritos) < checkoutItem.cost
                  }
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs hover:opacity-90 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  {isPurchasing ? (
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Confirmar Compra"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
