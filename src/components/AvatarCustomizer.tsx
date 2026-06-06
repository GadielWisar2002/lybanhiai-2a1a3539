import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RobloxAvatarRenderer } from "./RobloxAvatarRenderer";
import { getDashboard } from "@/lib/quiz.functions";
import { saveAvatarConfig } from "@/lib/avatar.functions";

// High-quality chibi/anime character preview images
const AVATAR_MALE_IMG = "/avatars/avatar-male.png";
const AVATAR_FEMALE_IMG = "/avatars/avatar-female.png";

interface AvatarCustomizerProps {
  onClose?: () => void;
  inline?: boolean;
}

const CATEGORIES = [
  {
    id: "cabello",
    label: "Cabello",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M12 2C6.5 2 4 6 4 11c0 3.5 2 5.5 3 6.5M12 2c5.5 0 8 4 8 9 0 3.5-2 5.5-3 6.5" />
        <path d="M10 12c-2-1.5-3-4-3-6M14 12c2-1.5 3-4 3-6" />
        <path d="M12 6v6" />
      </svg>
    ),
  },
  {
    id: "color_cabello",
    label: "Color de cabello",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18" fill={color} fillOpacity="0.2" />
        <circle cx="9.5" cy="9.5" r="1.5" fill={color} />
        <circle cx="14.5" cy="14.5" r="1.5" fill={color} />
        <circle cx="14.5" cy="9.5" r="1" fill={color} />
        <circle cx="9.5" cy="14.5" r="1" fill={color} />
      </svg>
    ),
  },
  {
    id: "rostro",
    label: "Rostro",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M18 10a6 6 0 0 1-12 0c0-4 3-7 6-7s6 3 6 7z" />
        <path d="M12 13v2" />
        <path d="M10 17h4" />
      </svg>
    ),
  },
  {
    id: "ojos",
    label: "Ojos",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="13" cy="11" r="1" fill={color} />
      </svg>
    ),
  },
  {
    id: "cejas",
    label: "Cejas",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M3 10c1.5-2.5 5.5-2.5 7.5-.5M13.5 9.5c2-2 6-2 7.5.5" />
      </svg>
    ),
  },
  {
    id: "boca",
    label: "Boca",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M5 11c3.5 4.5 10.5 4.5 14 0" />
        <path d="M7 11.5c2 2 8 2 10 0" />
      </svg>
    ),
  },
  {
    id: "piel",
    label: "Piel",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <rect x="3" y="10" width="18" height="11" rx="2" />
        <path d="M12 2a4 4 0 0 0-4 4v4h8V6a4 4 0 0 0-4-4z" />
      </svg>
    ),
  },
  {
    id: "ropa",
    label: "Ropa",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M20.38 3.46L16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2L3.62 3.46a2 2 0 0 0-2.42.88l-1 1.73a2 2 0 0 0 .58 2.51L5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9l4.22-2.42a2 2 0 0 0 .58-2.51l-1-1.73a2 2 0 0 0-2.42-.88z" />
      </svg>
    ),
  },
  {
    id: "pantalones",
    label: "Pantalones",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M6 2h12v9l-2.5 11h-3v-7h-1v7h-3L6 11V2z" />
      </svg>
    ),
  },
  {
    id: "zapatos",
    label: "Zapatos",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M4 16v-1a3 3 0 0 1 3-3h3l7 1.5 3 2.5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M12 12v3" />
      </svg>
    ),
  },
  {
    id: "accesorios",
    label: "Accesorios",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="12" r="3" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
  },
  {
    id: "mochilas",
    label: "Mochilas",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <rect x="5" y="8" width="14" height="12" rx="2" />
        <path d="M9 8V5a3 3 0 0 1 6 0v3" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: "mascotas",
    label: "Mascotas",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M12 14c-2.2 0-4-1.8-4-4 0-1.5 1.5-3 4-3s4 1.5 4 3c0 2.2-1.8 4-4 4z" />
        <circle cx="8" cy="6" r="1.5" />
        <circle cx="16" cy="6" r="1.5" />
      </svg>
    ),
  },
  {
    id: "efectos",
    label: "Efectos",
    icon: (color: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
        <path d="M12 2v4M12 18v4M4 12h4M16 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" />
      </svg>
    ),
  },
];

const HAIR_CUTS = [
  { id: "hair-straight", name: "Pelo liso" },
  { id: "hair-short", name: "Corte clásico" },
  { id: "hair-wavy", name: "Ondas suaves" },
  { id: "hair-bangs", name: "Flequillo" },
  { id: "hair-mohawk", name: "Mohawk" },
  { id: "hair-afro", name: "Afro" },
  { id: "hair-pigtails", name: "Cola alta" },
  { id: "hair-braids", name: "Trenzas" },
];

