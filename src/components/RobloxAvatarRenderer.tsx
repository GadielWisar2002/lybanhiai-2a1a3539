import React, { useState, useEffect } from "react";
import { AvatarItem } from "@/lib/avatar.functions";

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
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.22)",
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
          filter: "brightness(0.7)",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.24)",
          border: "0.5px solid rgba(0,0,0,0.12)",
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
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.18)",
          border: "0.5px solid rgba(0,0,0,0.09)",
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
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.16), inset 0 1px 1px rgba(255,255,255,0.1)",
          border: "0.5px solid rgba(255,255,255,0.06)",
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
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.06), inset 0 1.5px 2px rgba(255,255,255,0.32)",
          border: "0.5px solid rgba(255,255,255,0.16)",
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
          filter: "brightness(0.6)",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.28)",
          border: "0.5px solid rgba(0,0,0,0.18)",
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
    hairStyle: config?.hairStyle || "hair-short",
    hairColor: config?.hairColor || "color-black",
    hairHighlight: config?.hairHighlight || "hl-none",
    face: config?.face || "face-happy",
    shirt: config?.shirt || "shirt-basic-tee",
    pants: config?.pants || "pants-basic-jeans",
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    pet: config?.pet || "",
    aura: config?.aura || "",
    outfit: config?.outfit || "",
    gender: config?.gender || "boy",
  };

  const isGirl = c.gender === "girl";
  
  // Dimensions
  const torsoW = isGirl ? 48 : 58;
  const torsoH = isGirl ? 70 : 74;
  const torsoD = isGirl ? 24 : 28;
  
  const armW = isGirl ? 14 : 18;
  const armH = isGirl ? 68 : 72;
  const armD = isGirl ? 14 : 18;
  const armX = isGirl ? 32 : 39; // shoulder position offset
  
  const legW = isGirl ? 18 : 22;
  const legH = isGirl ? 68 : 72;
  const legD = isGirl ? 18 : 22;
  const legX = isGirl ? 11 : 14;

  const headY = isGirl ? -58 : -60;
  const legY = isGirl ? 67 : 72;
  const skirtY = isGirl ? 41 : 43;
  const backpackZ = isGirl ? -22 : -24;
  const handY = isGirl ? 13 : 15;

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 1.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Skin hex color codes
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
    "color-brown-light": "#854d0e",
    "color-brown-dark": "#451a03",
    "color-blonde": "#ca8a04",
    "color-red": "#b91c1c",
    "color-gray": "#78716c",
    "color-white": "#fafaf9",
    "color-fantasy-pink": "#ec4899",
    "color-fantasy-blue": "#2563eb",
    "color-fantasy-purple": "#7c3aed",
  };
  const activeHairHex = hairColors[c.hairColor] || hairColors["color-black"];

  // Highlights mapping
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

  // Face SVGs
  const renderFaceDecal = () => {
    switch (c.face) {
      case "face-studying":
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
            {/* Determined brows */}
            <path d="M20 22 Q30 29 40 25" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M80 22 Q70 29 60 25" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Intelligent focused blue eyes */}
            <rect x="23" y="32" width="14" height="20" rx="4.5" fill="#0284c7" />
            <rect x="63" y="32" width="14" height="20" rx="4.5" fill="#0284c7" />
            <circle cx="28" cy="37" r="3" fill="#fff" />
            <circle cx="68" cy="37" r="3" fill="#fff" />
            {/* Blushing */}
            <circle cx="16" cy="55" r="5" fill="#fb7185" opacity="0.4" />
            <circle cx="84" cy="55" r="5" fill="#fb7185" opacity="0.4" />
            {/* Sleek round academic glasses overlay */}
            <rect x="14" y="28" width="32" height="28" rx="8" stroke="#0f172a" strokeWidth="4" fill="none" />
            <rect x="54" y="28" width="32" height="28" rx="8" stroke="#0f172a" strokeWidth="4" fill="none" />
            <line x1="46" y1="42" x2="54" y2="42" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            {/* Glass glares */}
            <path d="M36 34 L22 48" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
            <path d="M76 34 L62 48" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
            {/* Confident motivated smile */}
            <path d="M38 68 Q50 75 62 68" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-excited":
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
            {/* Excited highly arched brows */}
            <path d="M18 20 Q30 14 40 20" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M82 20 Q70 14 60 20" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Big gold stars inside shiny eyes */}
            <polygon points="30,22 34,31 43,31 36,37 39,46 30,40 21,46 24,37 17,31 26,31" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <polygon points="70,22 74,31 83,31 76,37 79,46 70,40 61,46 64,37 57,31 66,31" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="30" cy="34" r="2.5" fill="#fff" />
            <circle cx="70" cy="34" r="2.5" fill="#fff" />
            {/* Glowing cheek blush circles */}
            <circle cx="16" cy="56" r="8" fill="#ec4899" opacity="0.5" />
            <circle cx="84" cy="56" r="8" fill="#ec4899" opacity="0.5" />
            {/* Wide happy laughing mouth */}
            <path d="M30 62 Q50 90 70 62 Z" fill="#991b1b" stroke="#451a03" strokeWidth="2.5" />
            {/* Teeth line */}
            <path d="M33 63 Q50 69 67 63" fill="#fff" stroke="#fff" strokeWidth="2.5" />
            {/* Soft tongue */}
            <path d="M42 75 Q50 82 58 75" fill="#f43f5e" />
          </svg>
        );
      case "face-cool":
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none">
            {/* Modern cool student sunglasses */}
            <polygon points="12,32 46,32 42,54 18,54" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />
            <polygon points="54,32 88,32 82,54 58,54" fill="#0f172a" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="45" y1="38" x2="55" y2="38" stroke="#0f172a" strokeWidth="5.5" strokeLinecap="round" />
            {/* Sunglasses diagonal reflections */}
            <path d="M34 36 L20 50" stroke="rgba(34,211,238,0.5)" strokeWidth="3" strokeLinecap="round" />
            <path d="M76 36 L62 50" stroke="rgba(34,211,238,0.5)" strokeWidth="3" strokeLinecap="round" />
            {/* Confident side smirk */}
            <path d="M42 72 Q56 74 66 65" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-wink":
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
            {/* Arched playful brows */}
            <path d="M18 24 Q30 18 40 26" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M82 20 Q70 16 60 22" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Winking Left Eye */}
            <path d="M16 44 Q28 35 40 44" stroke="#451a03" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M18 46 Q28 39 38 46" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Big beautiful open Right Eye */}
            <rect x="61" y="30" width="17" height="23" rx="6" fill="#1c1917" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="66" cy="36" r="4.5" fill="#fff" />
            <circle cx="72" cy="45" r="2" fill="#fff" />
            {/* Cheek blush */}
            <circle cx="16" cy="58" r="6" fill="#fb7185" opacity="0.6" />
            <circle cx="84" cy="58" r="6" fill="#fb7185" opacity="0.6" />
            {/* Playful mouth */}
            <path d="M35 64 Q50 82 65 64" stroke="#451a03" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Cute tongue sticking out */}
            <path d="M44 71 Q50 82 56 71 Z" fill="#f43f5e" stroke="#451a03" strokeWidth="1.5" />
          </svg>
        );
      case "face-curious":
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
            {/* Puzzled high/low eyebrows */}
            <path d="M18 20 Q28 14 38 22" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M82 28 Q72 32 62 26" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Puzzled eyes (one wider, one smaller) */}
            <rect x="22" y="34" width="16" height="20" rx="5" fill="#1c1917" />
            <rect x="62" y="36" width="14" height="15" rx="4" fill="#1c1917" />
            <circle cx="27" cy="39" r="3.5" fill="#fff" />
            <circle cx="66" cy="40" r="2.5" fill="#fff" />
            {/* Light blue sweat drop on temple */}
            <path d="M12 18 Q14 26 8 28 Q4 22 12 18" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            {/* Wry curious mouth */}
            <path d="M36 70 Q54 60 64 70" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-happy":
      default:
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
            {/* Smart motivated eyebrows */}
            <path d="M18 25 Q30 20 40 26" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M82 25 Q70 20 60 26" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Big anime eyes with shiny details */}
            <rect x="22" y="32" width="16" height="24" rx="6" fill="#1c1917" stroke="#451a03" strokeWidth="1.5" />
            <rect x="62" y="32" width="16" height="24" rx="6" fill="#1c1917" stroke="#451a03" strokeWidth="1.5" />
            {/* Double shiny eye highlights */}
            <circle cx="27" cy="37" r="4.5" fill="#fff" />
            <circle cx="33" cy="47" r="2" fill="#fff" />
            <circle cx="67" cy="37" r="4.5" fill="#fff" />
            <circle cx="73" cy="47" r="2" fill="#fff" />
            {/* Eyelash highlights */}
            <path d="M20 34 L26 31" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M80 34 L74 31" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
            {/* Blushing cheeks */}
            <circle cx="16" cy="58" r="6" fill="#fb7185" opacity="0.6" />
            <circle cx="84" cy="58" r="6" fill="#fb7185" opacity="0.6" />
            {/* Happy open mouth with teeth & tongue */}
            <path d="M36 62 Q50 82 64 62 Z" fill="#991b1b" stroke="#451a03" strokeWidth="2.5" />
            {/* Teeth */}
            <path d="M39 63 Q50 68 61 63" fill="#fff" stroke="#fff" strokeWidth="2.5" />
            {/* Tongue */}
            <path d="M43 72 Q50 78 57 72" fill="#f43f5e" />
          </svg>
        );
    }
  };

  // Shirt body textures
  const activeOutfit = c.outfit;
  const activeShirt = c.shirt;

  let shirtColor = "#3b82f6"; // default blue
  let armColor = "#3b82f6"; // sleeve color
  let shirtDecal: React.ReactNode = null;
  let hasLongSleeves = false;
  let capeDecal: React.ReactNode = null;

  // Render cape if outfit matches academic legend
  if (activeOutfit === "outfit-academic-legend") {
    shirtColor = "#b91c1c"; // royal crimson red
    armColor = "#b91c1c";
    hasLongSleeves = true;
    shirtDecal = (
      <div className="flex h-full w-full items-center justify-center p-1.5">
        <svg viewBox="0 0 100 100" fill="none" className="w-10 h-10">
          <polygon points="50,15 90,85 10,85" fill="#eab308" stroke="#78350f" strokeWidth="4" />
          {/* Lion crest shape */}
          <circle cx="50" cy="55" r="14" fill="#b91c1c" />
          <path d="M44 55 Q50 44 56 55 Q50 66 44 55" fill="#eab308" />
        </svg>
      </div>
    );
    // cape block behind character
    capeDecal = (
      <Box3D
        width={isGirl ? 48 : 58}
        height={isGirl ? 80 : 85}
        depth={4}
        x={0}
        y={isGirl ? 7 : 8}
        z={isGirl ? -15 : -17}
        color="#1d4ed8" // deep royal blue cape
      />
    );
  } else if (activeOutfit === "outfit-science-supremo") {
    shirtColor = "#1f2937"; // slate dark gray
    armColor = "#1f2937";
    hasLongSleeves = true;
    shirtDecal = (
      <div className="flex h-full w-full flex-col justify-between p-2">
        <div className="flex justify-center">
          {/* Glowing chest core */}
          <div className="size-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse border-2 border-cyan-100 flex items-center justify-center text-[8px] font-bold text-cyan-900">SUP</div>
        </div>
        <div className="flex justify-around gap-1">
          <div className="h-1.5 w-10 bg-cyan-400 shadow-[0_0_4px_#22d3ee] rounded"></div>
        </div>
      </div>
    );
  } else if (activeOutfit === "outfit-rector") {
    shirtColor = "#111827"; // pitch black academic robes
    armColor = "#111827";
    hasLongSleeves = true;
    shirtDecal = (
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Golden collar/sash details */}
        <div className="absolute top-0 inset-x-3 h-4 bg-yellow-500 rounded-b flex justify-center items-center">
          <span className="text-[7px] text-yellow-950 font-bold uppercase tracking-wider">RECTOR</span>
        </div>
        {/* Large golden medallion */}
        <div className="mt-4 size-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border border-yellow-100 shadow flex items-center justify-center font-bold text-yellow-900 text-[9px]">🎓</div>
      </div>
    );
  } else if (activeOutfit === "outfit-math-genius") {
    shirtColor = "#fef08a"; // yellow math shirt
    armColor = "#fef08a";
    hasLongSleeves = false;
    shirtDecal = (
      <div className="relative h-full w-full p-2 flex flex-col justify-between">
        {/* Grid pattern & suspenders */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:10px_10px] opacity-35" />
        <div className="relative z-10 flex justify-between h-full px-2">
          {/* Suspenders */}
          <div className="w-2.5 h-full bg-amber-800 border-x border-amber-950 flex items-end"><div className="w-full h-2 bg-yellow-400"></div></div>
          <div className="w-2.5 h-full bg-amber-800 border-x border-amber-950 flex items-end"><div className="w-full h-2 bg-yellow-400"></div></div>
        </div>
        <div className="absolute bottom-2 left-6 z-10 text-[9px] font-mono font-bold text-indigo-900 leading-tight">E=mc²</div>
      </div>
    );
  } else if (activeOutfit === "outfit-investigator") {
    shirtColor = "#d97706"; // beige/amber double breasted trenchcoat
    armColor = "#d97706";
    hasLongSleeves = true;
    shirtDecal = (
      <div className="relative h-full w-full p-2 flex flex-col justify-between">
        {/* Collar V neck */}
        <div className="w-8 h-4 bg-yellow-900 mx-auto rounded-b flex items-center justify-center text-[7px] text-white">🕵️‍♂️</div>
        {/* Double breasted buttons */}
        <div className="flex flex-col gap-1.5 my-auto px-4">
          <div className="flex justify-between">
            <span className="size-1.5 rounded-full bg-yellow-950" />
            <span className="size-1.5 rounded-full bg-yellow-950" />
          </div>
          <div className="flex justify-between">
            <span className="size-1.5 rounded-full bg-yellow-950" />
            <span className="size-1.5 rounded-full bg-yellow-950" />
          </div>
        </div>
        {/* Brown waist belt */}
        <div className="h-3 w-full bg-yellow-950 flex items-center justify-center text-[6px] font-bold text-yellow-300">BELT</div>
      </div>
    );
  } else {
    // Normal separate shirts
    if (activeShirt === "shirt-lab-coat") {
      shirtColor = "#f9fafb"; // medical white lab coat
      armColor = "#f9fafb";
      hasLongSleeves = true;
      shirtDecal = isGirl ? (
        <div className="relative h-full w-full p-2 flex flex-col justify-between">
          {/* Girly inner teal collar with ribbon */}
          <div className="w-7 h-5 bg-teal-600 mx-auto rounded-b border-x-2 border-white flex items-center justify-center relative">
            <span className="text-[8px] text-white">🧪</span>
            <div className="absolute top-0.5 size-1.5 rounded-full bg-teal-400"></div>
          </div>
          {/* Detailed pocket with highlighters */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-sm text-[5.5px] text-slate-500 font-bold flex items-center gap-0.5">
              <span className="w-0.5 h-2 bg-pink-400 rounded-full inline-block animate-pulse" />
              <span className="w-0.5 h-2 bg-yellow-400 rounded-full inline-block" />
              <span>SCI</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full p-2 flex flex-col justify-between">
          {/* Inner chemical teal shirt & red necktie */}
          <div className="w-7 h-5 bg-emerald-600 mx-auto rounded-b border-x-2 border-white flex flex-col items-center justify-start pt-0.5">
            <div className="w-1 h-3.5 bg-red-600 rounded"></div>
          </div>
          {/* Pocket with pens */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="border border-gray-300 bg-white px-1.5 py-0.5 rounded shadow-sm text-[6px] text-gray-500 font-semibold flex items-center gap-0.5">
              <span className="w-0.5 h-2 bg-blue-500 rounded-full inline-block" />
              <span className="w-0.5 h-2 bg-red-500 rounded-full inline-block" />
              <span>LAB</span>
            </div>
          </div>
        </div>
      );
    } else if (activeShirt === "shirt-academic-jacket") {
      shirtColor = "#1e3a8a"; // navy letterman body
      armColor = "#f3f4f6"; // light gray sleeves!
      hasLongSleeves = true;
      shirtDecal = isGirl ? (
        <div className="h-full w-full p-2 flex flex-col justify-between relative">
          {/* Beautiful school uniform red bow/ribbon */}
          <div className="absolute top-0 inset-x-2.5 h-3.5 bg-slate-900 rounded-b flex items-center justify-center">
            {/* White inner shirt collar */}
            <div className="absolute top-0 w-3 h-1.5 bg-white rounded-b"></div>
            {/* Red bow tie */}
            <div className="absolute top-1 size-2 bg-red-600 rounded-full shadow flex items-center justify-center">
              <div className="w-2.5 h-1 bg-red-600 rotate-[25deg] absolute"></div>
              <div className="w-2.5 h-1 bg-red-600 rotate-[-25deg] absolute"></div>
            </div>
          </div>
          <div className="flex items-start justify-between mt-3.5">
            {/* Elegant small gold L crest */}
            <div className="size-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-600 flex items-center justify-center text-[9px] font-black text-amber-950 shadow-sm leading-none font-display">L</div>
            <div className="w-1.5 h-4.5 bg-slate-800 rounded"></div>
          </div>
          {/* Gold double button accents */}
          <div className="absolute bottom-4 left-6 flex gap-2">
            <span className="size-1 rounded-full bg-yellow-500"></span>
            <span className="size-1 rounded-full bg-yellow-500"></span>
          </div>
          {/* Striped pleated bottom waistband */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-yellow-400 to-blue-900 rounded-sm"></div>
        </div>
      ) : (
        <div className="h-full w-full p-2 flex flex-col justify-between relative">
          <div className="flex items-start justify-between">
            {/* Big gold L badge */}
            <div className="size-7 rounded bg-amber-500 border border-amber-600 flex items-center justify-center text-xs font-black text-amber-950 shadow-sm leading-none font-display">L</div>
            <div className="w-1.5 h-6 bg-gray-200 rounded"></div>
          </div>
          {/* Front zipper details */}
          <div className="absolute inset-y-2 left-[50%] w-0.5 bg-gray-400 shadow-sm"></div>
          {/* Striped bottom letterman waistband */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-yellow-400 to-blue-900 rounded"></div>
        </div>
      );
    } else if (activeShirt === "shirt-basic-hoodie") {
      shirtColor = "#4b5563"; // dark gray hoodie
      armColor = "#4b5563";
      hasLongSleeves = true;
      shirtDecal = isGirl ? (
        <div className="h-full w-full p-2 flex flex-col justify-between relative bg-pink-500/5">
          {/* Pastel pink hood folds */}
          <div className="absolute top-0 inset-x-2 h-3 bg-pink-500 rounded-b border-b border-pink-600"></div>
          {/* Drawstrings */}
          <div className="flex justify-center gap-3 mt-2.5">
            <div className="w-0.5 h-3 bg-white rounded-b"></div>
            <div className="w-0.5 h-3 bg-white rounded-b"></div>
          </div>
          {/* Kangaroo Pocket with Cute cap print */}
          <div className="mx-auto w-10 h-5 border border-pink-400 bg-pink-100 rounded-t-lg shadow-inner flex items-center justify-center text-[7px] text-pink-700 font-black">🎓 LOVE</div>
        </div>
      ) : (
        <div className="h-full w-full p-2 flex flex-col justify-between relative">
          {/* Drawstrings */}
          <div className="flex justify-center gap-3">
            <div className="w-0.5 h-4 bg-white rounded-b"></div>
            <div className="w-0.5 h-4 bg-white rounded-b"></div>
          </div>
          {/* Kangaroo Pocket */}
          <div className="mx-auto w-10 h-5 border border-gray-400 bg-gray-600 rounded-t-lg shadow-inner flex items-center justify-center text-[7px] text-gray-300 font-mono">LYB</div>
        </div>
      );
    } else {
      // shirt-basic-tee (Default)
      shirtColor = "#3b82f6"; // vivid blue
      armColor = "#3b82f6";
      hasLongSleeves = false;
      shirtDecal = isGirl ? (
        <div className="h-full w-full p-2 flex flex-col justify-between items-center text-center">
          {/* White inner shirt collar with tiny blue neck tie */}
          <div className="absolute top-0 inset-x-3.5 h-3 bg-slate-900 rounded-b flex flex-col items-center justify-start">
            <div className="w-2.5 h-1.5 bg-white rounded-b"></div>
            <div className="w-1 h-3 bg-blue-500 rounded-sm"></div>
          </div>
          <div className="flex flex-col items-center mt-4">
            {/* graduation mortarboard logo */}
            <span className="text-xl leading-none">🎓</span>
            <span className="text-[7px] font-black tracking-widest text-blue-100 uppercase mt-0.5">LYBANHI</span>
          </div>
        </div>
      ) : (
        <div className="h-full w-full p-2 flex flex-col justify-between items-center text-center">
          <div className="flex flex-col items-center mt-2">
            {/* graduation mortarboard logo */}
            <span className="text-xl leading-none">🎓</span>
            <span className="text-[7px] font-bold tracking-widest text-blue-100 uppercase mt-0.5">LYBANHI</span>
          </div>
          {/* Double gold stripes at sleeves cuffs */}
          <div className="absolute bottom-1.5 inset-x-4 flex justify-between px-1">
            <span className="h-1 w-2.5 bg-yellow-400 rounded-sm"></span>
            <span className="h-1 w-2.5 bg-yellow-400 rounded-sm"></span>
          </div>
        </div>
      );
    }
  }

  // Pants & shoes
  const activePants = c.pants;
  const activeShoes = c.shoes;

  let pantsColor = "#1e2937"; // default dark charcoal pants
  let shoesColor = "#dc2626"; // default red sneakers
  let isSkirt = false;

  if (activePants === "pants-basic-jeans") {
    pantsColor = "#1d4ed8"; // denim blue
  } else if (activePants === "pants-basic-skirt") {
    pantsColor = "#f472b6"; // bright pink pleated skirt
    isSkirt = true;
  }

  if (activeShoes === "shoes-academic-shoes") {
    shoesColor = "#78350f"; // brown polished shoes
  } else {
    // shoes-basic-shoes
    shoesColor = "#ef4444"; // red sneakers
  }

  // ----------------------------------------------------
  // Head Accessories
  // ----------------------------------------------------
  const activeAccessory = c.accessory;
  let renderHeadAcc = null;
  let renderFaceGlasses = null;
  let renderHeadphones = null;
  let renderBackpack = null;

  if (activeAccessory === "acc-legendary-mortarboard") {
    renderHeadAcc = (
      // Graduation cap mortarboard
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* The flat diamond plate */}
        <Box3D
          width={65}
          height={3}
          depth={65}
          x={0}
          y={headY - 25}
          z={0}
          color="#1e2937"
          // Tassel printed on face
          rightDecal={<div className="w-1.5 h-12 bg-yellow-400 absolute right-3 top-0 shadow"></div>}
        />
        {/* Cap skull cylinder base */}
        <Box3D
          width={35}
          height={10}
          depth={35}
          x={0}
          y={headY - 20}
          z={0}
          color="#0f172a"
        />
      </div>
    );
  } else if (activeAccessory === "acc-knowledge-crown") {
    renderHeadAcc = (
      // Golden Crown with ruby dots
      <Box3D
        width={49}
        height={12}
        depth={49}
        x={0}
        y={headY - 24}
        z={0}
        color="#fbbf24"
        frontDecal={
          <div className="w-full h-full flex justify-around items-end pb-0.5">
            <span className="size-1 bg-red-600 rounded-full"></span>
            <span className="size-1.5 bg-blue-600 rounded-full mb-0.5"></span>
            <span className="size-1 bg-red-600 rounded-full"></span>
          </div>
        }
        leftDecal={<div className="flex gap-1.5 justify-center"><span className="size-1 bg-red-600 rounded-full"></span></div>}
        rightDecal={<div className="flex gap-1.5 justify-center"><span className="size-1 bg-red-600 rounded-full"></span></div>}
      />
    );
  }

  // Glasses / Visors
  if (activeAccessory === "acc-nerd-glasses") {
    renderFaceGlasses = (
      <Box3D
        width={47}
        height={15}
        depth={2}
        x={0}
        y={headY + 2}
        z={24}
        color="#1f2937"
        frontDecal={
          <div className="w-full h-full flex justify-between px-2 bg-black/10 border border-gray-800">
            <div className="w-4 h-full bg-white/20"></div>
            <div className="w-4 h-full bg-white/20"></div>
          </div>
        }
      />
    );
  } else if (activeAccessory === "vr-glasses") {
    renderFaceGlasses = (
      <Box3D
        width={49}
        height={18}
        depth={8}
        x={0}
        y={headY + 2}
        z={24}
        color="#374151"
        frontDecal={
          <div className="w-full h-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] flex items-center justify-center font-black text-cyan-950 text-[7px]">
            VR READY
          </div>
        }
      />
    );
  }

  // headphones
  if (activeAccessory === "acc-headphones") {
    renderHeadphones = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Left ear cup */}
        <Box3D width={8} height={25} depth={20} x={-25} y={headY} z={0} color="#8b5cf6" />
        {/* Right ear cup */}
        <Box3D width={8} height={25} depth={20} x={25} y={headY} z={0} color="#8b5cf6" />
        {/* Headband bridge */}
        <Box3D width={46} height={4} depth={6} x={0} y={headY - 23} z={0} color="#7c3aed" />
      </div>
    );
  }

  // Back items / Backpacks
  if (activeAccessory === "acc-school-backpack") {
    renderBackpack = (
      <Box3D
        width={44}
        height={50}
        depth={16}
        x={0}
        y={5}
        z={backpackZ}
        color="#dc2626" // red school backpack
        backDecal={
          <div className="w-full h-full p-2 flex flex-col justify-between items-center bg-red-700">
            <div className="w-8 h-4 bg-red-900 border border-red-950 rounded flex justify-center text-[7px] text-gray-300 font-bold">Pocket</div>
            <div className="w-4 h-1.5 bg-black rounded"></div>
          </div>
        }
      />
    );
  } else if (activeAccessory === "acc-science-backpack") {
    renderBackpack = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Glowing glass chemical cylinder */}
        <Box3D
          width={28}
          height={48}
          depth={24}
          x={0}
          y={5}
          z={backpackZ + 1}
          color="#06b6d4"
          backDecal={
            <div className="w-full h-full bg-emerald-400/90 shadow-[0_0_12px_#34d399] flex flex-col justify-around items-center">
              <span className="text-[7px] font-black text-emerald-950">CHEM VIAL</span>
              <div className="flex gap-1">
                <span className="size-1 rounded-full bg-white animate-ping"></span>
                <span className="size-1 rounded-full bg-white animate-ping delay-75"></span>
              </div>
            </div>
          }
        />
        {/* Copper straps */}
        <Box3D width={torsoW + 4} height={4} depth={torsoD + 2} x={0} y={isGirl ? -9 : -10} z={isGirl ? -8 : -10} color="#b45309" />
        <Box3D width={torsoW + 4} height={4} depth={torsoD + 2} x={0} y={isGirl ? 13 : 15} z={isGirl ? -8 : -10} color="#b45309" />
      </div>
    );
  } else if (activeAccessory === "acc-college-backpack") {
    renderBackpack = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Red book */}
        <Box3D width={38} height={12} depth={32} x={0} y={isGirl ? -4 : -5} z={backpackZ + 2} color="#dc2626"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-red-900 select-none">MATH</div>} />
        {/* Green book */}
        <Box3D width={36} height={12} depth={30} x={0} y={isGirl ? 4 : 5} z={backpackZ + 2} color="#16a34a"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-green-900 select-none">SCI</div>} />
        {/* Blue book */}
        <Box3D width={40} height={12} depth={34} x={0} y={isGirl ? 13 : 15} z={backpackZ + 2} color="#2563eb"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-blue-900 select-none">HIST</div>} />
      </div>
    );
  }

  // Extra hand-held educational accessories
  let renderHandHeld = null;
  if (activeAccessory === "acc-education-globe") {
    renderHandHeld = (
      // Globe floating near left hand (screen right)
      <Box3D
        width={20}
        height={20}
        depth={20}
        x={50}
        y={15}
        z={12}
        color="#2563eb"
        className="animate-bounce"
        frontDecal={<div className="size-full bg-emerald-500 rounded-full border border-blue-600 text-[6px] text-center font-bold text-white flex items-center justify-center">🌎</div>}
      />
    );
  } else if (activeAccessory === "acc-floating-book") {
    renderHandHeld = (
      // Open magic book hovering near hand
      <div className="animate-pulse" style={{ transformStyle: "preserve-3d" }}>
        <Box3D
          width={28}
          height={4}
          depth={22}
          x={-50}
          y={15}
          z={12}
          color="#7c3aed"
          topDecal={
            <div className="w-full h-full bg-amber-50 p-0.5 text-[5px] text-amber-950 font-serif leading-none flex justify-around">
              <div>A=πr²<br/>x=-b±√...</div>
              <div className="border-l border-amber-200 pl-0.5">∑x/n<br/>E=mc²</div>
            </div>
          }
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // Pets
  // ----------------------------------------------------
  let renderPet = null;
  if (c.pet === "pet-owl") {
    renderPet = (
      // Pixelated 3D Owl hovering near left shoulder (screen right)
      <div className="animate-bounce" style={{ transformStyle: "preserve-3d" }}>
        {/* Owl body */}
        <Box3D
          width={18}
          height={22}
          depth={18}
          x={52}
          y={-30}
          z={10}
          color="#78350f" // brown owl
          frontDecal={
            <div className="w-full h-full p-1 flex flex-col justify-between items-center bg-amber-900 rounded select-none">
              <div className="flex justify-between w-full px-1">
                {/* Massive cute owl eyes */}
                <div className="size-3.5 rounded-full bg-yellow-400 border border-black flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-black"></div>
                </div>
                <div className="size-3.5 rounded-full bg-yellow-400 border border-black flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-black"></div>
                </div>
              </div>
              {/* Cute beak */}
              <div className="w-2 h-1 bg-amber-500 rounded-b"></div>
              {/* Scholarly mini spectacles */}
              <div className="w-7 h-1.5 bg-black/10 border-t border-black"></div>
            </div>
          }
        />
        {/* Owl small wings */}
        <Box3D width={4} height={12} depth={10} x={63} y={-30} z={10} color="#92400e" />
        <Box3D width={4} height={12} depth={10} x={41} y={-30} z={10} color="#92400e" />

        {/* Tiny Owl 3D Graduation Cap (Birrete) */}
        {/* Diamond flat top plate */}
        <Box3D
          width={22}
          height={1.5}
          depth={22}
          x={52}
          y={-44}
          z={10}
          color="#1e2937"
          rightDecal={<div className="w-1 h-4 bg-yellow-400 absolute right-1 top-0"></div>}
        />
        {/* Cap skull cylinder base */}
        <Box3D
          width={11}
          height={4}
          depth={11}
          x={52}
          y={-42}
          z={10}
          color="#0f172a"
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // Auras
  // ----------------------------------------------------
  const renderAura = () => {
    if (c.aura === "aura-golden") {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none transform-style-3d">
          {/* Golden floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute size-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15] animate-ping"
              style={{
                left: `${20 + Math.sin(i * 45) * 60 + 60}px`,
                top: `${40 + Math.cos(i * 45) * 80 + 80}px`,
                animationDelay: `${i * 150}ms`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>
      );
    } else if (c.aura === "aura-math") {
      const symbols = ["π", "∑", "x", "÷", "√", "E=mc²", "1+1=2", "θ"];
      return (
        <div className="absolute inset-0 z-0 pointer-events-none transform-style-3d">
          {symbols.map((s, i) => (
            <div
              key={i}
              className="absolute font-mono text-[9px] font-bold text-cyan-400/90 shadow-sm animate-pulse"
              style={{
                left: `${30 + Math.sin(i) * 55 + 55}px`,
                top: `${20 + (i * 25)}px`,
                animationDelay: `${i * 200}ms`,
                animationDuration: "2s",
                transform: `translateZ(${Math.cos(i) * 30}px)`,
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

  // ----------------------------------------------------
  // Hair Blocks Render
  // ----------------------------------------------------
  const renderHair = () => {
    // Determine details
    const style = c.hairStyle;
    return (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Main top cap */}
        <Box3D width={48} height={12} depth={48} x={0} y={-81} z={0} color={activeHairHex} />
        {/* Back cap */}
        <Box3D width={48} height={28} depth={12} x={0} y={-66} z={-18} color={activeHairHex} />

        {/* Style specific blocks */}
        {style === "hair-short" && (
          <>
            {/* Front fringe spikes */}
            <Box3D width={12} height={12} depth={10} x={-14} y={-74} z={19} color={activeHairHex} />
            <Box3D width={14} height={14} depth={10} x={0} y={-72} z={20} color={activeHairHex} />
            <Box3D width={12} height={12} depth={10} x={14} y={-74} z={19} color={activeHairHex} />
            {/* Sideburns */}
            <Box3D width={8} height={16} depth={14} x={-20} y={-58} z={10} color={activeHairHex} />
            <Box3D width={8} height={16} depth={14} x={20} y={-58} z={10} color={activeHairHex} />
          </>
        )}

        {style === "hair-long" && (
          <>
            {/* Long flowing locks behind shoulders */}
            <Box3D width={12} height={60} depth={32} x={-18} y={-45} z={-5} color={activeHairHex} />
            <Box3D width={12} height={60} depth={32} x={18} y={-45} z={-5} color={activeHairHex} />
          </>
        )}

        {style === "hair-straight" && (
          <>
            {/* Straight lock sides */}
            <Box3D width={10} height={42} depth={26} x={-19} y={-55} z={5} color={activeHairHex} />
            <Box3D width={10} height={42} depth={26} x={19} y={-55} z={5} color={activeHairHex} />
          </>
        )}

        {style === "hair-wavy" && (
          <>
            {/* Layered wavy curls */}
            <Box3D width={13} height={38} depth={28} x={-19} y={-56} z={6} color={activeHairHex} />
            <Box3D width={13} height={38} depth={28} x={19} y={-56} z={6} color={activeHairHex} />
            <Box3D width={16} height={16} depth={16} x={-19} y={-40} z={0} color={activeHairHex} />
            <Box3D width={16} height={16} depth={16} x={19} y={-40} z={0} color={activeHairHex} />
          </>
        )}

        {style === "hair-curly" && (
          <>
            {/* Bunch of mini hair curls */}
            <Box3D width={15} height={15} depth={15} x={-20} y={-76} z={15} color={activeHairHex} />
            <Box3D width={15} height={15} depth={15} x={20} y={-76} z={15} color={activeHairHex} />
            <Box3D width={15} height={15} depth={15} x={-22} y={-66} z={0} color={activeHairHex} />
            <Box3D width={15} height={15} depth={15} x={22} y={-66} z={0} color={activeHairHex} />
            <Box3D width={16} height={16} depth={16} x={0} y={-86} z={10} color={activeHairHex} />
          </>
        )}

        {style === "hair-afro" && (
          <>
            {/* Large rounded block enclosing head */}
            <Box3D width={58} height={52} depth={54} x={0} y={-66} z={0} color={activeHairHex} />
          </>
        )}

        {style === "hair-braids" && (
          <>
            {/* Long thin braids cascading left and right */}
            <Box3D width={8} height={58} depth={8} x={-19} y={-40} z={8} color={activeHairHex} />
            <Box3D width={8} height={58} depth={8} x={19} y={-40} z={8} color={activeHairHex} />
          </>
        )}

        {style === "hair-pigtails" && (
          <>
            {/* Double side hair buns / tails */}
            <Box3D width={16} height={20} depth={16} x={-26} y={-78} z={-6} color={activeHairHex} />
            <Box3D width={16} height={20} depth={16} x={26} y={-78} z={-6} color={activeHairHex} />
          </>
        )}

        {style === "hair-bangs" && (
          <>
            {/* Fringe block covering upper forehead */}
            <Box3D width={48} height={12} depth={6} x={0} y={-72} z={20.5} color={activeHairHex} />
          </>
        )}

        {/* Highlights overlay blocks (mechas personalizadas) */}
        {highlightHex && (
          <>
            {/* Main top highlights */}
            <Box3D width={28} height={3} depth={28} x={0} y={-82.5} z={6} color={highlightHex} />
            {/* Hairstyle specific highlights */}
            {style === "hair-short" && (
              <>
                <Box3D width={8} height={8} depth={2} x={-14} y={-71} z={20} color={highlightHex} />
                <Box3D width={10} height={10} depth={2} x={0} y={-69} z={21} color={highlightHex} />
                <Box3D width={8} height={8} depth={2} x={14} y={-71} z={20} color={highlightHex} />
              </>
            )}
            {style === "hair-long" && (
              <>
                <Box3D width={4} height={42} depth={10} x={-19.5} y={-45} z={2} color={highlightHex} />
                <Box3D width={4} height={42} depth={10} x={19.5} y={-45} z={2} color={highlightHex} />
              </>
            )}
            {style === "hair-straight" && (
              <>
                <Box3D width={3} height={35} depth={8} x={-20.5} y={-50} z={8} color={highlightHex} />
                <Box3D width={3} height={35} depth={8} x={20.5} y={-50} z={8} color={highlightHex} />
              </>
            )}
            {style === "hair-wavy" && (
              <>
                <Box3D width={4} height={28} depth={12} x={-20.5} y={-50} z={10} color={highlightHex} />
                <Box3D width={4} height={28} depth={12} x={20.5} y={-50} z={10} color={highlightHex} />
              </>
            )}
            {style === "hair-curly" && (
              <>
                <Box3D width={8} height={8} depth={8} x={-21} y={-73} z={16} color={highlightHex} />
                <Box3D width={8} height={8} depth={8} x={21} y={-73} z={16} color={highlightHex} />
              </>
            )}
            {style === "hair-afro" && (
              <>
                <Box3D width={42} height={12} depth={42} x={0} y={-87} z={0} color={highlightHex} />
              </>
            )}
            {style === "hair-braids" && (
              <>
                <Box3D width={4} height={38} depth={4} x={-20} y={-40} z={9} color={highlightHex} />
                <Box3D width={4} height={38} depth={4} x={20} y={-40} z={9} color={highlightHex} />
              </>
            )}
            {style === "hair-pigtails" && (
              <>
                <Box3D width={10} height={10} depth={10} x={-27} y={-75} z={-5} color={highlightHex} />
                <Box3D width={10} height={10} depth={10} x={27} y={-75} z={-5} color={highlightHex} />
              </>
            )}
            {style === "hair-bangs" && (
              <>
                <Box3D width={34} height={4} depth={2} x={0} y={-69} z={21.5} color={highlightHex} />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[280px] h-[340px] mx-auto">
      {/* 3D Viewport container */}
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
            setYaw(startYaw + deltaX * 0.8);
            setPitch(Math.max(-45, Math.min(45, startPitch - deltaY * 0.8)));
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
            setYaw(startYaw + deltaX * 0.8);
            setPitch(Math.max(-45, Math.min(45, startPitch - deltaY * 0.8)));
          };

          const handleTouchEnd = () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          };

          document.addEventListener("touchmove", handleTouchMove);
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        {/* Render Background Aura Elements */}
        {renderAura()}

        {/* Master character 3D root block */}
        <div
          className="relative w-1 h-1 select-none pointer-events-none transition-transform duration-75"
          style={{
            transform: `scale(${scale}) rotateX(${pitch}deg) rotateY(${yaw}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Real 3D Floor Shadow */}
          <div
            className="absolute size-[160px] rounded-full"
            style={{
              left: "-80px",
              top: "-80px",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 70%)",
              transform: "rotateX(90deg) translate3d(0, 0, -112px)",
            }}
          />

          {/* HEAD */}
          <Box3D
            width={44}
            height={44}
            depth={44}
            x={0}
            y={headY}
            z={0}
            color={activeSkinHex}
            frontDecal={renderFaceDecal()}
          />

          {/* HAIR STYLING */}
          {renderHair()}

          {/* HEADWEAR (Mortarboard, Crown, etc.) */}
          {renderHeadAcc}

          {/* FACE ACCESSORIES (Glasses, Visors) */}
          {renderFaceGlasses}

          {/* OVERHEAD ACCESSORIES (Headphones) */}
          {renderHeadphones}

          {/* TORSO */}
          <Box3D
            width={torsoW}
            height={torsoH}
            depth={torsoD}
            x={0}
            y={-1}
            z={0}
            color={shirtColor}
            frontDecal={shirtDecal}
          />

          {/* CAPE DECAL FOR ACADEMIC LEGEND */}
          {capeDecal}

          {/* BACKPACK */}
          {renderBackpack}

          {/* LEFT ARM (Character Left is screen Right = positive X) */}
          <Box3D
            width={armW}
            height={armH}
            depth={armD}
            x={armX}
            y={0}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  {/* Short sleeve segment */}
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
            backDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* RIGHT ARM (Character Right is screen Left = negative X) */}
          <Box3D
            width={armW}
            height={armH}
            depth={armD}
            x={-armX}
            y={0}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  {/* Short sleeve segment */}
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
            backDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="w-full" style={{ height: `${Math.round(armH * 0.33)}px`, backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* PLATED SKIRT BLOCK (renders around the upper legs) */}
          {isSkirt && (
            <Box3D
              width={isGirl ? 54 : 64}
              height={18}
              depth={isGirl ? 30 : 34}
              x={0}
              y={skirtY}
              z={0}
              color={pantsColor}
            />
          )}

          {/* LEFT LEG (positive X) */}
          <Box3D
            width={legW}
            height={legH}
            depth={legD}
            x={legX}
            y={legY}
            z={0}
            color={pantsColor}
            // Shoe at bottom
            frontDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full border-t border-white" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            leftDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            rightDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            backDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
          />

          {/* RIGHT LEG (negative X) */}
          <Box3D
            width={legW}
            height={legH}
            depth={legD}
            x={-legX}
            y={legY}
            z={0}
            color={pantsColor}
            // Shoe at bottom
            frontDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full border-t border-white" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            leftDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            rightDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
            backDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="w-full" style={{ height: `${Math.round(legH * 0.19)}px`, backgroundColor: shoesColor }} />
              </div>
            }
          />

          {/* HAND HELD ITEMS */}
          {renderHandHeld}

          {/* COMPANION PET OWL */}
          {renderPet}
        </div>
      </div>

      {/* Rotation Interface Controls Overlay */}
      <div className="absolute bottom-4 inset-x-2 flex justify-center gap-1.5 z-20">
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => prev - 45);
          }}
          className="size-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted font-bold text-xs text-foreground cursor-pointer shadow-sm active:scale-95"
          title="Girar Izquierda"
        >
          🔄
        </button>
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3.5 h-8 rounded-xl border flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm active:scale-95 ${
            isRotating ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
          }`}
        >
          {isRotating ? "Pausar" : "Auto Girar"}
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => prev + 45);
          }}
          className="size-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted font-bold text-xs text-foreground cursor-pointer shadow-sm active:scale-95"
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
          className="px-2 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted font-bold text-xs text-foreground cursor-pointer shadow-sm active:scale-95"
        >
          Reiniciar
        </button>
      </div>

      {/* Small drag instructions */}
      <span className="absolute top-2 right-2 text-[9px] font-medium tracking-wide text-muted-foreground uppercase bg-card/65 px-1.5 py-0.5 rounded shadow-[var(--shadow-card)]">
        Arrastra para rotar
      </span>
    </div>
  );
}
