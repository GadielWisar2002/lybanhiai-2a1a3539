import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RobloxAvatarRenderer } from "./RobloxAvatarRenderer";
import { getDashboard } from "@/lib/quiz.functions";
import { saveAvatarConfig } from "@/lib/avatar.functions";

interface AvatarCustomizerProps {
  onClose?: () => void;
  inline?: boolean;
}

const CATEGORIES = [
  { id: "cabello", label: "Cabello", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M3 11c0-4.5 3-7 7-7s7 2.5 7 7v4" /><path d="M4 14c1 0 2-1 2-3s1-3 3-3" /><path d="M20 14c-1 0-2-1-2-3s-1-3-3-3" /></svg> },
  { id: "color_cabello", label: "Color de cabello", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" /><path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" /><path d="M2 12h20" /></svg> },
  { id: "rostro", label: "Rostro", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> },
  { id: "ojos", label: "Ojos", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> },
  { id: "cejas", label: "Cejas", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M3 10c2-3 6-3 8-1" /><path d="M13 9c2-2 6-2 8 1" /></svg> },
  { id: "boca", label: "Boca", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M4 10c4 0 5 4 8 4s4-4 8-4c-3 5-5 7-8 7s-5-2-8-7z" /></svg> },
  { id: "piel", label: "Piel", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" /><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" /><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4.5" /><path d="M6 14v-1.5a1.5 1.5 0 0 0-3 0V18a6 6 0 0 0 6 6h4a8 8 0 0 0 8-8v-2a2 2 0 0 0-2 2" /></svg> },
  { id: "ropa", label: "Ropa", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M20.38 3.46L16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2L3.62 3.46a2 2 0 0 0-2.42.88l-1 1.73a2 2 0 0 0 .58 2.51L5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9l4.22-2.42a2 2 0 0 0 .58-2.51l-1-1.73a2 2 0 0 0-2.42-.88z" /></svg> },
  { id: "pantalones", label: "Pantalones", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M5 2h14v10l-2 10H13v-8h-2v8H7L5 12z" /></svg> },
  { id: "zapatos", label: "Zapatos", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M3 18v-2a4 4 0 0 1 4-4h5l9 3v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 12v4" /></svg> },
  { id: "accesorios", label: "Accesorios", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /><path d="M3 12c0-3 2-5 3-5" /><path d="M21 12c0-3-2-5-3-5" /></svg> },
  { id: "mochilas", label: "Mochilas", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><rect x="5" y="8" width="14" height="14" rx="2" /><path d="M9 8V5a3 3 0 0 1 6 0v3" /><path d="M5 12h14" /></svg> },
  { id: "mascotas", label: "Mascotas", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M12 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-5 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-5 6c-2.2 0-4-1.8-4-4 0-1.5 1.5-3 4-3s4 1.5 4 3c0 2.2-1.8 4-4 4z" /></svg> },
  { id: "efectos", label: "Efectos", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M19 13l-1.5-1.5" /><path d="M11.5 5.5L10 4" /><path d="M2 22l6-6" /></svg> },
  { id: "vista_previa", label: "Vista previa", icon: (color: string) => <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 12h1.01M16 12h1.01" /></svg> }
];

const HAIR_CUTS = [
  { id: "hair-short", name: "Pelo corto" },
  { id: "hair-long", name: "Pelo largo" },
  { id: "hair-wavy", name: "Pelo ondulado" },
  { id: "hair-straight", name: "Pelo liso" },
  { id: "hair-curly", name: "Pelo rizado" },
  { id: "hair-pigtails", name: "Coleta" },
  { id: "hair-braids", name: "Trenza" },
  { id: "hair-bangs", name: "Flequillo" },
  { id: "hair-male-modern", name: "Corte moderno masculino" },
  { id: "hair-female-modern", name: "Corte moderno femenino" },
  { id: "hair-mohawk", name: "Mohawk" },
  { id: "hair-afro", name: "Afro premium" }
];

const HAIR_COLORS = [
  { name: "negro", hex: "#1A1A1A" },
  { name: "café oscuro", hex: "#3B1F0A" },
  { name: "café medio", hex: "#59311F" },
  { name: "café camel", hex: "#A06030" },
  { name: "gris oscuro", hex: "#4B4B4B" },
  { name: "naranja", hex: "#E25B26" },
  { name: "rojo", hex: "#B52818" },
  { name: "lila", hex: "#C09CEB" },
  { name: "morado", hex: "#6F2C91" },
  { name: "rosa", hex: "#D62272" },
  { name: "azul marino", hex: "#0A1A3C" },
  { name: "azul claro", hex: "#2F80ED" },
  { name: "verde menta", hex: "#7EE8B0" },
  { name: "naranja neón", hex: "#FF7F00" },
  { name: "rosa pastel", hex: "#FFB2D6" },
  { name: "lila pastel", hex: "#E1BEE7" },
  { name: "azul bebé", hex: "#B3E5FC" },
  { name: "verde agua", hex: "#80CBC4" },
  { name: "gradiente arcoíris", hex: "linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8B00FF)" }
];

const FACES = [
  { id: "face-happy", name: "Feliz", icon: "😊" },
  { id: "face-studying", name: "Estudiando", icon: "🤓" },
  { id: "face-excited", name: "Entusiasmado", icon: "🤩" },
  { id: "face-cool", name: "Cool", icon: "😎" }
];

const SKIN_TONES = [
  { hex: "#FFDAB9", label: "Muy claro" },
  { hex: "#E8B89A", label: "Claro" },
  { hex: "#C68642", label: "Intermedio" },
  { hex: "#8D5524", label: "Oscuro" },
  { hex: "#4A2912", label: "Muy oscuro" }
];

const BODY_TYPES = [
  { id: "delgado", label: "Delgado", icon: "🧍" },
  { id: "normal", label: "Normal", icon: "🧍‍♂️" },
  { id: "atletico", label: "Atlético", icon: "🏋️" },
  { id: "robusto", label: "Robustoso", icon: "🧎" }
];

export function AvatarCustomizer({ onClose, inline = false }: AvatarCustomizerProps) {
  const qc = useQueryClient();
  const getDash = useServerFn(getDashboard);
  const saveAvatar = useServerFn(saveAvatarConfig);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDash(),
  });

  const profile = data?.profile;
  const streak = data?.streak;

  const totalXp = streak?.total_xp ?? 530;
  const sombreritos = streak?.coins ?? 25;

  // Active configurations
  const [activeCategory, setActiveCategory] = useState<string>("cabello");
  const [hairSubtab, setHairSubtab] = useState<"cortes" | "colores">("cortes");
  const [previewConfig, setPreviewConfig] = useState({
    skinColor: "#E8B89A",
    hairStyle: "hair-short",
    hairColor: "#3B1F0A",
    hairHighlight: "hl-none",
    face: "face-happy",
    shirt: "shirt-academic-jacket",
    pants: "pants-basic-jeans",
    shoes: "shoes-basic-shoes",
    accessory: "",
    pet: "",
    aura: "",
    outfit: "",
    gender: "boy", // boy = Masculino, girl = Femenino
    bodyType: "delgado",
    zoom: 1.0,
    viewMode: "body" as "body" | "clothes" | "animation" | "expressions"
  });

  const [probarTodo, setProbarTodo] = useState(true);
  const [probarTransition, setProbarTransition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedJson, setShowSavedJson] = useState<any>(null);

  // Sync initial state
  useEffect(() => {
    if (profile?.avatar_config && Object.keys(profile.avatar_config).length > 0) {
      const config = profile.avatar_config as any;
      setPreviewConfig((prev) => ({
        ...prev,
        skinColor: config.skinColor || "#E8B89A",
        hairStyle: config.hairStyle || "hair-short",
        hairColor: config.hairColor || "#3B1F0A",
        hairHighlight: config.hairHighlight || "hl-none",
        face: config.face || "face-happy",
        shirt: config.shirt || "shirt-academic-jacket",
        pants: config.pants || "pants-basic-jeans",
        shoes: config.shoes || "shoes-basic-shoes",
        accessory: config.accessory || "",
        pet: config.pet || "",
        aura: config.aura || "",
        outfit: config.outfit || "",
        gender: config.gender || "boy",
        bodyType: config.bodyType || "delgado",
      }));
    }
  }, [profile?.avatar_config]);

  const activeColor = previewConfig.gender === "boy" ? "#3B6DE8" : "#E83B8E";

  const handleGenderChange = (gender: "boy" | "girl") => {
    setPreviewConfig((prev) => ({
      ...prev,
      gender,
      shirt: gender === "boy" ? "shirt-academic-jacket" : "shirt-basic-hoodie",
      pants: gender === "boy" ? "pants-basic-jeans" : "pants-basic-skirt",
    }));
  };

  const handleRandomize = () => {
    const randomHair = HAIR_CUTS[Math.floor(Math.random() * HAIR_CUTS.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomBody = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].id;
    const randomFace = FACES[Math.floor(Math.random() * FACES.length)].id;

    setPreviewConfig((prev) => ({
      ...prev,
      hairStyle: randomHair,
      hairColor: randomHairColor,
      skinColor: randomSkin,
      bodyType: randomBody,
      face: randomFace,
    }));
    toast.info("¡Estilo aleatorio aplicado!");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAvatar({ data: { config: previewConfig } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      
      // Output JSON generated
      const generatedJson = {
        gender: previewConfig.gender === "boy" ? "masculino" : "femenino",
        hairStyle: previewConfig.hairStyle,
        hairColor: previewConfig.hairColor,
        skinColor: previewConfig.skinColor,
        bodyType: previewConfig.bodyType,
        face: previewConfig.face,
        shirt: previewConfig.shirt,
        pants: previewConfig.pants,
        shoes: previewConfig.shoes,
        accessory: previewConfig.accessory,
        pet: previewConfig.pet,
        aura: previewConfig.aura,
        outfit: previewConfig.outfit,
        stats: {
          level: 8,
          xp: totalXp,
          sombreritos: sombreritos
        }
      };
      
      setShowSavedJson(generatedJson);
      toast.success("¡Avatar guardado exitosamente! 🎉");
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProbarTodoToggle = () => {
    setProbarTodo((prev) => !prev);
    setProbarTransition(true);
    setTimeout(() => setProbarTransition(false), 800);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080D24] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <p className="font-bold text-sm tracking-wide font-['Rajdhani'] text-cyan-400">Cargando la interfaz de personalización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080D24] text-white font-['Rajdhani',_sans-serif] flex flex-col justify-between overflow-x-hidden relative">
      
      {/* 1. HEADER BAR */}
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white hover:text-slate-300 font-bold transition flex items-center gap-1.5 cursor-pointer">
            ← Atrás
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl tracking-wide text-white">Personalizar Avatar</h1>
            <span className="text-[10px] bg-[#3B6DE8] text-white px-2.5 py-0.5 rounded-full font-black tracking-widest font-mono">3D</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#111827]/85 border border-[#1E2D5A] px-3.5 py-1.5 rounded-xl">
            <span className="text-sm">🏆</span>
            <span className="font-bold text-sm text-[#FFB020] font-mono">{totalXp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#111827]/85 border border-[#1E2D5A] px-3.5 py-1.5 rounded-xl">
            <span className="text-sm">🎓</span>
            <span className="font-bold text-sm text-cyan-400 font-mono">{sombreritos} Sombreritos</span>
          </div>
          <button className="text-slate-400 hover:text-white transition duration-150 relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <span className="absolute top-0 right-0 size-2 bg-[#E83B8E] rounded-full" />
          </button>
        </div>
      </header>

      {/* 2. THREE COLUMN LAYOUT */}
      <main className="max-w-[1440px] mx-auto w-full px-6 py-6 grid grid-cols-10 gap-5 items-start flex-1 min-h-0">
        
        {/* LEFT COLUMN (22% width) */}
        <section className="col-span-2 flex flex-col gap-4 self-stretch bg-[#111827]/80 backdrop-blur-md border border-[#1E2D5A] rounded-2xl p-4 shadow-xl">
          {/* Gender selection */}
          <div>
            <span className="text-[10px] letter-spacing-1.5px color-[#8896B3] font-bold block mb-2 uppercase">GÉNERO</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleGenderChange("boy")}
                className={`py-2 rounded-xl text-sm font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  previewConfig.gender === "boy" ? "bg-[#3B6DE8] text-white shadow-lg" : "bg-[#1A2240] text-[#8896B3] hover:text-white"
                }`}
              >
                <span>♂</span>
                <span>Masculino</span>
              </button>
              <button
                onClick={() => handleGenderChange("girl")}
                className={`py-2 rounded-xl text-sm font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  previewConfig.gender === "girl" ? "bg-[#E83B8E] text-white shadow-lg" : "bg-[#1A2240] text-[#8896B3] hover:text-white"
                }`}
              >
                <span>♀</span>
                <span>Femenino</span>
              </button>
            </div>
          </div>

          {/* Vertical scroll list of categories */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[360px] scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border border-transparent transition-all text-left font-medium text-[13.5px] cursor-pointer ${
                    isActive
                      ? "bg-[#2D5BE3] text-white border-l-[3px] border-l-[#00B4FF] font-bold"
                      : "text-[#8896B3] hover:bg-slate-900/60 hover:text-white"
                  }`}
                >
                  {cat.icon(isActive ? "#FFFFFF" : "#8896B3")}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 mt-2 rounded-xl bg-[#1A2B6B] hover:bg-[#203480] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition active:scale-95"
          >
            {isSaving ? (
              <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>💾</span>
                <span>Guardar avatar</span>
              </>
            )}
          </button>
        </section>

        {/* CENTER COLUMN (40% width) */}
        <section className="col-span-4 flex flex-col gap-4 self-stretch min-w-0">
          
          {/* Options Panel (Upper 50%) */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1E2D5A] rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between min-h-[300px]">
            <div>
              {activeCategory === "cabello" && (
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">CABELLO</h3>
                    {/* Horizontal tabs */}
                    <div className="flex bg-[#1A2240] p-0.5 rounded-xl border border-[#1E2D5A]">
                      <button
                        onClick={() => setHairSubtab("cortes")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          hairSubtab === "cortes" ? "bg-white text-[#080D24]" : "text-[#8896B3] hover:text-white"
                        }`}
                      >
                        Cortes
                      </button>
                      <button
                        onClick={() => setHairSubtab("colores")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          hairSubtab === "colores" ? "bg-white text-[#080D24]" : "text-[#8896B3] hover:text-white"
                        }`}
                      >
                        Colores
                      </button>
                    </div>
                  </div>

                  {hairSubtab === "cortes" ? (
                    <div className="grid grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                      {HAIR_CUTS.map((cut) => {
                        const isSelected = previewConfig.hairStyle === cut.id;
                        return (
                          <div
                            key={cut.id}
                            onClick={() => setPreviewConfig(prev => ({ ...prev, hairStyle: cut.id }))}
                            className="aspect-square bg-[#1A2240] border rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition select-none group relative"
                            style={{
                              borderColor: isSelected ? activeColor : "#1E2D5A"
                            }}
                          >
                            {/* Head & hair thumbnail render */}
                            <svg viewBox="0 0 60 60" className="w-11 h-11 mx-auto">
                              <circle cx="30" cy="34" r="12" fill={previewConfig.skinColor} />
                              <circle cx="17" cy="34" r="3" fill={previewConfig.skinColor} />
                              <circle cx="43" cy="34" r="3" fill={previewConfig.skinColor} />
                              <circle cx="26" cy="32" r="1.2" fill="#1A0F0A" />
                              <circle cx="34" cy="32" r="1.2" fill="#1A0F0A" />
                              <path d="M26 40 Q30 42 34 40" stroke="#B91C1C" strokeWidth="0.8" fill="none" />
                              {/* Short Hair Overlay */}
                              {cut.id === "hair-short" && (
                                <path d="M18 30 C18 16 42 16 42 30 C38 28 34 26 30 26 C26 26 22 28 18 30 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Long Hair Overlay */}
                              {cut.id === "hair-long" && (
                                <path d="M17 32 C17 18 43 18 43 32 L43 45 C41 43 39 42 37 42 C30 42 30 40 30 30 C30 40 30 42 23 42 C21 42 19 43 17 45 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Wavy Hair Overlay */}
                              {cut.id === "hair-wavy" && (
                                <path d="M18 28 C18 14 42 14 42 28 Q44 32 40 34 Q30 30 30 30 Q30 30 20 34 Q16 32 18 28 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Straight Hair */}
                              {cut.id === "hair-straight" && (
                                <path d="M18 28 C18 16 42 16 42 28 L44 42 L39 42 L41 28 L19 28 L21 42 L16 42 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Curly Hair */}
                              {cut.id === "hair-curly" && (
                                <g fill={previewConfig.hairColor}>
                                  <circle cx="30" cy="22" r="8" />
                                  <circle cx="22" cy="26" r="7" />
                                  <circle cx="38" cy="26" r="7" />
                                  <circle cx="18" cy="32" r="6" />
                                  <circle cx="42" cy="32" r="6" />
                                </g>
                              )}
                              {/* Pigtails */}
                              {cut.id === "hair-pigtails" && (
                                <g fill={previewConfig.hairColor}>
                                  <path d="M18 28 C18 18 42 18 42 28 Z" />
                                  <circle cx="15" cy="22" r="5" />
                                  <circle cx="45" cy="22" r="5" />
                                </g>
                              )}
                              {/* Braids */}
                              {cut.id === "hair-braids" && (
                                <g fill={previewConfig.hairColor}>
                                  <path d="M18 28 C18 18 42 18 42 28 Z" />
                                  <path d="M16 28 L14 44 L20 44 Z" />
                                  <path d="M44 28 L46 44 L40 44 Z" />
                                </g>
                              )}
                              {/* Bangs */}
                              {cut.id === "hair-bangs" && (
                                <g fill={previewConfig.hairColor}>
                                  <path d="M18 30 C18 16 42 16 42 30 Z" />
                                  <path d="M18 30 C22 28 38 28 42 30 L42 24 L18 24 Z" />
                                </g>
                              )}
                              {/* Modern Male */}
                              {cut.id === "hair-male-modern" && (
                                <path d="M18 30 C18 14 42 14 42 30 L40 28 L30 18 L20 28 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Modern Female */}
                              {cut.id === "hair-female-modern" && (
                                <path d="M18 30 C18 16 42 16 42 30 L44 38 L36 34 L30 36 L18 30 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Mohawk */}
                              {cut.id === "hair-mohawk" && (
                                <path d="M27 20 C27 20 30 10 33 20 L32 26 L28 26 Z" fill={previewConfig.hairColor} />
                              )}
                              {/* Afro */}
                              {cut.id === "hair-afro" && (
                                <circle cx="30" cy="28" r="13.5" fill={previewConfig.hairColor} />
                              )}
                            </svg>
                            <span className="text-[9.5px] font-medium text-slate-300 truncate w-full text-center mt-1">
                              {cut.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase block">COLOR DE CABELLO</span>
                      <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto pr-1 scrollbar-thin">
                        {HAIR_COLORS.map((color) => {
                          const isSelected = previewConfig.hairColor === color.hex;
                          return (
                            <button
                              key={color.name}
                              onClick={() => setPreviewConfig(prev => ({ ...prev, hairColor: color.hex }))}
                              className="size-6 rounded-full border hover:scale-110 active:scale-95 transition cursor-pointer flex items-center justify-center relative"
                              style={{
                                background: color.hex,
                                borderColor: isSelected ? "#FFFFFF" : "#1E2D5A",
                                borderWidth: isSelected ? "2.2px" : "1.2px"
                              }}
                              title={color.name}
                            >
                              {isSelected && (
                                <span className="absolute size-1 bg-white rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeCategory === "color_cabello" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">COLOR DE CABELLO</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {HAIR_COLORS.map((color) => {
                      const isSelected = previewConfig.hairColor === color.hex;
                      return (
                        <button
                          key={color.name}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, hairColor: color.hex }))}
                          className="size-6 rounded-full border hover:scale-110 transition cursor-pointer"
                          style={{
                            background: color.hex,
                            borderColor: isSelected ? "#FFFFFF" : "#1E2D5A",
                            borderWidth: isSelected ? "2.2px" : "1.2px"
                          }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {activeCategory === "rostro" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">ROSTRO</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {FACES.map((face) => {
                      const isSelected = previewConfig.face === face.id;
                      return (
                        <div
                          key={face.id}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, face: face.id }))}
                          className="aspect-square bg-[#1A2240] border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition"
                          style={{
                            borderColor: isSelected ? activeColor : "#1E2D5A"
                          }}
                        >
                          <span className="text-3xl mb-1">{face.icon}</span>
                          <span className="text-xs font-bold text-white">{face.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeCategory === "piel" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">TONO DE PIEL</h3>
                  <div className="flex gap-3">
                    {SKIN_TONES.map((skin) => {
                      const isSelected = previewConfig.skinColor === skin.hex;
                      return (
                        <button
                          key={skin.hex}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, skinColor: skin.hex }))}
                          className="size-9 rounded-full border hover:scale-105 transition cursor-pointer relative"
                          style={{
                            backgroundColor: skin.hex,
                            borderColor: isSelected ? "#FFFFFF" : "#1E2D5A",
                            borderWidth: isSelected ? "2.5px" : "1.2px"
                          }}
                          title={skin.label}
                        >
                          {isSelected && (
                            <span className="absolute size-1.5 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ropa Options */}
              {activeCategory === "ropa" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">ROPA SUPERIOR</h3>
                  <div className="grid grid-cols-3 gap-2.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {[
                      { id: "shirt-academic-jacket", name: "Chaqueta varsity" },
                      { id: "shirt-basic-hoodie", name: "Sudadera escolar" },
                      { id: "shirt-basic-tee", name: "Camiseta básica" },
                      { id: "shirt-lab-coat", name: "Bata escolar" }
                    ].map((item) => {
                      const isSelected = previewConfig.shirt === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, shirt: item.id }))}
                          className="bg-[#1A2240] border rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition text-center"
                          style={{
                            borderColor: isSelected ? activeColor : "#1E2D5A"
                          }}
                        >
                          <span className="text-xl mb-1">👕</span>
                          <span className="text-[11px] font-bold text-white leading-tight">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pantalones Options */}
              {activeCategory === "pantalones" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">ROPA INFERIOR</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "pants-basic-jeans", name: "Jeans ajustados", icon: "👖" },
                      { id: "pants-basic-skirt", name: "Falda escolar", icon: "👗" }
                    ].map((item) => {
                      const isSelected = previewConfig.pants === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, pants: item.id }))}
                          className="bg-[#1A2240] border rounded-xl p-3.5 flex items-center justify-center gap-3 cursor-pointer transition"
                          style={{
                            borderColor: isSelected ? activeColor : "#1E2D5A"
                          }}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-xs font-bold text-white">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Piel and Cuerpo (Always displayed as generic slots under standard categories) */}
              {activeCategory !== "cabello" && activeCategory !== "rostro" && activeCategory !== "piel" && activeCategory !== "ropa" && activeCategory !== "pantalones" && activeCategory !== "vista_previa" && (
                <div className="space-y-3.5">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">{activeCategory}</h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "", name: "Ninguno", emoji: "❌" },
                      { id: "acc-legendary-mortarboard", name: "Birrete" },
                      { id: "acc-knowledge-crown", name: "Corona" },
                      { id: "acc-headphones", name: "Auriculares" },
                      { id: "acc-nerd-glasses", name: "Lentes" }
                    ].filter(item => {
                      if (activeCategory === "accesorios") return item.id !== "";
                      return true;
                    }).map((item) => {
                      const isSelected = previewConfig.accessory === item.id || previewConfig.pet === item.id || previewConfig.aura === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (activeCategory === "accesorios") {
                              setPreviewConfig(prev => ({ ...prev, accessory: item.id }));
                            } else if (activeCategory === "mochilas") {
                              setPreviewConfig(prev => ({ ...prev, accessory: item.id.includes("backpack") ? item.id : "acc-school-backpack" }));
                            }
                          }}
                          className="bg-[#1A2240] border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center"
                          style={{
                            borderColor: isSelected ? activeColor : "#1E2D5A"
                          }}
                        >
                          <span className="text-2xl mb-1">{item.emoji || "🎒"}</span>
                          <span className="text-[11px] font-bold text-white leading-tight">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeCategory === "vista_previa" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">FICHA TÉCNICA AVATAR</h3>
                  <div className="bg-[#1A2240] border border-[#1E2D5A] rounded-xl p-3 font-mono text-[10.5px] text-[#8896B3] space-y-1 select-text">
                    <p className="text-white font-bold mb-1">// Configuración Guardada:</p>
                    <pre className="max-h-[120px] overflow-y-auto scrollbar-thin">
                      {JSON.stringify(showSavedJson || {
                        gender: previewConfig.gender === "boy" ? "masculino" : "femenino",
                        hairStyle: previewConfig.hairStyle,
                        hairColor: previewConfig.hairColor,
                        skinColor: previewConfig.skinColor,
                        bodyType: previewConfig.bodyType,
                        face: previewConfig.face,
                        shirt: previewConfig.shirt,
                        pants: previewConfig.pants,
                        shoes: previewConfig.shoes
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tono de piel y cuerpo row (Tallas) */}
              {activeCategory === "piel" && (
                <div className="mt-4 border-t border-[#1E2D5A] pt-3.5">
                  <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase block mb-2">CUERPO</span>
                  <div className="grid grid-cols-4 gap-2">
                    {BODY_TYPES.map((body) => {
                      const isSelected = previewConfig.bodyType === body.id;
                      return (
                        <button
                          key={body.id}
                          onClick={() => setPreviewConfig(prev => ({ ...prev, bodyType: body.id }))}
                          className="py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          style={{
                            backgroundColor: isSelected ? activeColor : "#1A2240",
                            borderColor: isSelected ? "#FFFFFF" : "#1E2D5A",
                            color: "#FFFFFF"
                          }}
                        >
                          <span className="text-sm">{body.icon}</span>
                          <span>{body.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Aleatorio button */}
            <button
              onClick={handleRandomize}
              className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-[#1E2D5A] hover:bg-[#1A2240]/40 text-slate-300 font-semibold text-xs tracking-wider transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚄</span>
              <span>Aleatorio</span>
            </button>
          </div>

          {/* 360 Preview (Lower 50%) */}
          <div className="bg-gradient-to-b from-[#12185A]/50 to-[#0A0E2A]/90 border border-[#1E2D5A] rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between relative">
            <div className="absolute top-3 left-4 text-left z-20">
              <span className="text-[11px] font-bold text-white tracking-widest block">VISTA PREVIA 360°</span>
              <span className="text-[9px] text-slate-400 font-medium">Arrastra para rotar</span>
            </div>

            {/* Camera Zoom Tools on left */}
            <div className="absolute top-12 left-4 flex flex-col gap-2 bg-[#080c18]/90 border border-[#1E2D5A] p-1.5 rounded-2xl z-20 shadow-lg">
              <button onClick={() => setPreviewConfig(prev => ({ ...prev, zoom: Math.min(2.0, prev.zoom + 0.15) }))} className="size-8.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white font-bold cursor-pointer active:scale-90 transition">
                ⊕
              </button>
              <button onClick={() => setPreviewConfig(prev => ({ ...prev, zoom: Math.max(0.6, prev.zoom - 0.15) }))} className="size-8.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white font-bold cursor-pointer active:scale-90 transition">
                ⊖
              </button>
              <button onClick={() => setPreviewConfig(prev => ({ ...prev, zoom: 1.0 }))} className="size-8.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white font-bold cursor-pointer active:scale-90 transition">
                ↺
              </button>
              <button onClick={() => setPreviewConfig(prev => ({ ...prev, zoom: 1.25 }))} className="size-8.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white font-bold cursor-pointer active:scale-90 transition">
                ⊡
              </button>
            </div>

            {/* 3D Character Canvas */}
            <div className={`w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden transition-all duration-700 ${probarTransition ? "scale-95 opacity-55" : ""}`}>
              <RobloxAvatarRenderer config={previewConfig} autoRotate={false} />
            </div>

            {/* Bottom HUD controls & animations selectors */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="flex gap-2">
                {[
                  { mode: "body", icon: "🧍" },
                  { mode: "clothes", icon: "👕" },
                  { mode: "animation", icon: "🏃" },
                  { mode: "expressions", icon: "😊" }
                ].map((btn) => (
                  <button
                    key={btn.mode}
                    onClick={() => setPreviewConfig(prev => ({ ...prev, viewMode: btn.mode as any }))}
                    className={`size-8 rounded-full border flex items-center justify-center text-sm cursor-pointer hover:scale-105 active:scale-95 transition ${
                      previewConfig.viewMode === btn.mode
                        ? "bg-[#3B6DE8] border-white text-white shadow-md shadow-blue-500/20"
                        : "bg-[#111827] border-[#1E2D5A] text-slate-400"
                    }`}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>

              {/* Switch Toggle card */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 leading-none text-right uppercase">Probar todo</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={probarTodo} onChange={handleProbarTodoToggle} className="sr-only peer" />
                  <div className="w-8 h-4.5 bg-slate-700 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#3B6DE8]"></div>
                </label>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT COLUMN (38% width) */}
        <section className="col-span-4 flex flex-col gap-4 self-stretch justify-between">
          
          {/* Panel EQUIPADO */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1E2D5A] rounded-2xl p-4 shadow-xl relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">EQUIPADO</h3>
              <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer">✏️ Editar look</button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[
                { name: "Hat", icon: "🎓", rarity: "special", active: previewConfig.accessory !== "" },
                { name: "Hoodie", icon: "🧥", rarity: "common", active: previewConfig.shirt !== "" },
                { name: "Backpack", icon: "🎒", rarity: "special", active: previewConfig.accessory.includes("backpack") },
                { name: "Shoes", icon: "👟", rarity: "common", active: previewConfig.shoes !== "" },
                { name: "Glasses", icon: "👓", rarity: "common", active: previewConfig.accessory === "acc-nerd-glasses" },
                { name: "Watch", icon: "⌚", rarity: "common", active: true },
                { name: "Collar", icon: "📿", rarity: "common", active: false },
                { name: "Pet", icon: "🦉", rarity: "special", active: previewConfig.pet !== "" }
              ].map((slot, idx) => {
                const borderClass = slot.active
                  ? slot.rarity === "special"
                    ? "border-[#FFD700] bg-[#FFD700]/5"
                    : "border-[#3B6DE8] bg-[#3B6DE8]/5"
                  : "border-[#1E2D5A] bg-[#1A2240]/40";
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center ${borderClass} relative`}
                    title={slot.name}
                  >
                    <span className="text-xl">{slot.icon}</span>
                    {slot.active && (
                      <span className={`absolute top-1 right-1.5 size-1.5 rounded-full ${slot.rarity === "special" ? "bg-[#FFD700]" : "bg-[#3B6DE8]"} animate-pulse`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel COLECCIONES EDUCATIVAS */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1E2D5A] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">COLECCIONES EDUCATIVAS</h3>
              <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer">Ver todas</button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: "Ciencias", progress: "12/24", emoji: "🧪", color: "#00FF88" },
                { name: "Historia", progress: "8/20", emoji: "📜", color: "#FF8C42" },
                { name: "Matemáticas", progress: "10/22", emoji: "π", color: "#4A9EFF" },
                { name: "Literatura", progress: "9/18", emoji: "📚", color: "#7FFF7F" },
                { name: "Tecnología", progress: "11/23", emoji: "💻", color: "#C07AFF" },
                { name: "Arte", progress: "7/16", emoji: "🎨", color: "#FFB347" }
              ].map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-xl border p-2 text-center flex flex-col items-center justify-between bg-[#1A2240]/40"
                  style={{ borderColor: `${sub.color}25` }}
                >
                  <span className="text-xs font-bold block truncate leading-none mb-1 text-slate-300">{sub.name}</span>
                  <span className="text-2xl my-1.5 select-none">{sub.emoji}</span>
                  <span className="text-[10px] font-bold leading-none font-mono" style={{ color: sub.color }}>{sub.progress}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel NIVEL DE PRESTIGIO */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-[#1E2D5A] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">🥇</span>
                <div>
                  <span className="text-[9px] tracking-wider text-slate-400 uppercase font-bold leading-none block mb-0.5">NIVEL DE PRESTIGIO</span>
                  <h4 className="text-xs font-bold text-white">Estudiante Destacado</h4>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300">Nivel 8</span>
            </div>

            {/* Progression bar */}
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-[#1A2240] border border-[#1E2D5A] rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-[#3B6DE8] to-[#8B3DE8] rounded-full" style={{ width: "35%" }} />
              </div>
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-slate-300 font-mono shrink-0">530 / 1500 XP</span>
            </div>

            {/* BENEFICIOS ACTIVOS */}
            <div className="mt-3.5 border-t border-[#1E2D5A] pt-3">
              <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase block mb-2">BENEFICIOS ACTIVOS</span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  "+10% XP en quizzes",
                  "Acceso a artículos",
                  "Descuento del 5%"
                ].map((ben, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2 bg-[#1A2240]/40 p-2 rounded-xl border border-[#1E2D5A]">
                    <div className="size-3.5 rounded-full bg-[#00CC66] flex items-center justify-center text-[8px] text-white font-black shrink-0">
                      ✓
                    </div>
                    <span className="text-[10px] font-bold text-[#B0BEDD] leading-tight text-left truncate">{ben}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* 3. NAV BAR (BOTTOM) */}
      <footer className="sticky bottom-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-t border-[#1E2D5A] px-6 py-2.5 flex items-center justify-center gap-6">
        {[
          { label: "Inicio", icon: "🏠", active: false },
          { label: "Biblioteca", icon: "📚", active: false },
          { label: "Prep", icon: "✏️", active: false },
          { label: "Juegos", icon: "🎮", active: true },
          { label: "Perfil", icon: "👤", active: false }
        ].map((tab, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center justify-center px-6 py-1.5 rounded-2xl cursor-pointer transition ${
              tab.active
                ? "bg-[#3B6DE8] text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-xl mb-1 select-none">{tab.icon}</span>
            <span className="text-xs font-bold leading-none">{tab.label}</span>
          </button>
        ))}
      </footer>

    </div>
  );
}
