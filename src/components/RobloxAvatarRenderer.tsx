import React, { useState, useEffect } from "react";

interface Box3DProps {
  width: number;
  height: number;
  depth: number;
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  frontDecal?: React.ReactNode;
  backDecal?: React.ReactNode;
  leftDecal?: React.ReactNode;
  rightDecal?: React.ReactNode;
  topDecal?: React.ReactNode;
  bottomDecal?: React.ReactNode;
}

// Reusable 3D Box Component using real HTML5/CSS 3D Transforms
export function Box3D({
  width,
  height,
  depth,
  x = 0,
  y = 0,
  z = 0,
  color = "#cccccc",
  className = "",
  style = {},
  frontDecal,
  backDecal,
  leftDecal,
  rightDecal,
  topDecal,
  bottomDecal,
}: Box3DProps) {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    width: `${width}px`,
    height: `${height}px`,
    left: `calc(50% + ${x - halfW}px)`,
    top: `calc(50% + ${y - halfH}px)`,
    transform: `translate3d(0, 0, ${z}px)`,
    transformStyle: "preserve-3d",
    ...style,
  };

  const faceBase: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "visible",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  return (
    <div className={`box-3d select-none pointer-events-none ${className}`} style={boxStyle}>
      {/* FRONT (Z+) */}
      <div
        style={{
          ...faceBase,
          backgroundColor: color,
          transform: `rotateY(0deg) translate3d(0, 0, ${halfD}px)`,
          filter: "brightness(1.0)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.2)",
          border: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        {frontDecal}
      </div>
      {/* BACK (Z-) */}
      <div
        style={{
          ...faceBase,
          backgroundColor: color,
          transform: `rotateY(180deg) translate3d(0, 0, ${halfD}px)`,
          filter: "brightness(0.75)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.22)",
          border: "0.5px solid rgba(0,0,0,0.1)",
        }}
      >
        {backDecal}
      </div>
      {/* LEFT (X-) */}
      <div
        style={{
          ...faceBase,
          width: `${depth}px`,
          left: `calc(50% - ${halfD}px)`,
          backgroundColor: color,
          transform: `rotateY(-90deg) translate3d(0, 0, ${halfW}px)`,
          filter: "brightness(0.8)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.16)",
          border: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        {leftDecal}
      </div>
      {/* RIGHT (X+) */}
      <div
        style={{
          ...faceBase,
          width: `${depth}px`,
          left: `calc(50% - ${halfD}px)`,
          backgroundColor: color,
          transform: `rotateY(90deg) translate3d(0, 0, ${halfW}px)`,
          filter: "brightness(0.85)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.08)",
          border: "0.5px solid rgba(255,255,255,0.05)",
        }}
      >
        {rightDecal}
      </div>
      {/* TOP (Y-) */}
      <div
        style={{
          ...faceBase,
          height: `${depth}px`,
          top: `calc(50% - ${halfD}px)`,
          backgroundColor: color,
          transform: `rotateX(90deg) translate3d(0, 0, ${halfH}px)`,
          filter: "brightness(1.15)",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,0.28)",
          border: "0.5px solid rgba(255,255,255,0.12)",
        }}
      >
        {topDecal}
      </div>
      {/* BOTTOM (Y+) */}
      <div
        style={{
          ...faceBase,
          height: `${depth}px`,
          top: `calc(50% - ${halfD}px)`,
          backgroundColor: color,
          transform: `rotateX(-90deg) translate3d(0, 0, ${halfH}px)`,
          filter: "brightness(0.65)",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.26)",
          border: "0.5px solid rgba(0,0,0,0.16)",
        }}
      >
        {bottomDecal}
      </div>
    </div>
  );
}

interface AvatarConfig {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  hairHighlight: string;
  face: string;
  shirt: string;
  pants: string;
  shoes: string;
  accessory: string;
  pet: string;
  aura: string;
  outfit: string;
  gender?: string;
}

interface RobloxAvatarRendererProps {
  config: AvatarConfig | null;
  scale?: number;
  autoRotate?: boolean;
}

export function RobloxAvatarRenderer({
  config,
  scale = 1.0,
  autoRotate = false,
}: RobloxAvatarRendererProps) {
  const [yaw, setYaw] = useState(-30);
  const [pitch, setPitch] = useState(-10);
  const [isRotating, setIsRotating] = useState(autoRotate);

  // Active configurations or fallbacks
  const c = {
    skinColor: config?.skinColor || "skin-light-2",
    hairStyle: config?.hairStyle || "hair-wavy",
    hairColor: config?.hairColor || "color-brown-light",
    hairHighlight: config?.hairHighlight || "hl-none",
    face: config?.face || "face-happy",
    shirt: config?.shirt || "shirt-basic-tee",
    pants: config?.pants || "pants-basic-skirt",
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    pet: config?.pet || "",
    aura: config?.aura || "",
    outfit: config?.outfit || "",
    gender: config?.gender || "girl",
  };

  const isGirl = c.gender === "girl";

  // ==========================================
  // ADAPTIVE MODEL: SLIMMER AND HIGHER FIDELITY FEMININE PROPORTIONS
  // BUT robust 3D blocky structures to belong to the exact same universe!
  // ==========================================
  const torsoW = isGirl ? 48 : 58;
  const torsoH = isGirl ? 70 : 74;
  const torsoD = isGirl ? 24 : 28;

  const armW = isGirl ? 14 : 18;
  const armH = isGirl ? 68 : 72;
  const armD = isGirl ? 14 : 18;
  const armX = isGirl ? 32 : 39; // shoulder horizontal center offset

  const legW = isGirl ? 18 : 22;
  const legH = isGirl ? 68 : 72;
  const legD = isGirl ? 18 : 22;
  const legX = isGirl ? 11 : 14;

  const headW = isGirl ? 38 : 44;
  const headH = isGirl ? 38 : 44;
  const headD = isGirl ? 38 : 44;

  const headY = isGirl ? -55 : -60;
  const legY = isGirl ? 68 : 72;
  const skirtY = isGirl ? 41 : 43;
  const backpackZ = isGirl ? -22 : -24;
  const handY = isGirl ? 13 : 15;

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 1.2) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Skin hex colors
  const skinColors: Record<string, string> = {
    "skin-light-1": "#ffe5d9",
    "skin-light-2": "#fcd5b4",
    "skin-medium-1": "#e8b082",
    "skin-medium-2": "#bd8053",
    "skin-dark-1": "#754824",
  };
  const activeSkinHex = skinColors[c.skinColor] || skinColors["skin-light-2"];

  // Hair hex colors
  const hairColors: Record<string, string> = {
    "color-black": "#1c1917",
    "color-brown-light": "#78350f", // Chocolatecastaño
    "color-brown-dark": "#451a03",
    "color-blonde": "#ca8a04",
    "color-red": "#b91c1c",
    "color-gray": "#78716c",
    "color-white": "#fafaf9",
    "color-fantasy-pink": "#ec4899",
    "color-fantasy-blue": "#2563eb",
    "color-fantasy-purple": "#7c3aed",
  };
  const activeHairHex = hairColors[c.hairColor] || hairColors["color-brown-light"];

  // Highlight colors
  const highlightColors: Record<string, string> = {
    "hl-black-blue": "#3b82f6",
    "hl-brown-red": "#ef4444",
    "hl-blonde-pink": "#f472b6",
    "hl-custom-neon": "#10b981",
  };
  const highlightHex = highlightColors[c.hairHighlight] || "";

  // ----------------------------------------------------
  // Decals & Textures
  // ----------------------------------------------------

  // Face textures matching high-fidelity Roblox Modern / Lego (Expressive, Motivated, Clean sized)
  const renderFaceDecal = () => {
    if (isGirl) {
      // Distinctly elegant feminine facial features (eyelashes, blush, pink smiling lips)
      switch (c.face) {
        case "face-studying":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              {/* Focused thin motivated brows */}
              <path d="M22 25 Q32 31 38 27" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M78 25 Q68 31 62 27" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Focused eyes with double shiny highlights & eyelashes */}
              <ellipse cx="28" cy="42" rx="4.5" ry="6.5" fill="#0284c7" />
              <ellipse cx="72" cy="42" rx="4.5" ry="6.5" fill="#0284c7" />
              <circle cx="26.5" cy="39" r="1.5" fill="#fff" />
              <circle cx="70.5" cy="39" r="1.5" fill="#fff" />
              {/* Elegant feminine eyelashes */}
              <path d="M18 36 Q26 31 32 35" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              <path d="M82 36 Q74 31 68 35" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              {/* Rosy blush */}
              <circle cx="16" cy="56" r="4" fill="#f43f5e" opacity="0.45" />
              <circle cx="84" cy="56" r="4" fill="#f43f5e" opacity="0.45" />
              {/* Sleek round academic glasses frame */}
              <rect x="14" y="32" width="28" height="22" rx="6" stroke="#1f2937" strokeWidth="3.2" fill="none" />
              <rect x="58" y="32" width="28" height="22" rx="6" stroke="#1f2937" strokeWidth="3.2" fill="none" />
              <line x1="42" y1="42" x2="58" y2="42" stroke="#1f2937" strokeWidth="3.2" />
              {/* Polite focused mouth */}
              <path d="M42 66 Q50 71 58 66" stroke="#e11d48" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-excited":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              {/* Sparkling star eyes */}
              <polygon points="28,26 31,33 39,33 33,37 35,45 28,41 21,45 23,37 17,33 25,33" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="72,26 75,33 83,33 77,37 79,45 72,41 65,45 67,37 61,33 69,33" fill="#fbbf24" stroke="#1c1917" strokeWidth="1.2" />
              <circle cx="28" cy="33" r="1.5" fill="#fff" />
              <circle cx="72" cy="33" r="1.5" fill="#fff" />
              {/* Long eyelashes */}
              <path d="M15 32 L22 30" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
              <path d="M85 32 L78 30" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
              {/* Blushing */}
              <circle cx="16" cy="56" r="4.5" fill="#ec4899" opacity="0.55" />
              <circle cx="84" cy="56" r="4.5" fill="#ec4899" opacity="0.55" />
              {/* Open rosy smile */}
              <path d="M38 62 Q50 80 62 62 Z" fill="#e11d48" stroke="#991b1b" strokeWidth="1.5" />
              <path d="M42 63 Q50 67 58 63" fill="#fff" />
            </svg>
          );
        case "face-cool":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              {/* Black cool shades */}
              <polygon points="14,33 46,33 42,49 18,49" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <polygon points="54,33 86,33 82,49 58,49" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <line x1="46" y1="38" x2="54" y2="38" stroke="#0f172a" strokeWidth="3" />
              {/* Rosy blush */}
              <circle cx="16" cy="55" r="4" fill="#f43f5e" opacity="0.45" />
              <circle cx="84" cy="55" r="4" fill="#f43f5e" opacity="0.45" />
              {/* Confident rosy smile */}
              <path d="M42 68 Q52 70 58 64" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-wink":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              {/* Left eye open with lashes */}
              <ellipse cx="28" cy="42" rx="4.5" ry="6.5" fill="#1c1917" />
              <circle cx="26.5" cy="39" r="1.5" fill="#fff" />
              <path d="M19 36 Q26 31 32 35" stroke="#1c1917" strokeWidth="2" fill="none" />
              {/* Right eye winking */}
              <path d="M60 41 Q70 47 80 41" stroke="#1c1917" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              {/* Rosy blush */}
              <circle cx="16" cy="56" r="4" fill="#f43f5e" opacity="0.5" />
              <circle cx="84" cy="56" r="4" fill="#f43f5e" opacity="0.5" />
              {/* Smirk pink lips */}
              <path d="M42 66 Q50 71 58 66" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-curious":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <ellipse cx="28" cy="38" rx="4" ry="6" fill="#1c1917" />
              <ellipse cx="72" cy="38" rx="4" ry="6" fill="#1c1917" />
              <path d="M19 32 Q26 27 32 31" stroke="#1c1917" strokeWidth="2" fill="none" />
              <path d="M81 32 Q74 27 68 31" stroke="#1c1917" strokeWidth="2" fill="none" />
              {/* Asymmetrical curious brows */}
              <path d="M18 24 Q30 18 38 24" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              <path d="M78 28 Q68 26 62 30" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              <ellipse cx="50" cy="66" rx="4.5" ry="3" fill="#e11d48" />
            </svg>
          );
        case "face-happy":
        default:
          return (
            <svg className="w-full h-full p-2.5" viewBox="0 0 100 100" fill="none">
              {/* Normal detailed eyes with double glares & lashes */}
              <ellipse cx="28" cy="42" rx="4.5" ry="6.5" fill="#1c1917" />
              <ellipse cx="72" cy="42" rx="4.5" ry="6.5" fill="#1c1917" />
              <circle cx="26.5" cy="39" r="1.5" fill="#fff" />
              <circle cx="70.5" cy="39" r="1.5" fill="#fff" />
              {/* Motivated thin brows */}
              <path d="M20 28 Q30 23 38 27" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M80 28 Q70 23 62 27" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Girly eyelashes */}
              <path d="M19 36 Q26 31 32 35" stroke="#1c1917" strokeWidth="2.2" fill="none" />
              <path d="M81 36 Q74 31 68 35" stroke="#1c1917" strokeWidth="2.2" fill="none" />
              {/* Rosy blush */}
              <circle cx="16" cy="56" r="4" fill="#f43f5e" opacity="0.45" />
              <circle cx="84" cy="56" r="4" fill="#f43f5e" opacity="0.45" />
              {/* Sweet rosy smile */}
              <path d="M38 62 Q50 73 62 62" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          );
      }
    } else {
      // Masculine face decal matching original Roblox
      switch (c.face) {
        case "face-studying":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <path d="M22 24 Q32 30 40 26" stroke="#1c1917" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M78 24 Q68 30 60 26" stroke="#1c1917" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <circle cx="28" cy="40" r="5.5" fill="#0284c7" />
              <circle cx="72" cy="40" r="5.5" fill="#0284c7" />
              <circle cx="27" cy="38" r="1.8" fill="#fff" />
              <circle cx="71" cy="38" r="1.8" fill="#fff" />
              <rect x="13" y="30" width="30" height="24" rx="5" stroke="#1c1917" strokeWidth="3.5" fill="none" />
              <rect x="57" y="30" width="30" height="24" rx="5" stroke="#1c1917" strokeWidth="3.5" fill="none" />
              <line x1="43" y1="40" x2="57" y2="40" stroke="#1c1917" strokeWidth="3.5" />
              <path d="M40 70 Q50 74 60 70" stroke="#1c1917" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-excited":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <polygon points="28,26 31,33 39,33 33,37 35,45 28,41 21,45 23,37 17,33 25,33" fill="#eab308" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="72,26 75,33 83,33 77,37 79,45 72,41 65,45 67,37 61,33 69,33" fill="#eab308" stroke="#1c1917" strokeWidth="1.5" />
              <path d="M38 62 Q50 82 62 62 Z" fill="#991b1b" stroke="#1c1917" strokeWidth="3" />
              <path d="M41 63 Q50 67 59 63" fill="#fff" />
            </svg>
          );
        case "face-cool":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <polygon points="12,32 46,32 42,50 16,50" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
              <polygon points="54,32 88,32 84,50 58,50" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="46" y1="38" x2="54" y2="38" stroke="#0f172a" strokeWidth="3.5" />
              <path d="M42 68 Q53 70 59 64" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-wink":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <circle cx="28" cy="40" r="5.5" fill="#1c1917" />
              <circle cx="26.5" cy="37.5" r="1.8" fill="#fff" />
              <path d="M60 41 Q70 48 80 41" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M42 66 Q50 71 58 66" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          );
        case "face-curious":
          return (
            <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
              <circle cx="28" cy="38" r="5" fill="#1c1917" />
              <circle cx="72" cy="38" r="5" fill="#1c1917" />
              <path d="M18 24 Q30 18 38 24" stroke="#1c1917" strokeWidth="3.5" fill="none" />
              <path d="M78 28 Q68 26 62 30" stroke="#1c1917" strokeWidth="3.5" fill="none" />
              <ellipse cx="50" cy="68" rx="4.5" ry="3" fill="#1c1917" />
            </svg>
          );
        case "face-happy":
        default:
          return (
            <svg className="w-full h-full p-2.5" viewBox="0 0 100 100" fill="none">
              <circle cx="28" cy="42" r="5" fill="#1c1917" />
              <circle cx="72" cy="42" r="5" fill="#1c1917" />
              <circle cx="26.5" cy="39.5" r="1.5" fill="#fff" />
              <circle cx="70.5" cy="39.5" r="1.5" fill="#fff" />
              <path d="M20 28 Q30 23 38 27" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M80 28 Q70 23 62 27" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M38 62 Q50 74 62 62" stroke="#1c1917" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </svg>
          );
      }
    }
  };

  // Clothing details
  const activeOutfit = c.outfit;
  const activeShirt = c.shirt;
  const activePants = c.pants;
  const activeShoes = c.shoes;

  let shirtColor = "#1e3a8a"; // Default school blue
  let armColor = "#1e3a8a";
  let hasLongSleeves = false;
  let shirtDecal: React.ReactNode = null;
  let pantsColor = "#334155";
  let shoesColor = "#1e293b";
  let isSkirt = false;

  // Render variables for gender specific school uniform
  if (isGirl) {
    // Pleated school uniform for girl
    isSkirt = true;
    pantsColor = "#1e293b"; // dark pleated skirt color
    shoesColor = "#1e293b"; // Sneaker color

    // White Hoodie with navy stripes sleeves and crest (mockup)
    shirtColor = "#ffffff";
    armColor = "#ffffff";
    hasLongSleeves = true;
    shirtDecal = (
      <div className="relative h-full w-full p-2 flex flex-col justify-between items-center text-center">
        {/* White shirt collar V with red ribbon bow tie */}
        <div className="absolute top-0 inset-x-2.5 h-3.5 bg-slate-100 border border-slate-200 rounded-b flex items-center justify-center">
          <div className="w-2.5 h-2 bg-red-600 rounded-full border border-red-800 flex items-center justify-center">
            <span className="size-1 bg-red-400 rounded-full"></span>
          </div>
        </div>

        {/* Academic gold shield/mortarboard crest on chest */}
        <div className="mt-4.5 size-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-300 shadow flex items-center justify-center text-[10px]">
          🎓
        </div>
      </div>
    );
  } else {
    // Masculine uniform (Boy letterman varsity)
    pantsColor = "#1e293b";
    shoesColor = "#1a3a73";

    if (activeOutfit === "outfit-academic-legend") {
      shirtColor = "#991b1b";
      armColor = "#991b1b";
      hasLongSleeves = true;
      shirtDecal = (
        <div className="size-full flex items-center justify-center">
          <div className="text-xl">🦁</div>
        </div>
      );
    } else {
      shirtColor = "#1e3a8a"; // Navy blue varsity
      armColor = "#f3f4f6"; // white sleeves
      hasLongSleeves = true;
      shirtDecal = (
        <div className="relative h-full w-full p-2 flex flex-col justify-between items-center text-center">
          <line x1="29" y1="0" x2="29" y2="74" stroke="#94a3b8" strokeWidth="2.5" />
          <div className="mt-4 size-7 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-300 shadow flex items-center justify-center text-xs font-black text-amber-950 font-sans">
            L
          </div>
        </div>
      );
    }
  }

  // Accessories
  let renderHeadAcc = null;
  let renderFaceGlasses = null;
  let renderBackpack = null;

  if (c.accessory === "acc-legendary-mortarboard") {
    renderHeadAcc = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Diamond flat top plate */}
        <Box3D width={isGirl ? 56 : 64} height={3} depth={isGirl ? 56 : 64} x={0} y={headY - (isGirl ? 20 : 24)} z={0} color="#111827"
          rightDecal={<div className="w-1.5 h-12 bg-yellow-400 absolute right-4 top-0 shadow"></div>} />
        {/* Cylinder base */}
        <Box3D width={isGirl ? 30 : 34} height={10} depth={isGirl ? 30 : 34} x={0} y={headY - (isGirl ? 14 : 18)} z={0} color="#0f172a" />
      </div>
    );
  } else if (c.accessory === "acc-knowledge-crown") {
    renderHeadAcc = (
      <Box3D width={isGirl ? 42 : 48} height={12} depth={isGirl ? 42 : 48} x={0} y={headY - (isGirl ? 20 : 23)} z={0} color="#fbbf24"
        frontDecal={
          <div className="w-full h-full flex justify-around items-end pb-0.5">
            <span className="size-1 bg-red-600 rounded-full" />
            <span className="size-1 bg-blue-600 rounded-full mb-0.5" />
            <span className="size-1 bg-red-600 rounded-full" />
          </div>
        }
      />
    );
  } else if (c.accessory === "acc-nerd-glasses") {
    renderFaceGlasses = (
      <Box3D width={isGirl ? 40 : 46} height={16} depth={2} x={0} y={headY + 2} z={isGirl ? 20 : 23} color="#1f2937"
        frontDecal={
          <div className="w-full h-full flex justify-between px-2 bg-black/10 border border-gray-800">
            <div className="w-3.5 h-full bg-white/20" />
            <div className="w-3.5 h-full bg-white/20" />
          </div>
        }
      />
    );
  } else if (c.accessory === "acc-headphones") {
    renderHeadAcc = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Headphones bridge */}
        <Box3D width={isGirl ? 42 : 48} height={4} depth={6} x={0} y={headY - (isGirl ? 20 : 23)} z={0} color="#7c3aed" />
        {/* Left ear pad */}
        <Box3D width={8} height={20} depth={16} x={isGirl ? -20 : -23} y={headY + 2} z={0} color="#6d28d9" />
        {/* Right ear pad */}
        <Box3D width={8} height={20} depth={16} x={isGirl ? 20 : 23} y={headY + 2} z={0} color="#6d28d9" />
      </div>
    );
  }

  // Backpacks
  if (c.accessory === "acc-school-backpack") {
    renderBackpack = (
      <Box3D width={isGirl ? 38 : 44} height={isGirl ? 44 : 50} depth={16} x={0} y={4} z={backpackZ} color="#1e293b"
        backDecal={
          <div className="w-full h-full p-2 flex flex-col justify-between items-center bg-[#0f172a]">
            <div className="w-7 h-4 bg-slate-800 border border-slate-900 rounded flex justify-center text-[7px] text-gray-300 font-bold">Pocket</div>
            <div className="w-3 h-1 bg-black rounded" />
          </div>
        }
      />
    );
  } else if (c.accessory === "acc-science-backpack") {
    renderBackpack = (
      <div style={{ transformStyle: "preserve-3d" }}>
        <Box3D width={isGirl ? 24 : 28} height={isGirl ? 40 : 46} depth={22} x={0} y={4} z={backpackZ + 1} color="#06b6d4"
          backDecal={
            <div className="w-full h-full bg-emerald-400 shadow-[0_0_12px_#10b981] flex flex-col justify-center items-center text-[7px] font-black text-emerald-950">
              CHEM VIAL
            </div>
          }
        />
        <Box3D width={torsoW + 4} height={4} depth={torsoD + 2} x={0} y={-10} z={-10} color="#78350f" />
        <Box3D width={torsoW + 4} height={4} depth={torsoD + 2} x={0} y={15} z={-10} color="#78350f" />
      </div>
    );
  } else if (c.accessory === "acc-college-backpack") {
    renderBackpack = (
      <div style={{ transformStyle: "preserve-3d" }}>
        <Box3D width={34} height={12} depth={28} x={0} y={-5} z={backpackZ + 2} color="#dc2626"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-red-900 select-none">MATH</div>} />
        <Box3D width={32} height={12} depth={26} x={0} y={5} z={backpackZ + 2} color="#16a34a"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-green-900 select-none">SCI</div>} />
        <Box3D width={36} height={12} depth={30} x={0} y={15} z={backpackZ + 2} color="#2563eb"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-blue-900 select-none">HIST</div>} />
      </div>
    );
  }

  // Floating hand items
  let renderHandHeld = null;
  if (c.accessory === "acc-education-globe") {
    renderHandHeld = (
      <Box3D width={18} height={18} depth={18} x={isGirl ? 42 : 50} y={15} z={12} color="#2563eb" className="animate-bounce"
        frontDecal={<div className="size-full bg-emerald-500 rounded-full border border-blue-600 text-[6px] text-center font-bold text-white flex items-center justify-center">🌎</div>} />
    );
  } else if (c.accessory === "acc-floating-book") {
    renderHandHeld = (
      <Box3D width={24} height={4} depth={18} x={isGirl ? -42 : -50} y={15} z={12} color="#7c3aed" className="animate-pulse"
        topDecal={
          <div className="w-full h-full bg-amber-50 p-0.5 text-[5px] text-amber-950 font-serif leading-none flex justify-around select-none">
            <div>A=πr²<br/>x=-b±√...</div>
            <div className="border-l border-amber-200 pl-0.5">∑x/n<br/>E=mc²</div>
          </div>
        }
      />
    );
  }

  // Pet
  let renderPet = null;
  if (c.pet === "pet-owl") {
    renderPet = (
      <div className="animate-bounce" style={{ transformStyle: "preserve-3d" }}>
        <Box3D width={16} height={20} depth={16} x={isGirl ? 44 : 52} y={-30} z={10} color="#78350f"
          frontDecal={
            <div className="w-full h-full p-1 flex flex-col justify-between items-center bg-amber-900 rounded select-none">
              <div className="flex justify-between w-full px-1">
                <div className="size-2.5 rounded-full bg-yellow-400 border border-black flex items-center justify-center"><div className="size-1 rounded-full bg-black" /></div>
                <div className="size-2.5 rounded-full bg-yellow-400 border border-black flex items-center justify-center"><div className="size-1 rounded-full bg-black" /></div>
              </div>
              <polygon points="8,5 5,8 11,8" fill="#f59e0b" className="mx-auto" />
            </div>
          }
        />
        <Box3D width={20} height={1.5} depth={20} x={isGirl ? 44 : 52} y={-44} z={10} color="#1e2937" />
        <Box3D width={10} height={4} depth={10} x={isGirl ? 44 : 52} y={-42} z={10} color="#0f172a" />
      </div>
    );
  }

  // Auras
  const renderAura = () => {
    if (c.aura === "aura-golden") {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none transform-style-3d">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute size-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#fbbf24] animate-ping"
              style={{
                left: `${20 + Math.sin(i * 60) * 60 + 60}px`,
                top: `${40 + Math.cos(i * 60) * 80 + 80}px`,
                animationDelay: `${i * 150}ms`,
                animationDuration: "1.6s",
              }}
            />
          ))}
        </div>
      );
    } else if (c.aura === "aura-math") {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none transform-style-3d opacity-85">
          {["π", "∑", "√", "x", "÷"].map((s, i) => (
            <div key={i} className="absolute font-mono text-[10px] font-black text-cyan-400 animate-pulse"
              style={{
                left: `${30 + Math.sin(i) * 55 + 55}px`,
                top: `${30 + i * 25}px`,
                transform: `translateZ(${Math.cos(i) * 20}px)`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Hairstyles in boxy 3D (Cleanly scaled, fits beautifully without being oversized)
  const renderHair3D = () => {
    const style = c.hairStyle;

    if (style === "hair-wavy" || style === "hair-long" || style === "hair-straight" || style === "hair-curly" || style === "hair-braids" || style === "hair-pigtails" || style === "hair-bangs" || style === "hair-afro") {
      // Girly volumetric blocky hair cuts
      return (
        <div style={{ transformStyle: "preserve-3d" }}>
          {/* Main top crown box */}
          <Box3D width={headW + 4} height={14} depth={headD + 4} x={0} y={headY - (isGirl ? 13 : 15)} z={1} color={activeHairHex} />
          
          {/* Back lock block cascading behind shoulders */}
          <Box3D width={headW + 4} height={46} depth={10} x={0} y={headY + 14} z={-(headD / 2) + 2} color={activeHairHex} />
          
          {/* Side block locks framing the cheeks elegantly (blocky Roblox) */}
          <Box3D width={8} height={40} depth={headD - 4} x={-(headW / 2) - 1.5} y={headY + 12} z={2} color={activeHairHex} />
          <Box3D width={8} height={40} depth={headD - 4} x={(headW / 2) + 1.5} y={headY + 12} z={2} color={activeHairHex} />

          {/* Sweet fringe bangs over the forehead */}
          <Box3D width={headW - 4} height={8} depth={5} x={0} y={headY - 11} z={(headD / 2) - 1} color={activeHairHex} />
          
          {/* Highlight blocks if active */}
          {highlightHex && (
            <>
              <Box3D width={headW - 8} height={2} depth={headD - 8} x={0} y={headY - 21} z={1} color={highlightHex} />
              <Box3D width={3} height={32} depth={8} x={-(headW / 2) - 2} y={headY + 12} z={3} color={highlightHex} />
              <Box3D width={3} height={32} depth={8} x={(headW / 2) + 2} y={headY + 12} z={3} color={highlightHex} />
            </>
          )}
        </div>
      );
    } else {
      // Short/Spikey hair cuts (primarily for boy model base, but shared)
      return (
        <div style={{ transformStyle: "preserve-3d" }}>
          {/* Top spiky locks */}
          <Box3D width={headW + 2} height={12} depth={headD + 2} x={0} y={headY - 15} z={0} color={activeHairHex} />
          <Box3D width={10} height={6} depth={10} x={-8} y={headY - 19} z={4} color={activeHairHex} />
          <Box3D width={10} height={6} depth={10} x={8} y={headY - 19} z={4} color={activeHairHex} />
          {/* Side burns */}
          <Box3D width={5} height={14} depth={8} x={-(headW / 2) - 1} y={headY - 2} z={8} color={activeHairHex} />
          <Box3D width={5} height={14} depth={8} x={(headW / 2) + 1} y={headY - 2} z={8} color={activeHairHex} />
          {/* Back cap */}
          <Box3D width={headW + 2} height={20} depth={6} x={0} y={headY} z={-(headD / 2) - 1} color={activeHairHex} />

          {/* Highlight overlay spikes */}
          {highlightHex && (
            <>
              <Box3D width={6} height={3} depth={6} x={-6} y={headY - 20} z={4} color={highlightHex} />
              <Box3D width={6} height={3} depth={6} x={6} y={headY - 20} z={4} color={highlightHex} />
            </>
          )}
        </div>
      );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-[320px] mx-auto overflow-hidden">
      
      {/* Dynamic 3D Concentric Neon Rings stage under character's feet (matches mockup glow stage) */}
      <div 
        className="absolute bottom-6 size-[180px] rounded-full flex items-center justify-center opacity-75 pointer-events-none"
        style={{
          transform: "rotateX(75deg)",
          boxShadow: "0 0 20px #8b5cf6, inset 0 0 20px #8b5cf6",
          border: "4px solid #d946ef",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(217,70,239,0) 70%)"
        }}
      >
        <div className="size-[130px] rounded-full border-2 border-indigo-500 shadow-[0_0_10px_#6366f1]" />
      </div>

      {/* 3D Viewport wrapper */}
      <div
        className="w-full h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        style={{
          perspective: "800px",
          transformStyle: "preserve-3d",
        }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startY = e.clientY;
          const startYaw = yaw;
          const startPitch = pitch;
          setIsRotating(false);

          const handleMouseMove = (mv: MouseEvent) => {
            const deltaX = mv.clientX - startX;
            const deltaY = mv.clientY - startY;
            setYaw(startYaw + deltaX * 0.85);
            setPitch(Math.max(-45, Math.min(45, startPitch - deltaY * 0.85)));
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 0) return;
          const startX = e.touches[0].clientX;
          const startY = e.touches[0].clientY;
          const startYaw = yaw;
          const startPitch = pitch;
          setIsRotating(false);

          const handleTouchMove = (mv: TouchEvent) => {
            if (mv.touches.length === 0) return;
            const deltaX = mv.touches[0].clientX - startX;
            const deltaY = mv.touches[0].clientY - startY;
            setYaw(startYaw + deltaX * 0.85);
            setPitch(Math.max(-45, Math.min(45, startPitch - deltaY * 0.85)));
          };

          const handleTouchEnd = () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          };

          document.addEventListener("touchmove", handleTouchMove);
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        {renderAura()}

        {/* Master character 3D root block */}
        <div
          className="relative w-1 h-1 select-none pointer-events-none transition-transform duration-75"
          style={{
            transform: `scale(${scale}) rotateX(${pitch}deg) rotateY(${yaw}deg) translate3d(0, -10px, 0)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Shadow element directly under character feet */}
          <div
            className="absolute size-[100px] rounded-full"
            style={{
              left: "-50px",
              top: "-50px",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%)",
              transform: "rotateX(90deg) translate3d(0, 0, -112px)",
            }}
          />

          {/* ==========================================
              3D HEAD BOX
              ========================================== */}
          <Box3D
            width={headW}
            height={headH}
            depth={headD}
            x={0}
            y={headY}
            z={0}
            color={activeSkinHex}
            frontDecal={renderFaceDecal()}
          />

          {/* Hair block overlays */}
          {renderHair3D()}

          {/* Academic Headwear accessories */}
          {renderHeadAcc}

          {/* Chic Nerd spectacles overlay */}
          {renderFaceGlasses}

          {/* ==========================================
              3D TORSO BOX
              ========================================== */}
          <Box3D
            width={torsoW}
            height={torsoH}
            depth={torsoD}
            x={0}
            y={6}
            z={0}
            color={shirtColor}
            frontDecal={shirtDecal}
          />

          {/* Academic Backpack on back */}
          {renderBackpack}

          {/* ==========================================
              3D LEFT ARM
              ========================================== */}
          <Box3D
            width={armW}
            height={armH}
            depth={armD}
            x={armX}
            y={5}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  {/* Sleeve cuff painted */}
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            leftDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            rightDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* ==========================================
              3D RIGHT ARM
              ========================================== */}
          <Box3D
            width={armW}
            height={armH}
            depth={armD}
            x={-armX}
            y={5}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            leftDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            rightDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* ==========================================
              3D SKIRT BOX (Falda tableada escolar de la compañera)
              ========================================== */}
          {isSkirt && (
            <Box3D
              width={torsoW + 6}
              height={18}
              depth={torsoD + 6}
              x={0}
              y={skirtY}
              z={0}
              color="#1e293b" // dark blue pleated skirt base
              frontDecal={
                <div className="w-full h-full bg-[#1e293b] relative">
                  {/* Tableada yellow lines check */}
                  <div className="absolute inset-x-0 bottom-1.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="absolute inset-x-0 bottom-4.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="flex justify-around h-full w-full">
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                  </div>
                </div>
              }
              leftDecal={
                <div className="w-full h-full bg-[#1e293b] relative">
                  <div className="absolute inset-x-0 bottom-1.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="flex justify-around h-full w-full">
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                  </div>
                </div>
              }
              rightDecal={
                <div className="w-full h-full bg-[#1e293b] relative">
                  <div className="absolute inset-x-0 bottom-1.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="flex justify-around h-full w-full">
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                  </div>
                </div>
              }
              backDecal={
                <div className="w-full h-full bg-[#1e293b] relative">
                  <div className="absolute inset-x-0 bottom-1.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="absolute inset-x-0 bottom-4.5 h-0.5 bg-yellow-500 opacity-80" />
                  <div className="flex justify-around h-full w-full">
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                    <div className="w-0.5 h-full bg-yellow-500 opacity-80" />
                  </div>
                </div>
              }
            />
          )}

          {/* ==========================================
              3D LEFT LEG BOX
              With Tall Socks (Decal painted) & Sneakers
              ========================================== */}
          <Box3D
            width={legW}
            height={legH}
            depth={legD}
            x={legX}
            y={legY}
            z={0}
            color={pantsColor}
            frontDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  {/* Skin exposed at the very top */}
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  {/* Thigh high white socks */}
                  <div className="w-full flex-1 bg-white relative">
                    {/* Double navy stripe on socks cuffed */}
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                    <div className="absolute top-4 inset-x-0 h-1 bg-[#1a3a73]" />
                  </div>
                  {/* Sneaker white cuff at the bottom */}
                  <div className="w-full bg-white border-t border-slate-300 flex flex-col justify-end" style={{ height: "15px" }}>
                    <div className="w-full h-3 bg-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-end">
                  <div className="w-full bg-[#1e293b]" style={{ height: "14px" }} />
                </div>
              )
            }
            leftDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            rightDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            backDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                    <div className="absolute top-4 inset-x-0 h-1 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            bottomDecal={<div className="size-full" style={{ backgroundColor: "#1c1917" }} />}
          />

          {/* ==========================================
              3D RIGHT LEG BOX
              ========================================== */}
          <Box3D
            width={legW}
            height={legH}
            depth={legD}
            x={-legX}
            y={legY}
            z={0}
            color={pantsColor}
            frontDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  {/* Skin exposed at the very top */}
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  {/* Thigh high white socks */}
                  <div className="w-full flex-1 bg-white relative">
                    {/* Double navy stripe on socks cuffed */}
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                    <div className="absolute top-4 inset-x-0 h-1 bg-[#1a3a73]" />
                  </div>
                  {/* Sneaker white cuff at bottom */}
                  <div className="w-full bg-white border-t border-slate-300 flex flex-col justify-end" style={{ height: "15px" }}>
                    <div className="w-full h-3 bg-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-end">
                  <div className="w-full bg-[#1e293b]" style={{ height: "14px" }} />
                </div>
              )
            }
            leftDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            rightDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            backDecal={
              isGirl ? (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[6px]" style={{ backgroundColor: activeSkinHex }} />
                  <div className="w-full flex-1 bg-white relative">
                    <div className="absolute top-1.5 inset-x-0 h-1.5 bg-[#1a3a73]" />
                    <div className="absolute top-4 inset-x-0 h-1 bg-[#1a3a73]" />
                  </div>
                  <div className="w-full bg-white border-t border-slate-300" style={{ height: "15px" }} />
                </div>
              ) : undefined
            }
            bottomDecal={<div className="size-full" style={{ backgroundColor: "#1c1917" }} />}
          />

          {/* Floating hand-held accessories */}
          {renderHandHeld}

          {/* Owl companion pet */}
          {renderPet}
        </div>
      </div>

      {/* 3D stage auto rotation interface */}
      <div className="absolute bottom-16 inset-x-2 flex justify-center gap-1.5 z-20">
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => prev - 45);
          }}
          className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
          title="Girar Izquierda"
        >
          🔄
        </button>
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3.5 h-8 rounded-xl border flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition ${
            isRotating ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20" : "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
          }`}
        >
          {isRotating ? "Pausar" : "Auto Girar"}
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => prev + 45);
          }}
          className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
          title="Girar Derecha"
        >
          🔄
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(-30);
            setPitch(-10);
          }}
          className="px-2 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
        >
          Reiniciar
        </button>
      </div>

      {/* Small drag instructions */}
      <span className="absolute top-2 right-2 text-[9px] font-bold tracking-wide text-purple-400 uppercase bg-slate-950/85 px-1.5 py-0.5 rounded shadow border border-purple-500/20 shadow-sm animate-pulse">
        Arrastra para rotar
      </span>
    </div>
  );
}
