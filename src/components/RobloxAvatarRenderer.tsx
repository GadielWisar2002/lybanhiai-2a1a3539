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
  };

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
          <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
            {/* Intellect eyes */}
            <circle cx="30" cy="40" r="10" stroke="#000" strokeWidth="4" />
            <circle cx="70" cy="40" r="10" stroke="#000" strokeWidth="4" />
            <line x1="40" y1="40" x2="60" y2="40" stroke="#000" strokeWidth="4" />
            <path d="M40 70 Q50 80 60 70" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Blushing */}
            <circle cx="20" cy="55" r="4" fill="#f43f5e" opacity="0.4" />
            <circle cx="80" cy="55" r="4" fill="#f43f5e" opacity="0.4" />
          </svg>
        );
      case "face-excited":
        return (
          <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
            {/* Star eyes */}
            <polygon points="30,22 33,32 43,32 35,38 38,48 30,42 22,48 25,38 17,32 27,32" fill="#eab308" />
            <polygon points="70,22 73,32 83,32 75,38 78,48 70,42 62,48 65,38 57,32 67,32" fill="#eab308" />
            {/* Laughing mouth */}
            <path d="M30 65 Q50 90 70 65 Z" fill="#991b1b" stroke="#000" strokeWidth="2" />
            <path d="M40 67 Q50 78 60 67" fill="#fff" />
          </svg>
        );
      case "face-cool":
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none">
            {/* Sunglasses */}
            <polygon points="15,35 48,35 44,55 22,55" fill="#111" stroke="#000" strokeWidth="2" />
            <polygon points="52,35 85,35 78,55 56,55" fill="#111" stroke="#000" strokeWidth="2" />
            <line x1="45" y1="42" x2="55" y2="42" stroke="#111" strokeWidth="4" />
            {/* Cool smirk */}
            <path d="M45 72 Q58 75 65 67" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-wink":
        return (
          <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
            {/* Left Eye winking */}
            <path d="M20 42 Q30 38 40 42" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Right Eye open */}
            <circle cx="70" cy="40" r="7" fill="#000" />
            <circle cx="68" cy="38" r="2.5" fill="#fff" />
            {/* Playful mouth */}
            <path d="M35 65 Q50 82 65 65" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-curious":
        return (
          <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
            {/* Left eyebrow raised */}
            <path d="M20 28 Q30 22 40 28" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="30" cy="42" r="6" fill="#000" />
            {/* Right eye */}
            <circle cx="70" cy="42" r="6" fill="#000" />
            {/* Wry mouth */}
            <path d="M35 72 Q55 64 65 72" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        );
      case "face-happy":
      default:
        return (
          <svg className="w-full h-full p-2" viewBox="0 0 100 100" fill="none">
            {/* Simple cute blocky eyes */}
            <rect x="25" y="32" width="10" height="15" rx="3" fill="#000" />
            <rect x="65" y="32" width="10" height="15" rx="3" fill="#000" />
            <circle cx="28" cy="36" r="2.5" fill="#fff" />
            <circle cx="68" cy="36" r="2.5" fill="#fff" />
            {/* Cute smile */}
            <path d="M35 60 Q50 78 65 60" stroke="#000" strokeWidth="5" strokeLinecap="round" fill="none" />
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
        width={58}
        height={85}
        depth={4}
        x={0}
        y={8}
        z={-17}
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
      shirtDecal = (
        <div className="relative h-full w-full p-2 flex flex-col justify-between">
          {/* Inner chemical teal shirt */}
          <div className="w-6 h-5 bg-emerald-500 mx-auto rounded-b border-x-2 border-white flex items-center justify-center text-[8px] text-white">🧪</div>
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
      shirtDecal = (
        <div className="h-full w-full p-2 flex flex-col justify-between relative">
          <div className="flex items-start justify-between">
            {/* Big gold L badge */}
            <div className="size-7 rounded bg-amber-500 border border-amber-600 flex items-center justify-center text-xs font-black text-amber-950 shadow-sm leading-none font-display">L</div>
            <div className="w-1.5 h-6 bg-gray-200 rounded"></div>
          </div>
          {/* Striped bottom waistband */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-yellow-400 to-blue-900 rounded"></div>
        </div>
      );
    } else if (activeShirt === "shirt-basic-hoodie") {
      shirtColor = "#4b5563"; // dark gray hoodie
      armColor = "#4b5563";
      hasLongSleeves = true;
      shirtDecal = (
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
      shirtDecal = (
        <div className="h-full w-full p-2 flex flex-col justify-between items-center text-center">
          <div className="flex flex-col items-center mt-2">
            {/* graduation mortarboard logo */}
            <span className="text-xl leading-none">🎓</span>
            <span className="text-[7px] font-bold tracking-widest text-blue-100 uppercase mt-0.5">LYBANHI</span>
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
          y={-85}
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
          y={-80}
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
        y={-84}
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
        y={-58}
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
        y={-58}
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
        <Box3D width={8} height={25} depth={20} x={-25} y={-60} z={0} color="#8b5cf6" />
        {/* Right ear cup */}
        <Box3D width={8} height={25} depth={20} x={25} y={-60} z={0} color="#8b5cf6" />
        {/* Headband bridge */}
        <Box3D width={46} height={4} depth={6} x={0} y={-83} z={0} color="#7c3aed" />
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
        z={-24}
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
          z={-23}
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
        <Box3D width={34} height={4} depth={30} x={0} y={-10} z={-10} color="#b45309" />
        <Box3D width={34} height={4} depth={30} x={0} y={15} z={-10} color="#b45309" />
      </div>
    );
  } else if (activeAccessory === "acc-college-backpack") {
    renderBackpack = (
      <div style={{ transformStyle: "preserve-3d" }}>
        {/* Red book */}
        <Box3D width={38} height={12} depth={32} x={0} y={-5} z={-22} color="#dc2626"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-red-900 select-none">MATH</div>} />
        {/* Green book */}
        <Box3D width={36} height={12} depth={30} x={0} y={5} z={-22} color="#16a34a"
          backDecal={<div className="w-full h-full flex justify-end pr-1 text-[8px] font-bold text-white bg-green-900 select-none">SCI</div>} />
        {/* Blue book */}
        <Box3D width={40} height={12} depth={34} x={0} y={15} z={-22} color="#2563eb"
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
            {/* Bunch of mini hair spheres/cubes representing tight curls */}
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

        {/* Highlights overlay blocks */}
        {highlightHex && (
          <Box3D
            width={34}
            height={4}
            depth={34}
            x={0}
            y={-82}
            z={8}
            color={highlightHex}
          />
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
            y={-60}
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
            width={58}
            height={74}
            depth={28}
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
            width={18}
            height={72}
            depth={18}
            x={39}
            y={0}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  {/* Short sleeve segment */}
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            leftDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            rightDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            backDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* RIGHT ARM (Character Right is screen Left = negative X) */}
          <Box3D
            width={18}
            height={72}
            depth={18}
            x={-39}
            y={0}
            z={0}
            color={hasLongSleeves ? armColor : activeSkinHex}
            topDecal={<div className="size-full" style={{ backgroundColor: armColor }} />}
            frontDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  {/* Short sleeve segment */}
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            leftDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            rightDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
            backDecal={
              !hasLongSleeves ? (
                <div className="w-full h-full flex flex-col">
                  <div className="h-[24px] w-full" style={{ backgroundColor: armColor }} />
                  <div className="flex-1 w-full" />
                </div>
              ) : undefined
            }
          />

          {/* PLATED SKIRT BLOCK (renders around the upper legs) */}
          {isSkirt && (
            <Box3D
              width={64}
              height={18}
              depth={34}
              x={0}
              y={43}
              z={0}
              color={pantsColor}
            />
          )}

          {/* LEFT LEG (positive X) */}
          <Box3D
            width={22}
            height={72}
            depth={22}
            x={14}
            y={72}
            z={0}
            color={pantsColor}
            // Shoe at bottom
            frontDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full border-t border-white" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            leftDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            rightDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            backDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
              </div>
            }
          />

          {/* RIGHT LEG (negative X) */}
          <Box3D
            width={22}
            height={72}
            depth={22}
            x={-14}
            y={72}
            z={0}
            color={pantsColor}
            // Shoe at bottom
            frontDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full border-t border-white" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            leftDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            rightDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
              </div>
            }
            backDecal={
              <div className="w-full h-full flex flex-col justify-end">
                <div className="h-[14px] w-full" style={{ backgroundColor: shoesColor }} />
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