const HAIR_COLORS = [
  { name: "Castaño Extra Oscuro", hex: "#1A0800" },
  { name: "Café Oscuro", hex: "#3B1F0A" },
  { name: "Café Rojizo", hex: "#6B3A2A" },
  { name: "Marrón Medio", hex: "#8B5E3C" },
  { name: "Marrón Claro", hex: "#C4843A" },
  { name: "Rubio Oscuro", hex: "#D4A56A" },
  { name: "Rubio Dorado", hex: "#F5C842" },
  { name: "Cobrizo", hex: "#D4601A" },
  { name: "Rojo Fuego", hex: "#8B1A1A" },
  { name: "Morado Oscuro", hex: "#6B1A8B" },
  { name: "Lila Eléctrico", hex: "#B23BDC" },
  { name: "Rosa Magenta", hex: "#DC3B8E" },
  { name: "Azul Cobalto", hex: "#3B6DE8" },
  { name: "Turquesa", hex: "#3BBCDC" },
  { name: "Esmeralda", hex: "#3BDC8E" },
  { name: "Verde Bosque", hex: "#1A8B3B" },
  { name: "Verde Lima", hex: "#4AE83B" },
  { name: "Blanco Platino", hex: "#F5F5F5" },
  { name: "Gradiente Arcoíris", hex: "linear-gradient(135deg, #FF0000, #FFFF00, #00FF00, #0000FF, #8B00FF)" },
  { name: "Rubio Platinum", hex: "linear-gradient(135deg, #D1D5DB, #F3F4F6, #9CA3AF)" },
  { name: "Negro Azabache", hex: "linear-gradient(135deg, #09090B, #27272A, #09090B)" },
];

const FACES = [
  { id: "face-happy", name: "Feliz", icon: "😊" },
  { id: "face-studying", name: "Estudiante", icon: "🤓" },
  { id: "face-excited", name: "Entusiasmado", icon: "🤩" },
  { id: "face-cool", name: "Seguro", icon: "😎" },
];

const SKIN_TONES = [
  { hex: "#FDDBB4", label: "Muy claro" },
  { hex: "#E8A87C", label: "Claro" },
  { hex: "#C68642", label: "Intermedio" },
  { hex: "#8D5524", label: "Oscuro" },
  { hex: "#4A2912", label: "Muy oscuro" },
];

