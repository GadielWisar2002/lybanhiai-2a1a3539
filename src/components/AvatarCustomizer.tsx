import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Trophy,
  Sparkles,
  ArrowLeft,
  Crown,
  Check,
  AlertTriangle,
  Lock,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ShoppingBag,
  Sliders,
  UserCheck,
  Trash2,
  Shuffle,
  GraduationCap,
  BookOpen,
  Laptop,
  Palette,
  Scroll,
  FlaskConical,
  Award,
  ChevronRight,
  Eye,
  Camera,
  Layers,
  Heart,
  Save,
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
import { RobloxAvatarRenderer } from "./RobloxAvatarRenderer";

interface AvatarCustomizerProps {
  onClose?: () => void;
  inline?: boolean;
}

const PRESTIGE_LEVELS = [
  { xp: 0, title: "Aprendiz", badge: "🌱", color: "from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30" },
  { xp: 500, title: "Estudiante", badge: "📝", color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30" },
  { xp: 1500, title: "Alumno Destacado", badge: "⭐", color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30" },
  { xp: 3500, title: "Académico", badge: "📚", color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30" },
  { xp: 7000, title: "Erudito", badge: "📜", color: "from-indigo-500/20 to-cyan-500/20 text-indigo-400 border-indigo-500/30" },
  { xp: 15000, title: "Leyenda Académica", badge: "🦁", color: "from-red-500/20 to-orange-500/20 text-orange-400 border-red-500/30" },
  { xp: 30000, title: "Rector Supremo", badge: "👑", color: "from-yellow-400/20 to-amber-600/20 text-amber-300 border-amber-400/40 animate-pulse" },
];

export function AvatarCustomizer({ onClose, inline = false }: AvatarCustomizerProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // Load dashboard query
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
    hairStyle: "hair-wavy",
    hairColor: "color-brown-light",
    hairHighlight: "hl-none",
    face: "face-happy",
    shirt: "shirt-basic-tee",
    pants: "pants-basic-skirt",
    shoes: "shoes-basic-shoes",
    accessory: "",
    pet: "",
    aura: "",
    outfit: "",
    gender: "girl", // female by default as requested
  });

  // Saved active equipped configuration
  const [savedConfig, setSavedConfig] = useState<any>(null);

  // Selected item in shop detail panel
  const [selectedItem, setSelectedItem] = useState<AvatarItem | null>(null);

  // Left Vertical customization categories
  const [activeCategory, setActiveCategory] = useState<string>("cabello");

  // Middle subtabs for cortes vs colores
  const [subtab, setSubtab] = useState<"cortes" | "colores">("cortes");

  // Camera scale zoom
  const [zoom, setZoom] = useState(1.1);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Full-screen mode preview toggle
  const [fullScreenPreview, setFullScreenPreview] = useState(false);

  // Sync initial state
  useEffect(() => {
    if (profile?.avatar_config && Object.keys(profile.avatar_config).length > 0) {
      const config = profile.avatar_config as any;
      const loadedConfig = {
        skinColor: config.skinColor || "skin-light-2",
        hairStyle: config.hairStyle || "hair-wavy",
        hairColor: config.hairColor || "color-brown-light",
        hairHighlight: config.hairHighlight || "hl-none",
        face: config.face || "face-happy",
        shirt: config.shirt || "shirt-basic-tee",
        pants: config.pants || "pants-basic-skirt",
        shoes: config.shoes || "shoes-basic-shoes",
        accessory: config.accessory || "",
        pet: config.pet || "",
        aura: config.aura || "",
        outfit: config.outfit || "",
        gender: config.gender || "girl",
      };
      setPreviewConfig(loadedConfig);
      setSavedConfig(loadedConfig);

      // Default selected item
      if (!selectedItem) {
        setSelectedItem(AVATAR_ITEMS["hair-wavy"]);
      }
    }
  }, [profile?.avatar_config]);

  // Determine if item is unlocked/owned
  const isItemOwned = (item: AvatarItem) => {
    if (item.currency === "free" || item.cost === 0) return true;
    return unlockedItems.includes(item.id);
  };

  // Determine if there are unsaved preview changes
  const hasChanges = savedConfig ? JSON.stringify(previewConfig) !== JSON.stringify(savedConfig) : true;

  // Equip item on preview
  const selectItem = (item: AvatarItem) => {
    setSelectedItem(item);
    setPreviewConfig((prev) => {
      const updated = { ...prev };

      if (item.category === "outfit") {
        updated.outfit = item.id;
        updated.shirt = "";
        updated.pants = "";
      } else {
        if (item.category === "shirt" || item.category === "pants") {
          updated.outfit = "";
        }
        (updated as any)[item.category === "hair_style" ? "hairStyle" :
                        item.category === "hair_color" ? "hairColor" :
                        item.category === "highlight" ? "hairHighlight" :
                        item.category] = item.id;
      }

      return updated;
    });
  };

  // Clear slot
  const clearSlot = (category: keyof typeof previewConfig) => {
    setPreviewConfig((prev) => ({
      ...prev,
      [category]: "",
    }));
  };

  // Save changes to database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAvatar({ data: { config: previewConfig } });
      setSavedConfig(previewConfig);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("avatar.saveSuccess", "¡Avatar guardado y equipado con éxito!"));
    } catch (e: any) {
      toast.error(t("avatar.saveError", "Hubo un error al guardar tu avatar: ") + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to saved configuration
  const handleReset = () => {
    if (savedConfig) {
      setPreviewConfig(savedConfig);
      toast.info(t("avatar.resetSuccess", "Restablecido al avatar equipado."));
    }
  };

  // Randomize configuration
  const handleRandomize = () => {
    const items = Object.values(AVATAR_ITEMS);
    const randomHair = items.filter(i => i.category === "hair_style")[Math.floor(Math.random() * items.filter(i => i.category === "hair_style").length)];
    const randomColor = items.filter(i => i.category === "hair_color")[Math.floor(Math.random() * items.filter(i => i.category === "hair_color").length)];
    const randomFace = items.filter(i => i.category === "face")[Math.floor(Math.random() * items.filter(i => i.category === "face").length)];
    const randomSkin = items.filter(i => i.category === "skin")[Math.floor(Math.random() * items.filter(i => i.category === "skin").length)];
    
    setPreviewConfig(prev => ({
      ...prev,
      hairStyle: randomHair?.id || prev.hairStyle,
      hairColor: randomColor?.id || prev.hairColor,
      face: randomFace?.id || prev.face,
      skinColor: randomSkin?.id || prev.skinColor,
    }));
    toast.info("¡Estilo aleatorio aplicado!");
  };

  // Buy lock item
  const handlePurchase = async () => {
    if (!selectedItem) return;
    setIsPurchasing(true);
    try {
      const currency = selectedItem.currency === "xp" ? "xp" : "sombreritos";
      await unlockItem({
        data: {
          itemId: selectedItem.id,
          currency,
          cost: selectedItem.cost,
        },
      });

      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`¡Artículo "${selectedItem.name}" comprado con éxito!`);
    } catch (e: any) {
      toast.error("Error al comprar: " + e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Dynamic vertical categories list (Matches mockup vertical menus exactly)
  const categoriesList = [
    { id: "cabello", label: "Cabello", icon: "💇‍♀️" },
    { id: "color_cabello", label: "Color de cabello", icon: "🎨" },
    { id: "rostro", label: "Rostro", icon: "😊" },
    { id: "ojos", label: "Ojos", icon: "👁️" },
    { id: "cejas", label: "Cejas", icon: "✏️" },
    { id: "boca", label: "Boca", icon: "👄" },
    { id: "piel", label: "Piel", icon: "🖐️" },
    { id: "ropa", label: "Ropa", icon: "👕" },
    { id: "pantalones", label: "Pantalones", icon: "👖" },
    { id: "zapatos", label: "Zapatos", icon: "👟" },
    { id: "accesorios", label: "Accesorios", icon: "👓" },
    { id: "mochilas", label: "Mochilas", icon: "🎒" },
    { id: "mascotas", label: "Mascotas", icon: "🦉" },
    { id: "efectos", label: "Efectos", icon: "✨" },
    { id: "vista_previa", label: "Vista previa", icon: "🔍" },
  ];

  // Filtering items for active vertical category tab selection
  const allItems = Object.values(AVATAR_ITEMS);
  const getFilteredGridItems = () => {
    switch (activeCategory) {
      case "cabello":
        return allItems.filter((i) => i.category === "hair_style");
      case "color_cabello":
        return allItems.filter((i) => i.category === "hair_color" || i.category === "highlight");
      case "rostro":
      case "ojos":
      case "cejas":
      case "boca":
        return allItems.filter((i) => i.category === "face");
      case "piel":
        return allItems.filter((i) => i.category === "skin");
      case "ropa":
        return allItems.filter((i) => i.category === "shirt" || i.category === "outfit");
      case "pantalones":
        return allItems.filter((i) => i.category === "pants");
      case "zapatos":
        return allItems.filter((i) => i.category === "shoes");
      case "accesorios":
        return allItems.filter((i) => i.category === "accessory" && !i.id.includes("backpack"));
      case "mochilas":
        return allItems.filter((i) => i.id.includes("backpack"));
      case "mascotas":
        return allItems.filter((i) => i.category === "pet");
      case "efectos":
        return allItems.filter((i) => i.category === "aura");
      case "vista_previa":
      default:
        return allItems;
    }
  };

  const gridItems = getFilteredGridItems();

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
      <div className="grid min-h-screen place-items-center bg-[#070913] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <p className="font-bold text-sm text-purple-400">Cargando el vestidor 3D de Lybanhi...</p>
        </div>
      </div>
    );
  }

  // Deficits
  const owned = selectedItem ? isItemOwned(selectedItem) : true;
  const userBalance = selectedItem
    ? selectedItem.currency === "xp"
      ? totalXp
      : sombreritos
    : 0;
  const missingBalance = selectedItem && !owned ? selectedItem.cost - userBalance : 0;
  const canBuy = selectedItem && !owned && missingBalance <= 0;

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 relative overflow-x-hidden font-sans pb-24 lg:pb-0">
      {/* Absolute glow overlays for vibrant mockup feel */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* 1. MOCKUP TOP HEADER BAR */}
      <header className="sticky top-0 z-30 bg-[#070913]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="size-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-300 transition duration-200 active:scale-95 cursor-pointer shadow"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <span>Personalizar Avatar</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">3D</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Crea tu estilo, expresa tu identidad y demuestra tu conocimiento.</p>
          </div>
        </div>

        {/* Currency metrics matching top bar exactly */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0E1528] border border-amber-500/25 px-3 py-1.5 rounded-2xl shadow-inner">
            <Trophy className="size-4 text-amber-400" />
            <span className="font-black text-sm text-amber-400 font-mono">530 XP</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0E1528] border border-blue-500/25 px-3 py-1.5 rounded-2xl shadow-inner relative pr-9">
            <span className="text-base">🎓</span>
            <span className="font-black text-sm text-blue-400 font-mono">25</span>
            <button className="absolute right-1 top-1 bottom-1 w-6 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-white flex items-center justify-center text-xs font-bold font-sans cursor-pointer">
              +
            </button>
          </div>
        </div>
      </header>

      {/* MAIN 4-COLUMN RESPONSIVE LAYOUT (ADAPTIVE FOR MOBILE VIEWPORTS) */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col lg:grid lg:grid-cols-12 gap-5 relative z-10">
        
        {/* ==========================================
            COLUMN 3: VISUAL 360 PREVIEW & FLOATING TOOLS (Col-span 3)
            ALWAYS RENDER FIRST ON MOBILE FOR INSTANT VISIBILITY
            ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-1 lg:order-3">
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-0 lg:min-h-[500px]">
            <div>
              <div className="text-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">VISTA PREVIA 360°</span>
                <span className="text-[9px] text-slate-500 font-medium">Arrastra para rotar</span>
              </div>

              {/* Main character preview panel */}
              <div className="w-full aspect-[4/5] max-h-[300px] lg:max-h-none bg-gradient-to-b from-[#0F1426]/50 to-[#0A0D17]/80 border border-slate-800/50 rounded-3xl relative shadow-[inset_0_2px_20px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden my-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#090d16_90%),linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100%_100%,32px_32px] opacity-15 pointer-events-none" />

                {/* Illustrated Renderer */}
                <RobloxAvatarRenderer config={previewConfig} scale={zoom} autoRotate={false} />

                {/* Floating vertical sidebar camera control list */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 bg-[#070913]/85 border border-slate-800/80 p-1.5 rounded-2xl shadow-lg z-20">
                  <button
                    onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                    className="size-8.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition duration-150 cursor-pointer shadow active:scale-90"
                    title="Acercar"
                  >
                    <ZoomIn className="size-4.5" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                    className="size-8.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition duration-150 cursor-pointer shadow active:scale-90"
                    title="Alejar"
                  >
                    <ZoomOut className="size-4.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1.1)}
                    className="size-8.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition duration-150 cursor-pointer shadow active:scale-90"
                    title="Resetear"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom: Probar Todo toggle card */}
            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧥</span>
                <div>
                  <h4 className="text-xs font-extrabold text-white leading-tight">Probar todo</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Vista previa de conjunto completo</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ==========================================
            COLUMN 1: GENDER SELECTOR & ADAPTIVE SECTIONS (Col-span 3)
            renders vertically on desktop, horizontally scrollable on mobile
            ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-0 lg:min-h-[500px]">
            <div>
              {/* Gender panel */}
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">GÉNERO</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewConfig(prev => ({ ...prev, gender: "boy", pants: "pants-basic-jeans" }))}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer border ${
                      previewConfig.gender === "boy"
                        ? "bg-[#1E40AF]/20 border-blue-500/50 text-blue-400 shadow-md"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-sm">♂</span>
                    <span>Masculino</span>
                  </button>
                  <button
                    onClick={() => setPreviewConfig(prev => ({ ...prev, gender: "girl", pants: "pants-basic-skirt" }))}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer border ${
                      previewConfig.gender === "girl"
                        ? "bg-[#EC4899]/15 border-pink-500/50 text-pink-400 shadow-md"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-sm">♀</span>
                    <span>Femenino</span>
                  </button>
                </div>
              </div>

              {/* Scrollable vertical options tabs on desktop, horizontally scrollable on mobile */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 lg:hidden">CATEGORÍAS</span>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pr-1 pb-3 lg:pb-0 scrollbar-none max-h-[140px] lg:max-h-[440px]">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 lg:px-3.5 lg:py-3 rounded-xl text-xs font-bold tracking-wide transition duration-150 cursor-pointer text-left border ${
                        activeCategory === cat.id
                          ? "bg-blue-600/10 border-blue-500/35 text-white shadow-inner font-black"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      <span className="hidden lg:inline">
                        {activeCategory === cat.id && <ChevronRight className="size-3.5 text-blue-400" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Guardar button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg hover:shadow-blue-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Guardar avatar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==========================================
            COLUMN 2: DETAILED OPTIONS SELECTION PANEL (Col-span 3)
            ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3 lg:order-2">
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-0 lg:min-h-[500px]">
            <div>
              {/* Inner Subtabs: Cortes & Colores */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 border border-slate-800/70 rounded-xl mb-4">
                <button
                  onClick={() => setSubtab("cortes")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                    subtab === "cortes" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Cortes
                </button>
                <button
                  onClick={() => setSubtab("colores")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                    subtab === "colores" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Colores
                </button>
              </div>

              {/* Items grid for active category */}
              <div className="max-h-[260px] lg:max-h-[380px] overflow-y-auto pr-1 scrollbar-thin mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {gridItems.map((item) => {
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

                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectItem(item)}
                        className={`aspect-square rounded-2xl border bg-slate-950 p-2 flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer select-none group relative ${
                          isSelected
                            ? "border-amber-400 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : isEquipped
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
                        }`}
                      >
                        {/* Lock / owned indicators */}
                        {!owned && (
                          <div className="absolute top-1 left-1.5 text-slate-500 group-hover:text-slate-400">
                            <Lock className="size-3" />
                          </div>
                        )}
                        {owned && isEquipped && (
                          <div className="absolute top-1 right-1.5 size-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-black">
                            ✓
                          </div>
                        )}

                        <span className="text-2xl my-1.5 transition-transform duration-200 group-hover:scale-110">
                          {item.emoji}
                        </span>
                        <p className="text-[10px] font-black text-slate-200 truncate w-full px-1 leading-tight">
                          {item.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra static options as shown in mockup */}
              <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-4">
                {/* Hair color circular palette */}
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">COLOR DE CABELLO</span>
                  <div className="flex flex-wrap gap-2">
                    {allItems.filter(i => i.category === "hair_color").map(cItem => (
                      <button
                        key={cItem.id}
                        onClick={() => selectItem(cItem)}
                        className={`size-6 rounded-full border cursor-pointer hover:scale-110 active:scale-95 transition ${
                          previewConfig.hairColor === cItem.id ? "border-amber-400 scale-105" : "border-slate-800"
                        }`}
                        style={{
                          backgroundColor:
                            cItem.id === "color-black" ? "#1A1A1A" :
                            cItem.id === "color-brown-light" ? "#59311F" :
                            cItem.id === "color-brown-dark" ? "#361D12" :
                            cItem.id === "color-blonde" ? "#DDA14E" :
                            cItem.id === "color-red" ? "#B53829" :
                            cItem.id === "color-gray" ? "#7C858A" :
                            cItem.id === "color-white" ? "#EBF1F5" :
                            cItem.id === "color-fantasy-pink" ? "#D63384" :
                            cItem.id === "color-fantasy-blue" ? "#0D6EFD" : "#6F42C1"
                        }}
                        title={cItem.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Skin swatches */}
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">TONO DE PIEL</span>
                  <div className="flex flex-wrap gap-2">
                    {allItems.filter(i => i.category === "skin").map(sItem => (
                      <button
                        key={sItem.id}
                        onClick={() => selectItem(sItem)}
                        className={`size-6 rounded-full border cursor-pointer hover:scale-110 active:scale-95 transition ${
                          previewConfig.skinColor === sItem.id ? "border-amber-400 scale-105" : "border-slate-800"
                        }`}
                        style={{
                          backgroundColor:
                            sItem.id === "skin-light-1" ? "#FFF1EB" :
                            sItem.id === "skin-light-2" ? "#FCDAB7" :
                            sItem.id === "skin-medium-1" ? "#EAAD80" :
                            sItem.id === "skin-medium-2" ? "#C68759" : "#7D4E2D"
                        }}
                        title={sItem.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Body models scale (cuerpo) */}
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">CUERPO</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((b) => (
                      <button
                        key={b}
                        onClick={() => setZoom(b === 1 ? 0.95 : b === 2 ? 1.1 : b === 3 ? 1.3 : 1.55)}
                        className={`py-2 rounded-xl bg-slate-900 border text-xs font-semibold cursor-pointer hover:text-slate-200 transition ${
                          (b === 1 && zoom < 1) || (b === 2 && zoom === 1.1) || (b === 3 && zoom === 1.3) || (b === 4 && zoom > 1.4)
                            ? "border-pink-500 text-pink-400 shadow"
                            : "border-slate-800 text-slate-400"
                        }`}
                      >
                        🧍
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shuffle button */}
            <button
              onClick={handleRandomize}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <Shuffle className="size-3.5" />
              <span>Aleatorio</span>
            </button>
          </div>
        </div>

        {/* ==========================================
            COLUMN 4: EQUIPPED, PORTFOLIO & STATISTICS SUMMARY (Col-span 3)
            ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-4 lg:order-4">
          
          {/* Section: EQUIPADO */}
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">EQUIPADO</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Birrete", icon: "🎓", equipped: previewConfig.accessory === "acc-legendary-mortarboard" },
                { label: "Sudadera", icon: "🧥", equipped: previewConfig.shirt !== "" },
                { label: "Mochila", icon: "🎒", equipped: previewConfig.accessory.includes("backpack") },
                { label: "Calzado", icon: "👟", equipped: previewConfig.shoes !== "" },
                { label: "Lentes", icon: "👓", equipped: previewConfig.accessory === "acc-nerd-glasses" },
                { label: "Reloj", icon: "⌚", equipped: true },
                { label: "Collar", icon: "📿", equipped: false },
                { label: "Búho", icon: "🦉", equipped: previewConfig.pet === "pet-owl" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative ${
                    item.equipped
                      ? "border-blue-500/50 bg-[#1E3A8A]/10 shadow-[inset_0_1px_5px_rgba(0,0,0,0.4)]"
                      : "border-slate-800 bg-slate-950/70"
                  }`}
                  title={item.label}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.equipped && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: COLECCIONES EDUCATIVAS */}
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">COLECCIONES EDUCATIVAS</span>
              <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer">Ver todas</button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Ciencias", progress: "12/24", emoji: "🧪", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
                { name: "Historia", progress: "8/20", emoji: "📜", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
                { name: "Matemáticas", progress: "10/22", emoji: "π", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
                { name: "Literatura", progress: "9/18", emoji: "📚", color: "border-teal-500/20 bg-teal-500/5 text-teal-400" },
                { name: "Tecnología", progress: "11/23", emoji: "💻", color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400" },
                { name: "Arte", progress: "7/16", emoji: "🎨", color: "border-rose-500/20 bg-rose-500/5 text-rose-400" },
              ].map((sub, sIdx) => (
                <div key={sIdx} className={`rounded-xl border p-2 text-center flex flex-col items-center justify-between ${sub.color}`}>
                  <span className="text-xs font-bold block truncate leading-none mb-1">{sub.name}</span>
                  <span className="text-xl my-1">{sub.emoji}</span>
                  <span className="text-[9px] font-black opacity-80 leading-none">{sub.progress}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: NIVEL DE PRESTIGIO */}
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none block mb-0.5">NIVEL DE PRESTIGIO</span>
                <h4 className="text-xs font-black text-white">Estudiante Destacado</h4>
              </div>
              <span className="text-2xl select-none">⭐</span>
            </div>

            {/* Progression bar */}
            <div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1.5">
                <span>Nivel 8</span>
                <span className="font-mono text-purple-400">530 / 1500 XP</span>
              </div>
              <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-3 space-y-1 text-[9px] font-medium text-slate-400 leading-tight">
              <p className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-purple-400" /> +10% XP en quizzes</p>
              <p className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-purple-400" /> Acceso a artículos exclusivos</p>
              <p className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-purple-400" /> Descuento del 5% en la tienda</p>
            </div>
          </div>

          {/* Section: TUS RECURSOS */}
          <div className="bg-[#0B0F1B]/95 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">TUS RECURSOS</span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 bg-slate-950/60 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-center gap-2">
                <Trophy className="size-4.5 text-amber-400" />
                <span className="font-black text-xs text-amber-400 font-mono">530 XP</span>
              </div>
              <div className="flex-1 bg-slate-950/60 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-center gap-2">
                <span className="text-base leading-none">🎓</span>
                <span className="font-black text-xs text-blue-400 font-mono">25 Sombreritos</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Floating detail box if they select an locked item */}
      {selectedItem && !owned && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm bg-[#0B0F1B]/95 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest leading-none">VISTA DE ARTÍCULO</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono">
              {selectedItem.cost} {selectedItem.currency === "xp" ? "XP" : "Sombreritos"}
            </span>
          </div>
          <h4 className="text-sm font-black text-white">{selectedItem.name}</h4>
          <p className="text-xs text-slate-400 leading-snug mt-1">{selectedItem.description}</p>
          
          <div className="mt-3 flex gap-2">
            {missingBalance > 0 ? (
              <div className="w-full bg-red-950/30 border border-red-500/20 text-red-400 rounded-xl p-2.5 text-[10px] font-medium flex gap-1.5 items-center">
                <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                <span>Te faltan {missingBalance} {selectedItem.currency === "xp" ? "XP" : "Sombreritos"}</span>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !canBuy}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition cursor-pointer"
              >
                Comprar Artículo
              </button>
            )}
          </div>
        </div>
      )}

      {/* FIXED CHANGES CONTROLLER FLOOR TAB (equipped items save confirmation) */}
      {hasChanges && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 bg-slate-900/95 border border-slate-700/80 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex flex-col">
            <p className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
              <span className="size-2 rounded-full bg-pink-500 animate-ping"></span>
              Cambios sin guardar
            </p>
            <p className="text-[10px] text-slate-400 mt-1">¿Quieres equipar y guardar el avatar actual?</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 transition active:scale-95 text-xs font-bold cursor-pointer"
            >
              Deshacer
            </button>
            <button
              onClick={handleSave}
              className="px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg active:scale-95 transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="size-3.5" /> Equipar y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
