import React, { useState, useEffect } from "react";

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
  gender?: string; // boy = Masculino, girl = Femenino
  bodyType?: string; // delgado, normal, atletico, robusto
  zoom?: number;
  viewMode?: "body" | "clothes" | "animation" | "expressions";
}

interface RobloxAvatarRendererProps {
  config: AvatarConfig | null;
  scale?: number;
  autoRotate?: boolean;
}

// Helper to lighten/darken hex colors dynamically for 3D gradient shading
function adjustColor(hex: string, percent: number): string {
  let cleanedHex = hex.replace(/^\s*#|\s*$/g, "");
  if (cleanedHex.length === 3) {
    cleanedHex = cleanedHex.replace(/(.)/g, "$1$1");
  }
  let r = parseInt(cleanedHex.substring(0, 2), 16);
  let g = parseInt(cleanedHex.substring(2, 4), 16);
  let b = parseInt(cleanedHex.substring(4, 6), 16);

  r = Math.min(255, Math.max(0, r + (r * percent) / 100));
  g = Math.min(255, Math.max(0, g + (g * percent) / 100));
  b = Math.min(255, Math.max(0, b + (b * percent) / 100));

  const rr = Math.round(r).toString(16).padStart(2, "0");
  const gg = Math.round(g).toString(16).padStart(2, "0");
  const bb = Math.round(b).toString(16).padStart(2, "0");

  return `#${rr}${gg}${bb}`;
}

export function RobloxAvatarRenderer({
  config,
  scale = 1.0,
  autoRotate = false,
}: RobloxAvatarRendererProps) {
  const [yaw, setYaw] = useState(-15);
  const [isRotating, setIsRotating] = useState(autoRotate);

  const c = {
    skinColor: config?.skinColor || "#E8A87C",
    hairStyle: config?.hairStyle || "hair-short",
    hairColor: config?.hairColor || "#3B1F0A",
    hairHighlight: config?.hairHighlight || "hl-none",
    face: config?.face || "face-happy",
    shirt: config?.shirt || "shirt-academic-jacket",
    pants: config?.pants || "pants-basic-jeans",
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    pet: config?.pet || "",
    aura: config?.aura || "",
    outfit: config?.outfit || "",
    gender: config?.gender || "boy", // boy = Masculino, girl = Femenino
    bodyType: config?.bodyType || "delgado",
    zoom: config?.zoom || 1.0,
    viewMode: config?.viewMode || "body",
  };

  const isGirl = c.gender === "girl";

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 1.0) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Parallax offsets based on rotation angle (yaw)
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const isFront = cos >= 0;

  const pxFac = sin;
  const headX = pxFac * 6;
  const eyesX = pxFac * 8;
  const hairFrontX = pxFac * 6.5;
  const hairBackX = -pxFac * 3.5;
  const chestX = pxFac * 4.0;
  const armsX = pxFac * 2.5;
  const feetX = pxFac * 1.2;
  const backpackX = -pxFac * 7.5;
  const shadowX = pxFac * 2.0;

  // Body Type scale adjustment factors
  let bodyWidthScale = 1.0;
  let bodyHeightScale = 1.0;
  if (c.bodyType === "normal") {
    bodyWidthScale = 1.04;
  } else if (c.bodyType === "atletico") {
    bodyWidthScale = 1.10;
    bodyHeightScale = 1.02;
  } else if (c.bodyType === "robusto") {
    bodyWidthScale = 1.18;
    bodyHeightScale = 0.97;
  }

  // Dynamic Skin Shading colors
  const skinBase = c.skinColor;
  const skinShadow = adjustColor(skinBase, -24);
  const skinHighlight = adjustColor(skinBase, 18);

  // Dynamic Hair Shading colors
  const hairBase = c.hairColor;
  const hairShadow = adjustColor(hairBase, -45);
  const hairHighlight = adjustColor(hairBase, 30);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-full min-h-[360px] overflow-hidden">
      <svg
        viewBox="0 0 200 420"
        className="w-full h-full max-h-[420px]"
        style={{
          transform: `scale(${scale * c.zoom})`,
          transition: "transform 0.3s ease-out",
        }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startYaw = yaw;
          setIsRotating(false);
          const handleMouseMove = (mv: MouseEvent) => {
            const deltaX = mv.clientX - startX;
            setYaw((startYaw + deltaX * 0.85) % 360);
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
          const startYaw = yaw;
          setIsRotating(false);
          const handleTouchMove = (mv: TouchEvent) => {
            if (mv.touches.length === 0) return;
            const deltaX = mv.touches[0].clientX - startX;
            setYaw((startYaw + deltaX * 0.85) % 360);
          };
          const handleTouchEnd = () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          };
          document.addEventListener("touchmove", handleTouchMove);
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        <defs>
          {/* Hologram Stage Filters */}
          <filter id="neon-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="rim-light-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#00B4FF" floodOpacity="0.25" />
          </filter>

          {/* Dynamic Gradients for Skin */}
          <radialGradient id="skin-face-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={skinHighlight} />
            <stop offset="60%" stopColor={skinBase} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>

          <linearGradient id="skin-neck-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skinShadow} />
            <stop offset="40%" stopColor={skinBase} />
            <stop offset="100%" stopColor={skinShadow} />
          </linearGradient>

          {/* Dynamic Gradients for Hair */}
          <linearGradient id="hair-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hairHighlight} />
            <stop offset="50%" stopColor={hairBase} />
            <stop offset="100%" stopColor={hairShadow} />
          </linearGradient>

          {/* 3D Clothing Gradients */}
          <linearGradient id="jacket-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3066" />
            <stop offset="35%" stopColor="#142147" />
            <stop offset="100%" stopColor="#080D21" />
          </linearGradient>

          <linearGradient id="jacket-sleeves-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#ECEFF1" />
            <stop offset="100%" stopColor="#B0BEC5" />
          </linearGradient>

          <linearGradient id="hoodie-white-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F5F7FA" />
            <stop offset="100%" stopColor="#D2D6DC" />
          </linearGradient>

          <linearGradient id="skirt-checkers" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F1D3A" />
            <stop offset="50%" stopColor="#1A2D5E" />
            <stop offset="100%" stopColor="#0D162B" />
          </linearGradient>

          <linearGradient id="pants-cargo-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A2A2A" />
            <stop offset="60%" stopColor="#1B1B1B" />
            <stop offset="100%" stopColor="#0C0C0C" />
          </linearGradient>

          {/* Subtle 3D shading overlays */}
          <linearGradient id="shadow-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Iris Radial Gradient */}
          <radialGradient id="iris-grad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#63B3ED" />
            <stop offset="55%" stopColor="#3182CE" />
            <stop offset="100%" stopColor="#1A365D" />
          </radialGradient>

          {/* Platform radial light */}
          <radialGradient id="halo-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00B4FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#080D24" stopOpacity="0" />
          </radialGradient>

          {/* Breath & Hair Oscillation Styles */}
          <style>
            {`
              @keyframes idle-breath-cycle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3.5px); }
              }
              @keyframes hair-sway-cycle {
                0%, 100% { transform: rotate(-1.2deg); }
                50% { transform: rotate(1.2deg); }
              }
              @keyframes eye-blink-cycle {
                0%, 96%, 100% { transform: scaleY(1); }
                98% { transform: scaleY(0.08); }
              }
              .anime-rig-body {
                animation: ${c.viewMode === "animation" ? "idle-breath-cycle 3s ease-in-out infinite" : "none"};
                transform-origin: 100px 380px;
              }
              .anime-hair-sway {
                animation: ${c.viewMode === "animation" ? "hair-sway-cycle 4s ease-in-out infinite" : "none"};
                transform-origin: 100px 75px;
              }
              .anime-eye-blink {
                transform-origin: 100px 88px;
                animation: eye-blink-cycle 4.5s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Círculo de luz neón azul eléctrico (Halo de plataforma en el suelo) */}
        <g transform="translate(0, 10)">
          {/* Glow diffusor */}
          <ellipse cx="100" cy="385" rx="55" ry="12" fill="url(#halo-radial)" opacity="0.8" />
          {/* Main neón ring */}
          <ellipse
            cx="100"
            cy="385"
            rx="50"
            ry="11"
            fill="none"
            stroke="#00B4FF"
            strokeWidth="2.5"
            filter="url(#neon-glow-filter)"
            opacity="0.9"
          />
          {/* Inner accent ring */}
          <ellipse
            cx="100"
            cy="385"
            rx="32"
            ry="7"
            fill="none"
            stroke="#3B6DE8"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>

        {/* Partículas flotantes sutiles */}
        <g opacity="0.45" stroke="none">
          <circle cx="50" cy="340" r="1.5" fill="#00B4FF" />
          <circle cx="155" cy="360" r="1" fill="#FFFFFF" />
          <circle cx="35" cy="380" r="2.2" fill="#00B4FF" />
          <circle cx="165" cy="320" r="1.8" fill="#3B6DE8" />
          <circle cx="70" cy="390" r="1" fill="#FFFFFF" />
          <circle cx="130" cy="378" r="1.5" fill="#00B4FF" />
        </g>

        {/* Aura / VFX effects */}
        {c.aura === "aura-golden" && (
          <g filter="url(#neon-glow-filter)" opacity="0.75" className="anime-rig-body">
            <circle cx="100" cy="180" r="90" fill="none" stroke="#FFD700" strokeWidth="2.2" strokeDasharray="6 14" />
            <circle cx="100" cy="180" r="65" fill="none" stroke="#FFA500" strokeWidth="1.2" strokeDasharray="4 10" />
          </g>
        )}
        {c.aura === "aura-math" && (
          <g filter="url(#neon-glow-filter)" opacity="0.6" stroke="#00B4FF" strokeWidth="1.2" fill="none" className="font-mono text-[7px] font-bold">
            <circle cx="100" cy="180" r="80" strokeDasharray="3 15" />
            <text x="40" y="110" fill="#00B4FF" stroke="none">E = mc²</text>
            <text x="140" y="130" fill="#00B4FF" stroke="none">π ≈ 3.14</text>
            <text x="32" y="240" fill="#00B4FF" stroke="none">x² + y² = r²</text>
            <text x="135" y="250" fill="#00B4FF" stroke="none">∫ f(x)dx</text>
          </g>
        )}

        {/* Sombra del personaje proyectada en el suelo */}
        <ellipse cx={`${100 + shadowX}`} cy="384" rx="28" ry="6.5" fill="#000000" opacity="0.45" />

        {/* =======================================================
            AVATAR ROOT GROUP WITH BREATHING & PARALLAX ROTATION
            ======================================================= */}
        <g className="anime-rig-body" filter="url(#rim-light-shadow)" transform={`scale(${bodyWidthScale}, ${bodyHeightScale}) translate(${100 * (1 - bodyWidthScale) / bodyWidthScale}, ${380 * (1 - bodyHeightScale) / bodyHeightScale})`}>
          
          {/* 1. BACK HAIR LAYER (Behind everything) - DISABLED */}
          {false && isFront && (
            <g transform={`translate(${hairBackX}, 0)`} className="anime-hair-sway">
              {(c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-pigtails" || c.hairStyle === "hair-braids" || c.hairStyle === "hair-female-modern") && (
                <g>
                  {/* Outer volume */}
                  <path
                    d="M 68,90 C 58,110 50,145 52,210 C 54,230 65,245 74,250 C 72,210 75,170 82,130 C 82,130 118,130 118,130 C 125,170 128,210 126,250 C 135,245 146,230 148,210 C 150,145 142,110 132,90 Z"
                    fill="url(#hair-main-grad)"
                  />
                  {/* Shadowed interior locks */}
                  <path
                    d="M 74,100 C 65,120 62,150 64,200 C 66,220 73,230 80,230 C 78,190 82,150 88,120 L 112,120 C 118,150 122,190 120,230 C 127,230 134,220 136,200 C 138,150 135,120 126,100 Z"
                    fill={hairShadow}
                  />
                  {/* Pink/Reddish highlight tips for female default style */}
                  {isGirl && (
                    <g opacity="0.65">
                      <path d="M 52,190 C 53,210 65,245 74,250 C 72,225 70,210 64,195 Z" fill="#E83B8E" />
                      <path d="M 148,190 C 147,210 135,245 126,250 C 128,225 130,210 136,195 Z" fill="#E83B8E" />
                    </g>
                  )}
                </g>
              )}
            </g>
          )}

          {/* 2. BACKPACK LAYER (Rear view / Side attachment) */}
          {isFront && c.accessory.includes("backpack") && (
            <g transform={`translate(${backpackX}, 0)`}>
              {/* If male: backpack over left shoulder (visible on the left side) */}
              {!isGirl && (
                <g>
                  {/* Black varsity backpack hanging left */}
                  <path d="M 64,170 C 58,170 52,180 50,195 L 48,240 C 48,252 56,260 64,260 L 76,260 C 82,260 86,252 86,240 L 84,195 C 82,180 76,170 70,170 Z" fill="#1C1E24" stroke="#0D0E10" strokeWidth="1.5" />
                  <path d="M 50,195 L 84,195 L 82,230 L 52,230 Z" fill="#2E313D" />
                  {/* Strap over shoulder */}
                  <path d="M 74,152 C 74,152 68,162 66,176 C 65,188 66,202 66,202" fill="none" stroke="#121316" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )}

              {/* If female: backpack on both shoulders (central rear/side view) */}
              {isGirl && (
                <g>
                  <rect x="74" y="165" width="52" height="60" rx="12" fill="#1B1B1D" stroke="#000000" strokeWidth="1.5" />
                  <rect x="80" y="172" width="40" height="42" rx="6" fill="#E83B8E" />
                  {/* Straps */}
                  <path d="M 80,165 C 80,150 86,145 88,165" fill="none" stroke="#2D2D30" strokeWidth="4.5" />
                  <path d="M 120,165 C 120,150 114,145 112,165" fill="none" stroke="#2D2D30" strokeWidth="4.5" />
                </g>
              )}
            </g>
          )}

          {/* 3. LEGS & LOWER BODY (Anatomy & Clothes) */}
          {c.viewMode !== "expressions" && (
            <g transform={`translate(${feetX}, 0)`}>
              
              {/* Skin base for legs (if skirt is active) */}
              <g>
                {/* Left Leg */}
                <path d="M 85,255 L 85,380 C 85,380 92,382 95,380 L 96,255 Z" fill="url(#skin-neck-grad)" />
                {/* Right Leg */}
                <path d="M 104,255 L 105,380 C 105,380 108,382 115,380 L 115,255 Z" fill="url(#skin-neck-grad)" />
              </g>

              {/* Socks (Female Uniform long knee socks) */}
              {isGirl && c.pants === "pants-basic-skirt" && (
                <g>
                  {/* Left sock */}
                  <path d="M 84.8,290 L 85,380 L 95.2,380 L 95.8,290 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                  <path d="M 84.8,294 L 95.8,294" stroke="#1A2D5E" strokeWidth="1.5" />
                  <path d="M 84.8,298 L 95.8,298" stroke="#1A2D5E" strokeWidth="1.5" />

                  {/* Right sock */}
                  <path d="M 104.2,290 L 104.8,380 L 115,380 L 115.2,290 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                  <path d="M 104.2,294 L 115.2,294" stroke="#1A2D5E" strokeWidth="1.5" />
                  <path d="M 104.2,298 L 115.2,298" stroke="#1A2D5E" strokeWidth="1.5" />
                </g>
              )}

              {/* MODULAR BOTTOM PIECE */}
              {c.pants === "pants-basic-skirt" && (
                <g>
                  {/* Plated pleated skirt */}
                  <path d="M 75,225 L 125,225 L 135,270 L 65,270 Z" fill="url(#skirt-checkers)" stroke="#090E1A" strokeWidth="1.2" />
                  {/* Pleat lines (bezier folds with opacity) */}
                  <path d="M 83,225 L 75,270" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                  <path d="M 91,225 L 87,270" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                  <path d="M 100,225 L 100,270" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                  <path d="M 109,225 L 113,270" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                  <path d="M 117,225 L 125,270" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                  {/* Plaid pattern accents */}
                  <path d="M 71,240 L 129,240" stroke="#3B6DE8" strokeWidth="0.8" opacity="0.45" />
                  <path d="M 68,255 L 132,255" stroke="#3B6DE8" strokeWidth="0.8" opacity="0.45" />
                </g>
              )}

              {c.pants === "pants-basic-jeans" && (
                <g>
                  {/* Dark cargo pants (Masculino default) */}
                  {/* Left leg cargo */}
                  <path d="M 80,225 C 80,225 82,310 83,380 L 96,380 L 98,225 Z" fill="url(#pants-cargo-grad)" />
                  {/* Right leg cargo */}
                  <path d="M 102,225 L 104,380 L 117,380 C 118,310 120,225 120,225 Z" fill="url(#pants-cargo-grad)" />
                  {/* Cargo pockets */}
                  <path d="M 74,270 C 74,265 83,265 83,270 L 82,300 C 82,303 74,303 74,300 Z" fill="#262626" opacity="0.8" />
                  <path d="M 117,270 C 117,265 126,265 126,270 L 127,300 C 127,303 118,303 118,300 Z" fill="#262626" opacity="0.8" />
                  {/* Hanging chain on left side of cargo */}
                  {!isGirl && (
                    <path d="M 81,240 Q 74,258 75,275 Q 82,268 83,248" fill="none" stroke="#90A4AE" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" />
                  )}
                  {/* Folds & shadow lines */}
                  <path d="M 83,305 C 83,305 88,320 85,345" stroke="#000000" strokeWidth="1.2" fill="none" opacity="0.45" />
                  <path d="M 117,305 C 117,305 112,320 115,345" stroke="#000000" strokeWidth="1.2" fill="none" opacity="0.45" />
                </g>
              )}

              {/* MODULAR SHOES (3D High-fidelity Sneakers) */}
              {c.shoes !== "" && (
                <g>
                  {/* Left sneaker */}
                  <g>
                    {/* Shadow under shoe */}
                    <ellipse cx="85" cy="388" rx="14" ry="4" fill="#000000" opacity="0.3" />
                    {/* Shoe body */}
                    <path d="M 73,375 C 73,365 92,364 97,372 L 97,386 C 97,388 73,388 73,386 Z" fill={isGirl ? "#FFFFFF" : "#1A365D"} stroke="#CBD5E0" strokeWidth="0.8" />
                    {/* Toe box & sole */}
                    <path d="M 73,382 C 73,382 78,380 97,382 L 97,387 L 73,387 Z" fill="#FFFFFF" />
                    <path d="M 73,386 L 97,386" stroke={isGirl ? "#3B6DE8" : "#FFFFFF"} strokeWidth="1.5" />
                    {/* Details/laces */}
                    <line x1="77" y1="374" x2="84" y2="374" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="79" y1="378" x2="86" y2="378" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>

                  {/* Right sneaker */}
                  <g>
                    {/* Shadow under shoe */}
                    <ellipse cx="115" cy="388" rx="14" ry="4" fill="#000000" opacity="0.3" />
                    {/* Shoe body */}
                    <path d="M 103,372 C 108,364 127,365 127,375 L 127,386 C 127,388 103,388 103,386 Z" fill={isGirl ? "#FFFFFF" : "#1A365D"} stroke="#CBD5E0" strokeWidth="0.8" />
                    {/* Toe box & sole */}
                    <path d="M 103,382 C 103,382 122,380 127,382 L 127,387 L 103,387 Z" fill="#FFFFFF" />
                    <path d="M 103,386 L 127,386" stroke={isGirl ? "#3B6DE8" : "#FFFFFF"} strokeWidth="1.5" />
                    {/* Details/laces */}
                    <line x1="123" y1="374" x2="116" y2="374" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="121" y1="378" x2="114" y2="378" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* 4. TORSO & UPPER CLOTHING (Anatomy & Jacket/Hoodie) */}
          {c.viewMode !== "expressions" && (
            <g transform={`translate(${chestX}, 0)`}>
              
              {/* Torso skin base */}
              <path d="M 76,145 C 76,145 100,140 100,140 C 100,140 124,145 124,145 L 115,225 L 85,225 Z" fill={skinBase} />

              {/* MODULAR CLOTHING: HOODIE (Femenino default) */}
              {c.shirt === "shirt-basic-hoodie" && (
                <g>
                  {/* Hoodie body */}
                  <path d="M 72,140 C 72,130 128,130 128,140 L 118,228 L 82,228 Z" fill="url(#hoodie-white-grad)" />
                  {/* Folds & details */}
                  <path d="M 85,150 C 92,165 108,165 115,150" fill="none" stroke="#CBD5E0" strokeWidth="2.5" />
                  {/* Academy emblem on chest */}
                  <g transform="translate(100, 168) scale(0.6)">
                    <circle cx="0" cy="0" r="14" fill="#1A2D5E" />
                    <polygon points="0,-10 10,7 -10,7" fill="#FFD700" />
                  </g>
                  {/* Hoodie hood on back */}
                  <path d="M 74,136 Q 100,154 126,136 C 132,150 128,162 100,165 C 72,162 68,150 74,136 Z" fill="#D2D6DC" stroke="#B0B5BC" strokeWidth="0.8" />
                  {/* Cords */}
                  <line x1="94" y1="154" x2="94" y2="185" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />
                  <line x1="106" y1="154" x2="106" y2="185" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {/* MODULAR CLOTHING: VARSITY JACKET (Masculino default) */}
              {c.shirt === "shirt-academic-jacket" && (
                <g>
                  {/* Inner white t-shirt */}
                  <path d="M 88,142 L 112,142 L 108,185 L 92,185 Z" fill="#FFFFFF" />
                  {/* Collar neckline */}
                  <path d="M 90,142 Q 100,154 110,142" stroke="#ECEFF1" strokeWidth="2" fill="none" />

                  {/* Jacket body (blue) */}
                  <path d="M 74,142 C 74,130 126,130 126,142 L 117,226 C 117,226 100,228 100,228 C 100,228 83,226 83,226 Z" fill="url(#jacket-body-grad)" />
                  {/* Cuffs at the waist (blue/white stripes) */}
                  <rect x="82" y="222" width="36" height="5" rx="1.5" fill="#1A2D5E" stroke="#FFFFFF" strokeWidth="0.5" />

                  {/* Letter 'E' Gold crest on chest */}
                  <g transform="translate(85, 155)">
                    <rect x="0" y="0" width="10" height="12" rx="1.5" fill="#FFD700" />
                    <text x="2" y="10" fill="#0A1128" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">E</text>
                  </g>

                  {/* Open front zipper paths */}
                  <path d="M 95,142 L 95,224" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
                  <path d="M 105,142 L 105,224" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
                </g>
              )}

              {c.shirt === "shirt-basic-tee" && (
                <g>
                  <path d="M 74,142 C 74,130 126,130 126,142 L 116,225 L 84,225 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
                </g>
              )}

              {c.shirt === "shirt-lab-coat" && (
                <g>
                  {/* Chemistry lab coat */}
                  <path d="M 74,142 C 74,130 126,130 126,142 L 115,225 L 85,225 Z" fill="#F8FAFC" stroke="#B0BEC5" strokeWidth="1.0" />
                  <path d="M 94,142 L 80,224" stroke="#ECEFF1" strokeWidth="1.5" />
                  <path d="M 106,142 L 120,224" stroke="#ECEFF1" strokeWidth="1.5" />
                  <line x1="100" y1="142" x2="100" y2="225" stroke="#90A4AE" strokeWidth="1" />
                </g>
              )}

              {/* Arms (rigged from shoulders) */}
              <g className="arm-left-group">
                {/* Left arm sleeve */}
                <path
                  d="M 74,142 C 64,152 58,168 62,205"
                  stroke={c.shirt === "shirt-academic-jacket" ? "url(#jacket-sleeves-grad)" : c.shirt === "shirt-basic-hoodie" ? "url(#hoodie-white-grad)" : skinBase}
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Sleeve cuff if varsity */}
                {c.shirt === "shirt-academic-jacket" && (
                  <path d="M 59,201 C 60,204 63,205 64,204" stroke="#1A2D5E" strokeWidth="9.5" strokeLinecap="round" fill="none" />
                )}
                {/* Hand with fingers detail */}
                <circle cx="61" cy="209" r="4.2" fill={skinBase} />
                <path d="M 58,211 Q 56,213 58,215" stroke={skinShadow} strokeWidth="0.8" fill="none" />
              </g>

              <g className="arm-right-group">
                {/* Right arm sleeve */}
                <path
                  d="M 126,142 C 136,152 142,168 138,205"
                  stroke={c.shirt === "shirt-academic-jacket" ? "url(#jacket-sleeves-grad)" : c.shirt === "shirt-basic-hoodie" ? "url(#hoodie-white-grad)" : skinBase}
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Sleeve cuff if varsity */}
                {c.shirt === "shirt-academic-jacket" && (
                  <path d="M 141,201 C 140,204 137,205 136,204" stroke="#1A2D5E" strokeWidth="9.5" strokeLinecap="round" fill="none" />
                )}
                {/* Hand with fingers detail */}
                <circle cx="139" cy="209" r="4.2" fill={skinBase} />
                <path d="M 142,211 Q 144,213 142,215" stroke={skinShadow} strokeWidth="0.8" fill="none" />
              </g>
            </g>
          )}

          {/* 5. VISIBLE DEFINED NECK */}
          <path d="M 94,115 L 106,115 L 105,142 L 95,142 Z" fill="url(#skin-neck-grad)" transform={`translate(${headX}, 0)`} />
          {/* Neck shadow under jaw */}
          <path d="M 94,122 Q 100,129 106,122 L 105,142 L 95,142 Z" fill={skinShadow} opacity="0.45" transform={`translate(${headX}, 0)`} />

          {/* =======================================================
              6. HEAD GROUP (Skin, Face, Detailed Anime Eyes, Mouth)
              ======================================================= */}
          <g transform={`translate(${headX}, 0)`}>
            
            {/* Vertical Oval Head (Humanoid Anime Ratio 1:5.5) */}
            <path
              d="M 72,82 C 72,52 128,52 128,82 C 128,105 116,120 100,120 C 84,120 72,105 72,82 Z"
              fill="url(#skin-face-grad)"
              stroke={skinShadow}
              strokeWidth="0.8"
            />
            {/* Subtle ear loops */}
            <path d="M 72,82 Q 67,82 69,89 Q 71,93 73,91" fill={skinBase} stroke={skinShadow} strokeWidth="0.6" />
            <path d="M 128,82 Q 133,82 131,89 Q 129,93 127,91" fill={skinBase} stroke={skinShadow} strokeWidth="0.6" />

            {/* Subsurface scattering (SSS) soft cheeks pink glow */}
            <g opacity="0.35">
              <ellipse cx="80" cy="94" rx="7.5" ry="4" fill="#FF8A80" />
              <ellipse cx="120" cy="94" rx="7.5" ry="4" fill="#FF8A80" />
            </g>

            {/* Detailed Anime Eyes (Not Roblox blocky) */}
            <g className="anime-eye-blink" transform={`translate(${eyesX - headX}, 0)`}>
              
              {/* Left Eye */}
              <g>
                {/* White sclera */}
                <path d="M 78,88 C 81,84 89,84 92,88 C 92,92 81,94 78,88 Z" fill="#FFFFFF" />
                {/* Iris with radial gradient */}
                <ellipse cx="85.5" cy="88" rx="4.8" ry="4.4" fill="url(#iris-grad)" />
                {/* Inner black pupil */}
                <circle cx="85.5" cy="88" r="2" fill="#000000" />
                {/* Specular main highlight */}
                <ellipse cx="84" cy="86.2" rx="1.3" ry="1.0" fill="#FFFFFF" />
                {/* Specular secondary tiny highlight */}
                <circle cx="87.5" cy="89.8" r="0.5" fill="#FFFFFF" />
                {/* Thick upper lash line curve */}
                <path d="M 76.5,87.5 C 79.5,83.5 89.5,83.5 93,87" fill="none" stroke="#1A1C23" strokeWidth="2.4" strokeLinecap="round" />
                {/* Eyelash curves (3-4 strokes) */}
                <path d="M 77,85.5 Q 74,83 75.5,81" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
                <path d="M 91,85 Q 94,82.5 92.5,80.5" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
                {/* Under eye fine lash line */}
                <path d="M 79,91.5 Q 85,93 91.5,91.5" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
              </g>

              {/* Right Eye */}
              <g>
                {/* White sclera */}
                <path d="M 108,88 C 111,84 119,84 122,88 C 122,92 111,94 108,88 Z" fill="#FFFFFF" />
                {/* Iris with radial gradient */}
                <ellipse cx="114.5" cy="88" rx="4.8" ry="4.4" fill="url(#iris-grad)" />
                {/* Inner black pupil */}
                <circle cx="114.5" cy="88" r="2" fill="#000000" />
                {/* Specular main highlight */}
                <ellipse cx="113" cy="86.2" rx="1.3" ry="1.0" fill="#FFFFFF" />
                {/* Specular secondary tiny highlight */}
                <circle cx="116.5" cy="89.8" r="0.5" fill="#FFFFFF" />
                {/* Thick upper lash line curve */}
                <path d="M 107,87 C 110.5,83.5 120.5,83.5 123.5,87.5" fill="none" stroke="#1A1C23" strokeWidth="2.4" strokeLinecap="round" />
                {/* Eyelash curves */}
                <path d="M 123,85.5 Q 126,83 124.5,81" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
                <path d="M 109,85 Q 106,82.5 107.5,80.5" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
                {/* Under eye fine lash line */}
                <path d="M 108.5,91.5 Q 115,93 121,91.5" fill="none" stroke="#1A1C23" strokeWidth="0.8" />
              </g>
            </g>

            {/* Cejas (Curved parallel lines, thick for boys, thin for girls) */}
            <g transform={`translate(${eyesX - headX}, 0)`}>
              {/* Left eyebrow */}
              <path
                d="M 76,78 Q 85,73 92.5,77"
                fill="none"
                stroke={hairShadow}
                strokeWidth={isGirl ? "1.2" : "2.2"}
                strokeLinecap="round"
              />
              {/* Right eyebrow */}
              <path
                d="M 107.5,77 Q 115,73 124,78"
                fill="none"
                stroke={hairShadow}
                strokeWidth={isGirl ? "1.2" : "2.2"}
                strokeLinecap="round"
              />
            </g>

            {/* Nariz Refinada (Subtle shadow dot/lines) */}
            <path d="M 99.5,95 Q 100,99 101,98.5" fill="none" stroke={skinShadow} strokeWidth="1.2" strokeLinecap="round" />

            {/* Boca (Cupids bow & anime lip lines) */}
            <g>
              {c.face === "face-happy" && (
                <g>
                  {/* Subtle lips separation line */}
                  <path d="M 94,106 Q 100,111 106,106" fill="none" stroke="#6D28D9" strokeWidth="1.0" opacity="0.3" />
                  {/* Main smiling line */}
                  <path d="M 93,105 Q 100,113 107,105" fill="none" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Soft pink lip fill for girls */}
                  {isGirl && (
                    <path d="M 95,106 Q 100,112 105,106 Q 100,107 95,106 Z" fill="#D4607A" opacity="0.85" />
                  )}
                </g>
              )}
              {c.face === "face-studying" && (
                <g>
                  {/* Focused expression mouth */}
                  <path d="M 96,107 L 104,107" stroke="#B91C1C" strokeWidth="2.0" strokeLinecap="round" />
                </g>
              )}
              {c.face === "face-excited" && (
                <g>
                  {/* Wide open happy mouth */}
                  <path d="M 93,103 Q 100,115 107,103 Z" fill="#B91C1C" />
                  <path d="M 96,108 Q 100,114 104,108 Z" fill="#FFA0A0" /> {/* Tongue */}
                </g>
              )}
              {c.face === "face-cool" && (
                <g>
                  {/* Smirk mouth */}
                  <path d="M 94,106 Q 102,109 107,103" fill="none" stroke="#B91C1C" strokeWidth="2.0" strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>

          {/* 7. HAIR LAYER (Layered ON TOP of head for 3D volume) - DISABLED */}
          {false && (
            <g transform={`translate(${hairFrontX}, 0)`} className="anime-hair-sway">
              
              {/* Main Hair Volume Base */}
              <path
                d="M 69,72 C 69,38 131,38 131,72 C 131,78 126,80 122,76 C 114,64 110,64 100,74 C 92,64 88,64 80,76 C 76,80 69,78 69,72 Z"
                fill="url(#hair-main-grad)"
                stroke={hairShadow}
                strokeWidth="0.6"
              />

              {/* Specific Mechones (Individual Hair Locks) */}
              {c.hairStyle === "hair-short" && (
                <g>
                  {/* Short modern messy locks for boys */}
                  <path d="M 72,66 L 62,75 L 72,76 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 80,58 L 74,68 L 84,66 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 90,52 L 86,66 L 96,62 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 110,52 L 114,66 L 104,62 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 120,58 L 126,68 L 116,66 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 128,66 L 138,75 L 128,76 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  {/* Bangs falling over forehead */}
                  <path d="M 82,75 C 85,85 88,88 92,85 C 90,80 86,76 82,75 Z" fill={hairBase} />
                  <path d="M 118,75 C 115,85 112,88 108,85 C 110,80 114,76 118,75 Z" fill={hairBase} />
                  <path d="M 100,74 C 98,88 102,88 100,92 C 102,86 102,78 100,74 Z" fill={hairShadow} />
                </g>
              )}

              {c.hairStyle === "hair-wavy" && (
                <g>
                  {/* Flowing side locks down shoulder */}
                  <path d="M 70,72 C 60,95 58,125 64,150 C 68,140 70,120 72,90 Z" fill="url(#hair-main-grad)" />
                  <path d="M 130,72 C 140,95 142,125 136,150 C 132,140 130,120 128,90 Z" fill="url(#hair-main-grad)" />
                  {/* Wavy bangs */}
                  <path d="M 78,74 C 84,84 94,84 98,76 Z" fill={hairBase} stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 102,76 C 106,84 116,84 122,74 Z" fill={hairBase} stroke={hairShadow} strokeWidth="0.5" />
                </g>
              )}

              {c.hairStyle === "hair-straight" && (
                <g>
                  {/* Straight shoulder-length hair locks */}
                  <path d="M 69,72 L 64,130 L 74,130 L 73,85 Z" fill="url(#hair-main-grad)" />
                  <path d="M 131,72 L 136,130 L 126,130 L 127,85 Z" fill="url(#hair-main-grad)" />
                  {/* Neat straight bangs */}
                  <path d="M 78,74 L 78,88 L 86,88 L 84,74 Z" fill={hairBase} />
                  <path d="M 122,74 L 122,88 L 114,88 L 116,74 Z" fill={hairBase} />
                  <path d="M 86,74 L 88,89 L 112,89 L 114,74 Z" fill={hairBase} />
                </g>
              )}

              {c.hairStyle === "hair-mohawk" && (
                <g>
                  {/* Central tall crest spikes */}
                  <path d="M 94,42 Q 100,10 106,42 L 100,50 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.6" />
                  <path d="M 96,48 Q 100,20 104,48 L 100,54 Z" fill={hairHighlight} />
                </g>
              )}

              {c.hairStyle === "hair-afro" && (
                <g>
                  {/* Rounded modular cloud hair */}
                  <circle cx="100" cy="56" r="28" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.8" />
                  <circle cx="82" cy="65" r="22" fill="url(#hair-main-grad)" />
                  <circle cx="118" cy="65" r="22" fill="url(#hair-main-grad)" />
                  <circle cx="72" cy="80" r="14" fill="url(#hair-main-grad)" />
                  <circle cx="128" cy="80" r="14" fill="url(#hair-main-grad)" />
                </g>
              )}

              {c.hairStyle === "hair-pigtails" && (
                <g>
                  {/* Two cute puff extensions left and right */}
                  <circle cx="60" cy="58" r="14" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <circle cx="140" cy="58" r="14" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  {/* Hair ties */}
                  <circle cx="66" cy="64" r="3.5" fill="#E83B8E" />
                  <circle cx="134" cy="64" r="3.5" fill="#E83B8E" />
                </g>
              )}

              {c.hairStyle === "hair-braids" && (
                <g>
                  {/* Side braids */}
                  <path d="M 68,75 Q 52,90 54,140 Q 56,150 50,152 Q 58,154 58,140 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  <path d="M 132,75 Q 148,90 146,140 Q 144,150 150,152 Q 142,154 142,140 Z" fill="url(#hair-main-grad)" stroke={hairShadow} strokeWidth="0.5" />
                  {/* Ties */}
                  <rect x="48" y="146" width="6" height="3" rx="1" fill="#3B6DE8" />
                  <rect x="146" y="146" width="6" height="3" rx="1" fill="#3B6DE8" />
                </g>
              )}

              {c.hairStyle === "hair-female-modern" && (
                <g>
                  {/* Curly modern fringe and sides */}
                  <path d="M 72,75 C 64,90 62,110 66,130 Q 72,120 72,90 Z" fill="url(#hair-main-grad)" />
                  <path d="M 128,75 C 136,90 138,110 134,130 Q 128,120 128,90 Z" fill="url(#hair-main-grad)" />
                  {/* Small buns */}
                  <circle cx="82" cy="45" r="9" fill="url(#hair-main-grad)" />
                  <circle cx="118" cy="45" r="9" fill="url(#hair-main-grad)" />
                </g>
              )}

              {/* Specular Highlight ring (Anime-style glossy light reflection) */}
              <path
                d="M 76,55 Q 100,45 124,55"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.32"
              />
            </g>
          )}

          {/* 8. ACCESSORIES / HEADWEAR LAYER (mortarboard, crown, glasses) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, 0)`}>
              {c.accessory === "acc-legendary-mortarboard" && (
                <g filter="url(#rim-light-shadow)">
                  {/* Cap base fitting head */}
                  <path d="M 86,45 C 86,45 100,40 100,40 C 100,40 114,45 114,45 L 111,53 L 89,53 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
                  {/* Top flat rhomboid board */}
                  <polygon points="100,28 132,38 100,48 68,38" fill="#0F172A" stroke="#374151" strokeWidth="1.2" />
                  {/* Yellow/gold tassel hanging left */}
                  <path d="M 100,38 L 74,42 L 72,58" fill="none" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="72" cy="58" r="2.2" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#rim-light-shadow)">
                  {/* Gold star crown */}
                  <path d="M 80,48 L 83,24 L 92,36 L 100,12 L 108,36 L 117,24 L 120,48 Z" fill="#FFD700" stroke="#B45309" strokeWidth="0.8" />
                  {/* Crown gems */}
                  <circle cx="100" cy="24" r="2.5" fill="#EF4444" />
                  <circle cx="88" cy="38" r="1.5" fill="#3B6DE8" />
                  <circle cx="112" cy="38" r="1.5" fill="#3B6DE8" />
                </g>
              )}

              {c.accessory === "acc-headphones" && (
                <g>
                  {/* Headband arch */}
                  <path d="M 72,74 C 72,36 128,36 128,74" fill="none" stroke="#8B5CF6" strokeWidth="4.2" strokeLinecap="round" />
                  {/* Left speaker cup */}
                  <rect x="65" y="70" width="8" height="24" rx="4.5" fill="#6D28D9" stroke="#4C1D95" strokeWidth="1" />
                  <rect x="69" y="74" width="3" height="16" rx="1.5" fill="#A78BFA" />
                  {/* Right speaker cup */}
                  <rect x="127" y="70" width="8" height="24" rx="4.5" fill="#6D28D9" stroke="#4C1D95" strokeWidth="1" />
                  <rect x="128" y="74" width="3" height="16" rx="1.5" fill="#A78BFA" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && (
                <g transform={`translate(${eyesX - hairFrontX}, 0)`}>
                  {/* Left frame */}
                  <ellipse cx="85.5" cy="88" rx="10" ry="9" fill="none" stroke="#1E293B" strokeWidth="2.2" />
                  {/* Right frame */}
                  <ellipse cx="114.5" cy="88" rx="10" ry="9" fill="none" stroke="#1E293B" strokeWidth="2.2" />
                  {/* Bridge bridge link */}
                  <path d="M 95.5,88 L 104.5,88" stroke="#1E293B" strokeWidth="2.2" />
                  {/* Side ears hooks */}
                  <path d="M 75.5,88 L 71,86" stroke="#1E293B" strokeWidth="1.8" />
                  <path d="M 124.5,88 L 129,86" stroke="#1E293B" strokeWidth="1.8" />
                </g>
              )}
            </g>
          )}

          {/* 9. PET COMPONENT (Cute owl standing next to the avatar) */}
          {c.pet !== "" && (
            <g transform="translate(142, 280)">
              {/* Pet owl shadow */}
              <ellipse cx="18" cy="74" rx="12" ry="3.5" fill="#000000" opacity="0.3" />
              {/* Owl body */}
              <rect x="6" y="32" width="24" height="40" rx="10" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
              {/* Owl chest patch */}
              <ellipse cx="18" cy="54" rx="8" ry="12" fill="#FEF3C7" />
              {/* Cute owl ears */}
              <polygon points="6,34 6,24 13,32" fill="#451A03" />
              <polygon points="30,34 30,24 23,32" fill="#451A03" />
              {/* Owl eyes */}
              <circle cx="12" cy="42" r="4.2" fill="#FFFFFF" stroke="#000000" strokeWidth="0.8" />
              <circle cx="12" cy="42" r="2" fill="#000000" />
              <circle cx="24" cy="42" r="4.2" fill="#FFFFFF" stroke="#000000" strokeWidth="0.8" />
              <circle cx="24" cy="42" r="2" fill="#000000" />
              {/* Beak */}
              <polygon points="18,44 16,48 20,48" fill="#F59E0B" />
              {/* Tiny graduation mortarboard on owl */}
              <polygon points="18,16 26,20 18,24 10,20" fill="#1E293B" />
              <rect x="14" y="21" width="8" height="3" fill="#1E293B" />
              {/* Tiny yellow feet */}
              <circle cx="13" cy="71" r="2" fill="#F59E0B" />
              <circle cx="23" cy="71" r="2" fill="#F59E0B" />
            </g>
          )}

        </g>
      </svg>
    </div>
  );
}