const BODY_TYPES = [
  { id: "delgado", label: "Esbelto", icon: "🧍" },
  { id: "normal", label: "Normal", icon: "🧍‍♂️" },
  { id: "atletico", label: "Atlético", icon: "🏋️" },
  { id: "robusto", label: "Robusto", icon: "🧎" },
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

  // Configuration States
  const [activeCategory, setActiveCategory] = useState<string>("cabello");
  const [hairSubtab, setHairSubtab] = useState<"cortes" | "colores">("cortes");
  const [previewConfig, setPreviewConfig] = useState({
    skinColor: "#E8A87C",
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
    viewMode: "body" as "body" | "clothes" | "animation" | "expressions",
  });

  const [probarTodo, setProbarTodo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Sync initial configuration from backend profile
  useEffect(() => {
    if (profile?.avatar_config && Object.keys(profile.avatar_config).length > 0) {
      const config = profile.avatar_config as any;
      setPreviewConfig((prev) => ({
        ...prev,
        skinColor: config.skinColor || "#E8A87C",
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

  // Gender Dynamic Accent Color
  const activeColor = previewConfig.gender === "boy" ? "#3B6DE8" : "#E83B8E";
  const activeShadow = previewConfig.gender === "boy" ? "0 0 12px #3B6DE880" : "0 0 12px #E83B8E80";

  const handleGenderChange = (gender: "boy" | "girl") => {
    setPreviewConfig((prev) => ({
      ...prev,
      gender,
      shirt: gender === "boy" ? "shirt-academic-jacket" : "shirt-basic-hoodie",
      pants: gender === "boy" ? "pants-basic-jeans" : "pants-basic-skirt",
      hairStyle: gender === "boy" ? "hair-short" : "hair-wavy",
    }));
  };

  const handleRandomize = () => {
    const randomHair = HAIR_CUTS[Math.floor(Math.random() * HAIR_CUTS.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomBody = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].id;
    const randomFace = FACES[Math.floor(Math.random() * FACES.length)].id;

    const shirts = ["shirt-academic-jacket", "shirt-basic-hoodie", "shirt-basic-tee", "shirt-lab-coat"];
    const pants = ["pants-basic-jeans", "pants-basic-skirt"];
    const accessories = ["", "acc-legendary-mortarboard", "acc-knowledge-crown", "acc-headphones", "acc-nerd-glasses"];
    const auras = ["", "aura-golden", "aura-math"];
    const pets = ["", "owl"];

    setPreviewConfig((prev) => ({
      ...prev,
      hairStyle: randomHair,
      hairColor: randomHairColor,
      skinColor: randomSkin,
      bodyType: randomBody,
      face: randomFace,
      shirt: shirts[Math.floor(Math.random() * shirts.length)],
      pants: pants[Math.floor(Math.random() * pants.length)],
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      aura: auras[Math.floor(Math.random() * auras.length)],
      pet: pets[Math.floor(Math.random() * pets.length)],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAvatar({ data: { config: previewConfig } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });

      // Trigger 3s custom toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080D24] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <p className="font-bold text-sm tracking-wide font-['Rajdhani'] text-cyan-400">Preparando armario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#080D24] text-white font-['Rajdhani',_sans-serif] flex flex-col overflow-x-hidden relative">
      
      {/* 1. HEADER (64px, fondo: #0D1535, borde inferior: 1px solid #1E2D5A) */}
      <header className="h-[64px] bg-[#0D1535] border-b border-[#1E2D5A] px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-[16px] text-[#8896B3] hover:text-white font-bold transition flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
          >
            ← Atrás
          </button>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[20px] leading-none text-white m-0">Personalizar Avatar</h1>
              <span className="text-[11px] bg-[#3B6DE8] text-white px-2 py-0.5 rounded font-black tracking-wider leading-none">3D</span>
            </div>
            <p className="text-[12px] text-[#8896B3] m-0 leading-none">
              Crea tu estilo, expresa tu identidad y demuestra tu conocimiento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-['Exo_2',_sans-serif]">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🏆</span>
            <span className="font-bold text-white text-sm">{totalXp} XP</span>
          </div>
          <div className="w-px h-4 bg-[#1E2D5A]" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎓</span>
            <span className="font-bold text-white text-sm">{sombreritos} Sombreritos</span>
          </div>
        </div>
      </header>

      {/* 2. BODY GRID (3 Columnas — [220px] [1fr] [360px] — gap: 16px, padding: 16px) */}
      <main className="grid grid-cols-[220px_1fr_360px] gap-4 p-4 flex-1 min-h-0 w-full max-w-[1440px] mx-auto select-none">
        
        {/* COLUMNA IZQUIERDA (220px) */}
        <section className="bg-[#0D1535] rounded-xl p-4 flex flex-col gap-4 overflow-hidden border border-[#1E2D5A]/40">
          
          {/* SECCIÓN GÉNERO — Character Cards */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[10px] letter-spacing-[2px] text-[#8896B3] font-bold">ELIGE TU PERSONAJE</span>
            <div className="flex gap-2">
              {/* Male Character Card */}
              <button
                onClick={() => handleGenderChange("boy")}
                className="relative flex-1 rounded-xl cursor-pointer transition-all duration-300 border-2 overflow-hidden group"
                style={{
                  borderColor: previewConfig.gender === "boy" ? "#3B6DE8" : "#1E2D5A",
                  boxShadow: previewConfig.gender === "boy" ? "0 0 20px #3B6DE860, inset 0 0 30px #3B6DE815" : "none",
                  background: previewConfig.gender === "boy" 
                    ? "linear-gradient(180deg, #0D1A3A 0%, #1A2D5E 100%)" 
                    : "#1A2240",
                }}
              >
                <div className="flex flex-col items-center py-2 px-1">
                  <img 
                    src={AVATAR_MALE_IMG} 
                    alt="Personaje Masculino" 
                    className="w-[60px] h-[60px] object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                    style={{ filter: previewConfig.gender === "boy" ? "none" : "grayscale(0.4) brightness(0.7)" }}
                  />
                  <span className="text-[11px] font-bold mt-1" style={{ color: previewConfig.gender === "boy" ? "#FFFFFF" : "#8896B3" }}>♂ Chico</span>
                </div>
                {previewConfig.gender === "boy" && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B6DE8] shadow-[0_0_6px_#3B6DE8]" />
                )}
              </button>

              {/* Female Character Card */}
              <button
                onClick={() => handleGenderChange("girl")}
                className="relative flex-1 rounded-xl cursor-pointer transition-all duration-300 border-2 overflow-hidden group"
                style={{
                  borderColor: previewConfig.gender === "girl" ? "#E83B8E" : "#1E2D5A",
                  boxShadow: previewConfig.gender === "girl" ? "0 0 20px #E83B8E60, inset 0 0 30px #E83B8E15" : "none",
                  background: previewConfig.gender === "girl" 
                    ? "linear-gradient(180deg, #2A0D25 0%, #3A1535 100%)" 
                    : "#1A2240",
                }}
              >
                <div className="flex flex-col items-center py-2 px-1">
                  <img 
                    src={AVATAR_FEMALE_IMG} 
                    alt="Personaje Femenino" 
                    className="w-[60px] h-[60px] object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
                    style={{ filter: previewConfig.gender === "girl" ? "none" : "grayscale(0.4) brightness(0.7)" }}
                  />
                  <span className="text-[11px] font-bold mt-1" style={{ color: previewConfig.gender === "girl" ? "#FFFFFF" : "#8896B3" }}>♀ Chica</span>
                </div>
                {previewConfig.gender === "girl" && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E83B8E] shadow-[0_0_6px_#E83B8E]" />
                )}
              </button>
            </div>
          </div>

          {/* LISTA DE CATEGORÍAS */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-2.5 padding-[10px_12px] rounded-lg cursor-pointer text-[13px] transition duration-150 py-2.5 px-3"
                  style={{
                    backgroundColor: isSelected ? "#1E3A8A" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#8896B3",
                    borderLeft: isSelected ? `3px solid ${activeColor}` : "none",
                    paddingLeft: isSelected ? "9px" : "12px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#1A2240";
                      e.currentTarget.style.color = "#B0BEDD";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#8896B3";
                    }
                  }}
                >
                  {cat.icon(isSelected ? "#FFFFFF" : "#8896B3")}
                  <span className="font-semibold">{cat.label}</span>
                </div>
              );
            })}
          </div>

          {/* BOTÓN GUARDAR AVATAR */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-[44px] bg-[#1E3A8A] hover:bg-[#2D5BE3] text-white font-semibold rounded-lg border border-[#3B6DE8] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 mt-auto shrink-0 shadow-lg active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Guardar avatar</span>
          </button>
        </section>

        {/* COLUMNA CENTRAL (flex: 1) */}
        <section className="flex flex-col gap-4 overflow-hidden">
          
          {/* PANEL DE OPCIONES */}
          <div className="bg-[#0D1535] rounded-xl p-5 border border-[#1E2D5A]/40 shrink-0 min-h-[220px] flex flex-col justify-between">
            <div className="w-full">
              
              {/* CATEGORÍA: CABELLO */}
              {activeCategory === "cabello" && (
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase m-0">CABELLO</h3>
                    <div className="bg-[#1A2240] rounded-[20px] p-[3px] display inline-flex border border-[#1D2B52]">
                      <button
                        onClick={() => setHairSubtab("cortes")}
                        className="px-5 py-1.5 rounded-[17px] text-[13px] font-semibold border-none cursor-pointer transition"
                        style={{
                          backgroundColor: hairSubtab === "cortes" ? "#FFFFFF" : "transparent",
                          color: hairSubtab === "cortes" ? "#080D24" : "#8896B3",
                        }}
                      >
                        Cortes
                      </button>
                      <button
                        onClick={() => setHairSubtab("colores")}
                        className="px-5 py-1.5 rounded-[17px] text-[13px] font-semibold border-none cursor-pointer transition"
                        style={{
                          backgroundColor: hairSubtab === "colores" ? "#FFFFFF" : "transparent",
                          color: hairSubtab === "colores" ? "#080D24" : "#8896B3",
                        }}
                      >
                        Colores
                      </button>
                    </div>
                  </div>

                  {hairSubtab === "cortes" ? (
                    <div className="grid grid-cols-4 gap-2 max-h-[130px] overflow-y-auto pr-1 scrollbar-thin">
                      {HAIR_CUTS.map((cut) => {
                        const isSel = previewConfig.hairStyle === cut.id;
                        return (
                          <div
                            key={cut.id}
                            onClick={() => setPreviewConfig((prev) => ({ ...prev, hairStyle: cut.id }))}
                            className="bg-[#1A2240] hover:bg-[#243060] rounded-lg p-2.5 text-center cursor-pointer transition select-none flex flex-col items-center border-2"
                            style={{
                              borderColor: isSel ? activeColor : "transparent",
                              backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                            }}
                          >
                            <div className="w-[50px] h-[50px] flex items-center justify-center scale-90">
                              <svg viewBox="0 0 60 60" className="w-12 h-12">
                                <circle cx="30" cy="30" r="14" fill={previewConfig.skinColor} />
                                <path
                                  d="M 18,30 C 18,14 42,14 42,30 C 38,28 34,26 30,26 C 26,26 22,28 18,30 Z"
                                  fill={previewConfig.hairColor}
                                />
                                {cut.id === "hair-pigtails" && (
                                  <g fill={previewConfig.hairColor}>
                                    <circle cx="14" cy="22" r="6" />
                                    <circle cx="46" cy="22" r="6" />
                                  </g>
                                )}
                                {cut.id === "hair-braids" && (
                                  <g fill={previewConfig.hairColor}>
                                    <path d="M 14,30 L 10,48 L 18,48 Z" />
                                    <path d="M 46,30 L 50,48 L 42,48 Z" />
                                  </g>
                                )}
                                {cut.id === "hair-mohawk" && (
                                  <path d="M 27,16 Q 30,2 33,16 L 31,26 L 29,26 Z" fill={previewConfig.hairColor} />
                                )}
                                {cut.id === "hair-afro" && (
                                  <circle cx="30" cy="25" r="18" fill={previewConfig.hairColor} opacity="0.8" />
                                )}
                              </svg>
                            </div>
                            <span className="text-[11px] text-[#8896B3] mt-1.5 font-semibold truncate w-full">{cut.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] letter-spacing-[1.5px] text-[#8896B3] block uppercase font-bold">COLOR DE CABELLO</span>
                      <div className="grid grid-cols-9 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                        {HAIR_COLORS.map((col) => {
                          const isSel = previewConfig.hairColor === col.hex;
                          return (
                            <button
                              key={col.name}
                              onClick={() => setPreviewConfig((prev) => ({ ...prev, hairColor: col.hex }))}
                              className="w-[28px] h-[28px] rounded-full border-none cursor-pointer transition hover:scale-115 relative flex items-center justify-center"
                              style={{
                                background: col.hex,
                                border: isSel ? "3px solid #FFFFFF" : "1px solid #1E2D5A",
                                boxShadow: isSel ? "0 0 8px #FFFFFF" : "none",
                              }}
                              title={col.name}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CATEGORÍA: COLOR DE CABELLO */}
              {activeCategory === "color_cabello" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">COLOR DE CABELLO</h3>
                  <div className="grid grid-cols-9 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                    {HAIR_COLORS.map((col) => {
                      const isSel = previewConfig.hairColor === col.hex;
                      return (
                        <button
                          key={col.name}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, hairColor: col.hex }))}
                          className="w-[28px] h-[28px] rounded-full border-none cursor-pointer transition hover:scale-115"
                          style={{
                            background: col.hex,
                            border: isSel ? "3px solid #FFFFFF" : "1px solid #1E2D5A",
                            boxShadow: isSel ? "0 0 8px #FFFFFF" : "none",
                          }}
                          title={col.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: ROSTRO */}
              {activeCategory === "rostro" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">ROSTRO</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {FACES.map((face) => {
                      const isSel = previewConfig.face === face.id;
                      return (
                        <div
                          key={face.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, face: face.id }))}
                          className="w-[52px] h-[52px] rounded-full bg-[#1A2240] hover:bg-[#243060] cursor-pointer transition flex items-center justify-center text-2xl border-2 mx-auto"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                          }}
                        >
                          {face.icon}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: OJOS */}
              {activeCategory === "ojos" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">OJOS</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {["#3B6DE8", "#10B981", "#8B5CF6", "#78350F"].map((eyeCol, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewConfig((prev) => ({ ...prev, face: "face-happy" }))}
                        className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-3 text-center cursor-pointer transition border"
                        style={{ borderColor: idx === 0 ? activeColor : "transparent" }}
                      >
                        <div className="w-8 h-8 rounded-full border border-slate-700 mx-auto flex items-center justify-center" style={{ background: eyeCol }}>
                          <div className="w-3 h-3 bg-black rounded-full relative">
                            <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: CEJAS */}
              {activeCategory === "cejas" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">CEJAS</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["Clásicas", "Arqueadas", "Espesas"].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {}}
                        className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-4 text-center cursor-pointer transition font-semibold text-xs border"
                        style={{ borderColor: idx === 0 ? activeColor : "transparent" }}
                      >
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: BOCA */}
              {activeCategory === "boca" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">BOCA</h3>
                  <div className="grid grid-cols-4 gap-2.5">
                    {FACES.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setPreviewConfig((prev) => ({ ...prev, face: f.id }))}
                        className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-3 text-center cursor-pointer transition border"
                        style={{ borderColor: previewConfig.face === f.id ? activeColor : "transparent" }}
                      >
                        <span className="text-xl">{f.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: PIEL */}
              {activeCategory === "piel" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] letter-spacing-[1.5px] text-[#8896B3] block uppercase font-bold mb-2">TONO DE PIEL</span>
                    <div className="flex gap-3">
                      {SKIN_TONES.map((skin) => {
                        const isSel = previewConfig.skinColor === skin.hex;
                        return (
                          <button
                            key={skin.hex}
                            onClick={() => setPreviewConfig((prev) => ({ ...prev, skinColor: skin.hex }))}
                            className="w-[32px] h-[32px] rounded-full border-none cursor-pointer transition hover:scale-105 relative"
                            style={{
                              backgroundColor: skin.hex,
                              border: isSel ? "3px solid #FFFFFF" : "1px solid #1E2D5A",
                            }}
                            title={skin.label}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] letter-spacing-[1.5px] text-[#8896B3] block uppercase font-bold mb-2">CUERPO</span>
                    <div className="flex gap-3">
                      {BODY_TYPES.map((body) => {
                        const isSel = previewConfig.bodyType === body.id;
                        return (
                          <div
                            key={body.id}
                            onClick={() => setPreviewConfig((prev) => ({ ...prev, bodyType: body.id }))}
                            className="flex-1 max-w-[56px] h-[72px] bg-[#1A2240] hover:bg-[#1A2B5A] rounded-lg cursor-pointer transition border flex flex-col items-center justify-center p-1.5"
                            style={{
                              borderColor: isSel ? activeColor : "transparent",
                            }}
                          >
                            <span className="text-xl text-white">{body.icon}</span>
                            <span className="text-[10px] font-semibold text-[#8896B3] mt-1">{body.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORÍA: ROPA */}
              {activeCategory === "ropa" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">ROPA SUPERIOR</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "shirt-academic-jacket", name: "Varsity", label: "🏫" },
                      { id: "shirt-basic-hoodie", name: "Hoodie", label: "🧥" },
                      { id: "shirt-basic-tee", name: "Tee", label: "👕" },
                      { id: "shirt-lab-coat", name: "Bata", label: "🥼" },
                    ].map((item) => {
                      const isSel = previewConfig.shirt === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, shirt: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-3 text-center cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                          }}
                        >
                          <span className="text-xl block mb-1">{item.label}</span>
                          <span className="text-[11px] font-bold text-slate-300 leading-none">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: PANTALONES */}
              {activeCategory === "pantalones" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">ROPA INFERIOR</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "pants-basic-jeans", name: "Jeans cargo", icon: "👖" },
                      { id: "pants-basic-skirt", name: "Falda tableada", icon: "👗" },
                    ].map((item) => {
                      const isSel = previewConfig.pants === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, pants: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
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

              {/* CATEGORÍA: ZAPATOS */}
              {activeCategory === "zapatos" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">ZAPATOS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "shoes-basic-shoes", name: "Zapatillas Altas", icon: "👟" },
                    ].map((item) => {
                      const isSel = previewConfig.shoes === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, shoes: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
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

              {/* CATEGORÍA: ACCESORIOS */}
              {activeCategory === "accesorios" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">ACCESORIOS</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "", name: "Ninguno", label: "❌" },
                      { id: "acc-legendary-mortarboard", name: "Birrete", label: "🎓" },
                      { id: "acc-knowledge-crown", name: "Corona", label: "👑" },
                      { id: "acc-headphones", name: "Cascos", label: "🎧" },
                      { id: "acc-nerd-glasses", name: "Gafas", label: "👓" },
                    ].map((item) => {
                      const isSel = previewConfig.accessory === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, accessory: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-2.5 text-center cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                          }}
                        >
                          <span className="text-xl block mb-1">{item.label}</span>
                          <span className="text-[10px] font-bold text-slate-300 leading-none">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: MOCHILAS */}
              {activeCategory === "mochilas" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">MOCHILAS</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "", name: "Sin mochila", label: "❌" },
                      { id: "acc-school-backpack", name: "Escolar", label: "🎒" },
                      { id: "acc-science-backpack", name: "Científica", label: "🎒" },
                    ].map((item) => {
                      const isSel = previewConfig.accessory === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, accessory: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-2.5 text-center cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                          }}
                        >
                          <span className="text-xl block mb-1">{item.label}</span>
                          <span className="text-[10px] font-bold text-slate-300 leading-none">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: MASCOTAS */}
              {activeCategory === "mascotas" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">MASCOTAS</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "", name: "Ninguno", label: "❌" },
                      { id: "owl", name: "Búho", label: "🦉" },
                    ].map((item) => {
                      const isSel = previewConfig.pet === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, pet: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-2.5 text-center cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                          }}
                        >
                          <span className="text-xl block mb-1">{item.label}</span>
                          <span className="text-[10px] font-bold text-slate-300 leading-none">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CATEGORÍA: EFECTOS */}
              {activeCategory === "efectos" && (
                <div>
                  <h3 className="text-[13px] letter-spacing-[2px] text-white font-bold uppercase mb-3">EFECTOS</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "", name: "Ninguno", label: "❌" },
                      { id: "aura-golden", name: "Estrellas", label: "✨" },
                      { id: "aura-math", name: "Fórmulas", label: "📐" },
                    ].map((item) => {
                      const isSel = previewConfig.aura === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setPreviewConfig((prev) => ({ ...prev, aura: item.id }))}
                          className="bg-[#1A2240] hover:bg-[#243060] rounded-xl p-2.5 text-center cursor-pointer transition border"
                          style={{
                            borderColor: isSel ? activeColor : "transparent",
                            backgroundColor: isSel ? "#1A2B5A" : "#1A2240",
                          }}
                        >
                          <span className="text-xl block mb-1">{item.label}</span>
                          <span className="text-[10px] font-bold text-slate-300 leading-none">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN ALEATORIO */}
            <button
              onClick={handleRandomize}
              className="w-full mt-4 h-10 border border-dashed border-[#2D3F6B] hover:border-[#3B6DE8] bg-transparent text-[#8896B3] hover:text-[#B0BEDD] rounded-lg font-semibold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span>Aleatorio</span>
            </button>
          </div>

          {/* VISTA PREVIA 360° */}
          <div className="bg-[#080D1E] rounded-xl p-4 flex-1 flex flex-col justify-between relative overflow-hidden border border-[#1E2D5A]/40 min-h-[460px]">
            
            {/* LABELS */}
            <div className="absolute top-4 left-4 z-20">
              <span className="text-[10px] letter-spacing-[2px] text-white font-bold block">VISTA PREVIA 360°</span>
              <span className="text-[10px] text-[#8896B3]">Arrastra para rotar</span>
            </div>

            {/* CHARACTER REFERENCE IMAGE — Floating in top-right corner */}
            <div className="absolute top-3 right-3 z-20">
              <div 
                className="relative w-[80px] h-[80px] rounded-xl overflow-hidden border-2 transition-all duration-500"
                style={{
                  borderColor: previewConfig.gender === "boy" ? "#3B6DE840" : "#E83B8E40",
                  boxShadow: `0 4px 20px ${previewConfig.gender === "boy" ? "#3B6DE830" : "#E83B8E30"}`,
                  background: "linear-gradient(135deg, #0D153580, #1A224080)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <img 
                  src={previewConfig.gender === "boy" ? AVATAR_MALE_IMG : AVATAR_FEMALE_IMG} 
                  alt={previewConfig.gender === "boy" ? "Referencia Masculino" : "Referencia Femenino"}
                  className="w-full h-full object-contain transition-all duration-500"
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[8px] font-bold tracking-wider"
                  style={{ 
                    background: previewConfig.gender === "boy" 
                      ? "linear-gradient(0deg, #3B6DE8CC, transparent)" 
                      : "linear-gradient(0deg, #E83B8ECC, transparent)",
                    color: "#FFFFFF",
                  }}
                >
                  {previewConfig.gender === "boy" ? "CHICO" : "CHICA"}
                </div>
              </div>
            </div>

            {/* CONTROLES DE ZOOM (Izquierda) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
              <button
                onClick={() => setPreviewConfig((prev) => ({ ...prev, zoom: Math.min(2.0, prev.zoom + 0.15) }))}
                className="w-9 h-9 bg-[#1A2240]/80 hover:bg-[#1A2240] border border-[#2D3F6B] rounded-lg text-white font-bold text-lg flex items-center justify-center cursor-pointer transition"
              >
                ⊕
              </button>
              <button
                onClick={() => setPreviewConfig((prev) => ({ ...prev, zoom: Math.max(0.6, prev.zoom - 0.15) }))}
                className="w-9 h-9 bg-[#1A2240]/80 hover:bg-[#1A2240] border border-[#2D3F6B] rounded-lg text-white font-bold text-lg flex items-center justify-center cursor-pointer transition"
              >
                ⊖
              </button>
              <button
                onClick={() => setPreviewConfig((prev) => ({ ...prev, zoom: 1.0 }))}
                className="w-9 h-9 bg-[#1A2240]/80 hover:bg-[#1A2240] border border-[#2D3F6B] rounded-lg text-white font-bold text-lg flex items-center justify-center cursor-pointer transition"
              >
                ↺
              </button>
              <button
                onClick={() => setPreviewConfig((prev) => ({ ...prev, zoom: 1.25 }))}
                className="w-9 h-9 bg-[#1A2240]/80 hover:bg-[#1A2240] border border-[#2D3F6B] rounded-lg text-white font-bold text-lg flex items-center justify-center cursor-pointer transition"
              >
                ⊡
              </button>
            </div>

            {/* CANVAS DEL AVATAR */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden h-full max-h-[380px]">
              <RobloxAvatarRenderer config={previewConfig} autoRotate={false} />
            </div>

            {/* BARRA INFERIOR DE VISTA PREVIA */}
            <div className="flex items-center justify-between gap-4 mt-2 z-20 relative">
              <div className="flex gap-3">
                {[
                  { mode: "body", icon: "🧍" },
                  { mode: "clothes", icon: "👕" },
                  { mode: "animation", icon: "🏃" },
                  { mode: "expressions", icon: "😊" },
                ].map((btn) => (
                  <button
                    key={btn.mode}
                    onClick={() => setPreviewConfig((prev) => ({ ...prev, viewMode: btn.mode as any }))}
                    className="w-11 h-11 rounded-full border cursor-pointer flex items-center justify-center text-lg transition duration-200"
                    style={{
                      backgroundColor: previewConfig.viewMode === btn.mode ? activeColor : "#1A2240",
                      borderColor: previewConfig.viewMode === btn.mode ? "#FFFFFF" : "#2D3F6B",
                      color: "#FFFFFF",
                    }}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>

              {/* TOGGLE PROBAR TODO */}
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col text-right">
                  <span className="text-[12px] text-[#8896B3] font-semibold leading-none">Probar todo</span>
                  <span className="text-[10px] text-[#5A6A8A] mt-0.5 leading-none">Conjunto completo</span>
                </div>
                <div
                  onClick={() => setProbarTodo(!probarTodo)}
                  className="w-11 h-[24px] rounded-xl cursor-pointer p-[2px] transition duration-200 relative"
                  style={{ backgroundColor: probarTodo ? activeColor : "#2D3F6B" }}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full transition-all duration-200 absolute top-0.5"
                    style={{ left: probarTodo ? "22px" : "2px" }}
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* COLUMNA DERECHA (360px) */}
        <section className="flex flex-col gap-4 overflow-hidden">
          
          {/* PANEL EQUIPADO */}
          <div className="bg-[#0D1535] rounded-xl p-5 border border-[#1E2D5A]/40 shrink-0">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[13px] text-white font-bold tracking-wider uppercase m-0">EQUIPADO</h3>
              <button className="text-[12px] text-[#3B6DE8] bg-transparent border-none cursor-pointer font-semibold hover:text-[#2D5BE3] transition">
                ✏️ Editar look
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { name: "Birrete", icon: "🎓", active: previewConfig.accessory === "acc-legendary-mortarboard" },
                { name: "Camisa", icon: "🧥", active: previewConfig.shirt !== "" },
                { name: "Mochila", icon: "🎒", active: previewConfig.accessory === "acc-school-backpack" || previewConfig.accessory === "acc-science-backpack" },
                { name: "Zapatos", icon: "👟", active: previewConfig.shoes !== "" },
                { name: "Lentes", icon: "👓", active: previewConfig.accessory === "acc-nerd-glasses" },
                { name: "Reloj", icon: "⌚", active: true },
                { name: "Collar", icon: "📿", active: false },
                { name: "Mascota", icon: "🦉", active: previewConfig.pet !== "" },
              ].map((slot, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg border bg-[#1A2240] flex items-center justify-center text-2xl relative transition duration-150"
                  style={{
                    borderColor: slot.active ? activeColor : "#2D3F6B",
                    boxShadow: slot.active ? `0 0 8px ${activeColor}40` : "none",
                  }}
                  title={slot.name}
                >
                  <span>{slot.icon}</span>
                  {slot.active && (
                    <span
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PANEL COLECCIONES EDUCATIVAS */}
          <div className="bg-[#0D1535] rounded-xl p-5 border border-[#1E2D5A]/40 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] text-white font-bold tracking-wider uppercase m-0">COLECCIONES EDUCATIVAS</h3>
              <a href="#" className="text-[12px] text-[#3B6DE8] font-semibold hover:text-[#2D5BE3] transition no-underline">
                Ver todas
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Ciencias", progress: "12/24", icon: "🧪", color: "#00FF88" },
                { name: "Historia", progress: "8/20", icon: "📜", color: "#FF8C42" },
                { name: "Matemáticas", progress: "10/22", icon: "π", color: "#4A9EFF" },
                { name: "Literatura", progress: "9/18", icon: "📚", color: "#7FFF7F" },
                { name: "Tecnología", progress: "11/23", icon: "💻", color: "#C07AFF" },
                { name: "Arte", progress: "7/16", icon: "🎨", color: "#FFB347" },
              ].map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-[#1A2240] rounded-lg p-3 text-center flex flex-col items-center justify-between border"
                  style={{ borderColor: `${sub.color}30` }}
                >
                  <span className="text-[11px] text-white font-semibold mb-1 truncate w-full">{sub.name}</span>
                  <span className="text-xl my-1 select-none">{sub.icon}</span>
                  <span className="text-[12px] font-bold font-mono" style={{ color: sub.color }}>
                    {sub.progress}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL NIVEL Y STATS */}
          <div className="bg-[#0D1535] rounded-xl p-5 border border-[#1E2D5A]/40 flex-1 flex flex-col justify-between min-h-[220px]">
            
            {/* NIVEL DE PRESTIGIO */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A2240] border border-[#2D3F6B] flex items-center justify-center text-xl shrink-0">
                  🥇
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8896B3] font-bold letter-spacing-[1.5px]">NIVEL DE PRESTIGIO</span>
                    <span className="text-[11px] text-white font-semibold">Estudiante Destacado</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[20px] font-bold text-white leading-none">Nivel 8</span>
                    <span className="text-[11px] text-[#8896B3] font-mono leading-none">530 / 1500 XP</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-[#1A2240] rounded-full mt-3.5 relative overflow-visible flex items-center">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: "35%",
                    background: `linear-gradient(90deg, ${activeColor}, #8B3DE8)`,
                  }}
                />
                <span
                  className="absolute text-sm select-none"
                  style={{ left: "calc(35% - 4px)", top: "-5px" }}
                >
                  ⭐
                </span>
              </div>
            </div>

            <div className="h-px bg-[#1E2D5A] my-4 shrink-0" />

            {/* BENEFICIOS ACTIVOS */}
            <div>
              <h4 className="text-[9px] text-[#8896B3] font-bold letter-spacing-[1.5px] uppercase mt-0 mb-2.5">
                BENEFICIOS ACTIVOS
              </h4>
              <div className="space-y-2">
                {[
                  "+10% XP en quizzes",
                  "Acceso a artículos exclusivos",
                  "Descuento del 5% en la tienda",
                ].map((ben, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#00CC66] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      ✓
                    </div>
                    <span className="text-[12px] text-[#B0BEDD] font-medium leading-none">{ben}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#1E2D5A] my-4 shrink-0" />

            {/* TUS RECURSOS */}
            <div className="font-['Exo_2',_sans-serif]">
              <h4 className="text-[9px] text-[#8896B3] font-bold letter-spacing-[1.5px] uppercase mt-0 mb-2.5">
                TUS RECURSOS
              </h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">🏆</span>
                  <span className="text-[16px] font-bold text-white">{totalXp} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">🎓</span>
                  <div className="leading-none">
                    <span className="text-[16px] font-bold text-white">{sombreritos}</span>
                    <span className="text-[13px] text-[#8896B3] font-normal"> Sombreritos</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* TOAST CONFIRMACIÓN DE GUARDADO (fondo #00CC66, se muestra 3s, fixed bottom-right) */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#00CC66] text-white px-5 py-3.5 rounded-lg font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-center gap-2">
          <span>💾</span>
          <span>¡Avatar guardado! 🎉</span>
        </div>
      )}

    </div>
  );
}
