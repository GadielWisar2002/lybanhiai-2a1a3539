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
  const [yaw, setYaw] = useState(-20);
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

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 1.5) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Skin colors with soft realistic 3D shading
  const skinColors: Record<string, { base: string; shadow: string; glow: string; gradId: string }> = {
    "skin-light-1": { base: "#FFF5F0", shadow: "#EAD3C8", glow: "#FFF8F5", gradId: "skin-1-grad" },
    "skin-light-2": { base: "#FFF0E0", shadow: "#E2BD9F", glow: "#FFF6ED", gradId: "skin-2-grad" },
    "skin-medium-1": { base: "#F5D3B8", shadow: "#C48D66", glow: "#FCEBDF", gradId: "skin-3-grad" },
    "skin-medium-2": { base: "#DBA279", shadow: "#965D37", glow: "#ECD4C3", gradId: "skin-4-grad" },
    "skin-dark-1": { base: "#9A6543", shadow: "#5C3117", glow: "#BE8661", gradId: "skin-5-grad" },
  };
  const activeSkin = skinColors[c.skinColor] || skinColors["skin-light-2"];

  // Organic Hair colors
  const hairColors: Record<string, { base: string; highlight: string; shadow: string; key: string }> = {
    "color-black": { base: "#1A1A1A", highlight: "#3D3D3D", shadow: "#090909", key: "black" },
    "color-brown-light": { base: "#59311F", highlight: "#8E5136", shadow: "#3A1E11", key: "brown-light" }, 
    "color-brown-dark": { base: "#361D12", highlight: "#5E3827", shadow: "#200F07", key: "brown-dark" },
    "color-blonde": { base: "#DDA14E", highlight: "#F7D496", shadow: "#A5732C", key: "blonde" },
    "color-red": { base: "#B53829", highlight: "#E26B5C", shadow: "#801C11", key: "red" },
    "color-gray": { base: "#7C858A", highlight: "#A6AFB4", shadow: "#525B60", key: "gray" },
    "color-white": { base: "#EBF1F5", highlight: "#FFFFFF", shadow: "#C8D3D9", key: "white" },
    "color-fantasy-pink": { base: "#D63384", highlight: "#FF7CB2", shadow: "#9A1553", key: "fantasy-pink" },
    "color-fantasy-blue": { base: "#0F4C81", highlight: "#3B82F6", shadow: "#0A2540", key: "fantasy-blue" },
    "color-fantasy-purple": { base: "#6F42C1", highlight: "#A370F7", shadow: "#4C2B88", key: "fantasy-purple" },
  };
  const activeHair = hairColors[c.hairColor] || hairColors["color-brown-light"];

  // Highlights/Mechas matching active highlights
  const highlightColors: Record<string, string> = {
    "hl-black-blue": "#38BDF8",
    "hl-brown-red": "#EF4444",
    "hl-blonde-pink": "#F472B6",
    "hl-custom-neon": "#4ADE80",
    "hl-none": "transparent"
  };
  const activeHighlightHex = highlightColors[c.hairHighlight] || "";

  // 360 degree rotation parallax calculations
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const isFront = cos >= 0;

  // Horizontal parallax translation offsets (Smoothly sways parts to simulate 3D modular rotation)
  const pxFac = sin; 
  const headX = pxFac * 8.5;
  const eyesX = pxFac * 11;
  const hairFrontX = pxFac * 7.5;
  const hairBackX = -pxFac * 5;
  const chestX = pxFac * 5;
  const armsX = pxFac * 3.5;
  const feetX = pxFac * 2;
  const backpackX = -pxFac * 9.5;

  const charYOffset = 18;
  const hairGradId = `hair-grad-${activeHair.key}`;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-[370px] mx-auto overflow-hidden rounded-3xl bg-[#040814] border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.18)]">
      
      {/* Blueprint Grid Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#040814_95%),linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:100%_100%,20px_20px] opacity-10 pointer-events-none z-0" />
      
      {/* Sci-Fi Scanner Line Effect */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 shadow-[0_0_8px_#22d3ee] animate-[bounce_6s_infinite] pointer-events-none z-20" />

      {/* Modular 3D Viewport SVG */}
      <svg
        viewBox="0 0 260 350"
        className="w-full h-full z-10"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.15s ease-out",
        }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startYaw = yaw;
          setIsRotating(false);

          const handleMouseMove = (mv: MouseEvent) => {
            const deltaX = mv.clientX - startX;
            setYaw((startYaw + deltaX * 0.95) % 360);
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
            setYaw((startYaw + deltaX * 0.95) % 360);
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
          {/* Glowing stage stage */}
          <filter id="glow-neon-stage" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold glow */}
          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Premium soft drop shadow */}
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          {/* Neon stage gradient */}
          <linearGradient id="stage-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* Hologram fill radial */}
          <radialGradient id="hologram-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>

          {/* Skirt navy checkers */}
          <linearGradient id="skirt-checkers" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* White hoodie white-cream */}
          <linearGradient id="white-hoodie-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Navy fabric general grad */}
          <linearGradient id="navy-fabric-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E4A7D" />
            <stop offset="50%" stopColor="#1B2E53" />
            <stop offset="100%" stopColor="#0E1B33" />
          </linearGradient>

          {/* Blue varsity jacket body (boy) */}
          <linearGradient id="jacket-blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Red fabric general grad */}
          <linearGradient id="red-fabric-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="55%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Gold crest */}
          <linearGradient id="crest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Hair shining dynamic */}
          <linearGradient id="hair-dynamic-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeHair.highlight} />
            <stop offset="45%" stopColor={activeHair.base} />
            <stop offset="100%" stopColor={activeHair.shadow} />
          </linearGradient>

          {/* Stylized rounded realistic eyes */}
          <radialGradient id="eyes-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8E5136" />
            <stop offset="65%" stopColor="#59311F" />
            <stop offset="100%" stopColor="#1C0F07" />
          </radialGradient>

          {/* Dark denim pants */}
          <linearGradient id="denim-pants-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A75B4" />
            <stop offset="55%" stopColor="#2D4D7F" />
            <stop offset="100%" stopColor="#192A47" />
          </linearGradient>

          {/* Skin Tone 3D Gradients */}
          <linearGradient id="skin-1-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF5F0" />
            <stop offset="60%" stopColor="#FFE4D9" />
            <stop offset="100%" stopColor="#EAD3C8" />
          </linearGradient>
          <linearGradient id="skin-2-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF0E0" />
            <stop offset="60%" stopColor="#FAD5B4" />
            <stop offset="100%" stopColor="#E2BD9F" />
          </linearGradient>
          <linearGradient id="skin-3-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5D3B8" />
            <stop offset="60%" stopColor="#E3A376" />
            <stop offset="100%" stopColor="#C48D66" />
          </linearGradient>
          <linearGradient id="skin-4-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DBA279" />
            <stop offset="60%" stopColor="#BE7B50" />
            <stop offset="100%" stopColor="#965D37" />
          </linearGradient>
          <linearGradient id="skin-5-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A6543" />
            <stop offset="60%" stopColor="#774324" />
            <stop offset="100%" stopColor="#5C3117" />
          </linearGradient>

          {/* Blush gradient */}
          <radialGradient id="blush-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>

          {/* Dynamic Animation Keyframes */}
          <style>
            {`
              @keyframes idle-breath {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-1.5px) scale(1.005); }
              }
              @keyframes eye-blink {
                0%, 96%, 100% { transform: scaleY(1); }
                98% { transform: scaleY(0.1); }
              }
              @keyframes arm-idle-left {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-1.5deg); }
              }
              @keyframes arm-idle-right {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(1.5deg); }
              }
              .skeleton-root {
                transform-origin: 130px 290px;
                animation: idle-breath 4s ease-in-out infinite;
              }
              .eye-left {
                transform-origin: 117px 74px;
                animation: eye-blink 5s ease-in-out infinite;
              }
              .eye-right {
                transform-origin: 143px 74px;
                animation: eye-blink 5s ease-in-out infinite;
              }
              .arm-left-group {
                transform-origin: 96px 115px;
                animation: arm-idle-left 4s ease-in-out infinite;
              }
              .arm-right-group {
                transform-origin: 164px 115px;
                animation: arm-idle-right 4s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Circular glowing hologram stage */}
        <g transform="translate(0, 8)">
          <ellipse cx="130" cy="302" rx="74" ry="16" fill="none" stroke="url(#stage-neon)" strokeWidth="3" filter="url(#glow-neon-stage)" opacity="0.9" />
          <ellipse cx="130" cy="302" rx="60" ry="12" fill="url(#hologram-radial)" opacity="0.5" />
          <ellipse cx="130" cy="302" rx="42" ry="8" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.6" filter="url(#glow-neon-stage)" />
          <line x1="75" y1="270" x2="75" y2="302" stroke="#22D3EE" strokeWidth="0.6" opacity="0.4" filter="url(#glow-neon-stage)" />
          <line x1="185" y1="270" x2="185" y2="302" stroke="#22D3EE" strokeWidth="0.6" opacity="0.4" filter="url(#glow-neon-stage)" />
          <line x1="130" y1="250" x2="130" y2="302" stroke="#22D3EE" strokeWidth="0.4" opacity="0.3" filter="url(#glow-neon-stage)" />
        </g>

        {/* Aura ambient effects */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.65">
            <circle cx="130" cy="150" r="92" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="8,16" />
            <circle cx="130" cy="150" r="66" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,12" />
          </g>
        )}
        {c.aura === "aura-math" && (
          <g filter="url(#glow-neon-stage)" opacity="0.55" stroke="#22D3EE" strokeWidth="1" fill="none" className="font-mono text-[8px] font-bold">
            <circle cx="130" cy="150" r="85" strokeDasharray="4,12" />
            <text x="60" y="90" fill="#22D3EE">E = mc²</text>
            <text x="175" y="105" fill="#22D3EE">π ≈ 3.14</text>
            <text x="50" y="210" fill="#22D3EE">x² + y² = r²</text>
            <text x="170" y="220" fill="#22D3EE">∫ f(x)dx</text>
          </g>
        )}

        {/* ==========================================
            HUMANOID ROOT SKELETON (ANIMATED MODULAR RIG)
            ========================================== */}
        <g className="skeleton-root" filter="url(#soft-shadow)">
          
          {/* 1. BACK HAIR (Swaying with the back layer) */}
          {isFront && (
            <g transform={`translate(${hairBackX}, ${charYOffset})`}>
              {(c.hairStyle === "hair-wavy" || c.hairStyle === "hair-long" || c.hairStyle === "hair-curly" || c.hairStyle === "hair-pigtails" || c.hairStyle === "hair-braids") && (
                <path
                  d="M102,72 C84,95 72,130 76,195 C80,215 96,210 94,180 C92,145 106,104 130,104 C154,104 168,145 166,180 C164,210 180,215 184,195 C188,130 176,95 158,72 Z"
                  fill="url(#hair-dynamic-grad)"
                />
              )}
            </g>
          )}

          {/* 2. BACKPACK SLOT (Rear attachments) */}
          {isFront && c.accessory.includes("backpack") && (
            <g transform={`translate(${backpackX}, ${charYOffset})`}>
              {c.accessory === "acc-school-backpack" && (
                <rect x="97" y="112" width="66" height="66" rx="16" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
              )}
              {c.accessory === "acc-science-backpack" && (
                <g>
                  <rect x="97" y="110" width="66" height="68" rx="10" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                  <rect x="103" y="116" width="54" height="46" rx="5" fill="#10B981" />
                </g>
              )}
              {c.accessory === "acc-college-backpack" && (
                <g>
                  <rect x="99" y="112" width="62" height="18" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1" />
                  <rect x="97" y="130" width="66" height="18" rx="3" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                  <rect x="95" y="148" width="70" height="20" rx="3" fill="#065F46" stroke="#064E3B" strokeWidth="1" />
                </g>
              )}
            </g>
          )}

          {/* 3. HUMANOID LOWER SKELETON (Legs, Pants & Shoes) */}
          <g transform={`translate(${feetX}, 0)`}>
            
            {/* Base Humanoid Skin Legs (Rigged Skinned Mesh) */}
            <path d="M116,203 Q114,240 117,278 L124,278 Q123,240 122,203 Z" fill={`url(#${activeSkin.gradId})`} />
            <path d="M138,203 Q137,240 136,278 L143,278 Q146,240 144,203 Z" fill={`url(#${activeSkin.gradId})`} />

            {/* MODULAR BOTTOM PIECE (BOTTOM SLOT) */}
            {c.outfit === "" && (
              <g>
                {/* Skirt bottom */}
                {c.pants === "pants-basic-skirt" && (
                  <g transform="translate(4, 0)">
                    <path d="M110,170 L118,170 L111,203 L102,201 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M118,170 L126,170 L122,204 L111,203 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M126,170 L134,170 L132,204 L122,204 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M134,170 L142,170 L142,204 L132,204 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M142,170 L150,170 L151,203 L142,204 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M150,170 L158,170 L161,201 L151,203 Z" fill="url(#navy-fabric-grad)" />
                    <path d="M105,176 Q130,179 155,176" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" fill="none" />
                    <path d="M101,188 Q130,191 159,188" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" fill="none" />
                  </g>
                )}
                {/* Denim cargo jeans bottom */}
                {c.pants === "pants-basic-jeans" && (
                  <g>
                    <path d="M112,170 Q106,220 108,278 L124,278 Q124,220 122,170 Z" fill="url(#denim-pants-grad)" />
                    <path d="M138,170 Q136,220 136,278 L152,278 Q154,220 148,170 Z" fill="url(#denim-pants-grad)" />
                    <path d="M112,170 L112,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                    <path d="M148,170 L148,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                    <rect x="99" y="206" width="8" height="15" rx="1.5" fill="#1D4ED8" />
                    <rect x="153" y="206" width="8" height="15" rx="1.5" fill="#1D4ED8" />
                  </g>
                )}
              </g>
            )}

            {/* MODULAR SHOES PIECE (SHOES SLOT) */}
            {c.shoes === "shoes-basic-shoes" && (
              <g>
                {/* Left shoe */}
                <path d="M114,275 C110,270 125,268 127,275 L128,288 C128,291 113,291 113,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                <path d="M113.5,282 Q121,283 127.5,279" stroke="#3B82F6" strokeWidth="2" fill="none" />
                <path d="M113,286 L128,286 L128,290 L113,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
                {/* Right shoe */}
                <path d="M133,275 C131,268 146,270 142,275 L143,288 C143,291 128,291 128,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                <path d="M128.5,279 Q135,283 142.5,282" stroke="#3B82F6" strokeWidth="2" fill="none" />
                <path d="M128,286 L143,286 L143,290 L128,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
              </g>
            )}
            {c.shoes === "shoes-academic-shoes" && (
              <g>
                <path d="M113,274 C110,270 126,268 127,274 L128,288 C128,291 113,291 113,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
                <path d="M133,274 C131,268 147,270 144,274 L144,288 C144,291 129,291 129,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
              </g>
            )}
          </g>

          {/* 4. HUMANOID UPPER SKELETON (Torso & Arms) */}
          <g transform={`translate(${chestX}, 0)`}>
            
            {/* Skin base for chest */}
            <path d="M100,115 C100,115 130,108 130,108 C130,108 160,115 160,115 L146,180 L114,180 Z" fill={`url(#${activeSkin.gradId})`} />

            {/* MODULAR TOP PIECE (TOP / JACKET SLOT) */}
            {c.outfit === "" && (
              <g>
                {/* Sudadera Escolar / Hoodie */}
                {c.shirt === "shirt-basic-hoodie" && (
                  <g>
                    <path d="M96,112 C96,98 164,98 164,112 L146,170 C146,172 114,172 114,170 Z" fill="url(#white-hoodie-grad)" stroke="#CBD5E1" strokeWidth="0.8" />
                    <path d="M120,112 L140,112 L130,126 Z" fill={`url(#${activeSkin.gradId})`} />
                    <path d="M120,112 L124,124 L130,126 L136,124 L140,112 Z" fill="#FFFFFF" />
                    <circle cx="130" cy="123" r="2.8" fill="#EF4444" />
                    <path d="M130,123 L121,131 L125,133 Z" fill="#B91C1C" />
                    <path d="M130,123 L139,131 L135,133 Z" fill="#B91C1C" />
                    <path d="M123,116 Q121,138 118,142" stroke="#94A3B8" strokeWidth="1.8" fill="none" />
                    <rect x="116.5" y="142" width="3" height="3.5" rx="0.8" fill="#94A3B8" />
                    <path d="M137,116 Q139,138 142,142" stroke="#94A3B8" strokeWidth="1.8" fill="none" />
                    <rect x="140.5" y="142" width="3" height="3.5" rx="0.8" fill="#94A3B8" />
                  </g>
                )}

                {/* Chaqueta Académica / Varsity Jacket */}
                {c.shirt === "shirt-academic-jacket" && (
                  <g>
                    <path d="M94,110 C94,98 166,98 166,110 L148,170 C148,172 112,172 112,170 Z" fill="url(#jacket-blue-grad)" stroke="#0F172A" strokeWidth="0.8" />
                    <rect x="110" y="166" width="40" height="6" rx="2" fill="#1E3A8A" />
                    <path d="M118,110 L142,110 L130,124 Z" fill={`url(#${activeSkin.gradId})`} />
                    <path d="M120,110 L125,120 L130,122 L135,120 L140,110 Z" fill="#64748B" />
                    <g filter="url(#gold-glow)">
                      <rect x="103" y="120" width="13" height="15" rx="2" fill="url(#crest-gradient)" />
                      <text x="106" y="131" fill="#1C0F07" fontSize="9" fontWeight="900" fontFamily="sans-serif">E</text>
                    </g>
                  </g>
                )}

                {/* Playera Básica / Tee */}
                {c.shirt === "shirt-basic-tee" && (
                  <g>
                    <path d="M96,112 C96,98 164,98 164,112 L146,170 L114,170 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
                    <polygon points="120,112 130,124 140,112" fill="#1E3A8A" />
                  </g>
                )}

                {/* Bata de Laboratorio */}
                {c.shirt === "shirt-lab-coat" && (
                  <g>
                    <path d="M96,112 C96,98 164,98 164,112 L146,170 L114,170 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
                    <path d="M124,112 L124,170" stroke="#CBD5E1" strokeWidth="1" />
                    <rect x="104" y="130" width="12" height="15" rx="1" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
                    <line x1="108" y1="133" x2="108" y2="142" stroke="#EF4444" strokeWidth="1" />
                  </g>
                )}
              </g>
            )}

            {/* 5. MODULAR RIGGED ARMS (Connected seamlessly to chest joints) */}
            <g className="arm-left-group">
              {/* Left Arm mesh and hand */}
              <path d="M96,112 C88,124 84,142 88,162" stroke={c.shirt.includes("hoodie") ? "url(#navy-fabric-grad)" : c.shirt.includes("jacket") ? "#FFFFFF" : `url(#${activeSkin.gradId})`} strokeWidth="10.2" strokeLinecap="round" fill="none" />
              <circle cx="86" cy="166" r="4.2" fill={`url(#${activeSkin.gradId})`} />
            </g>
            <g className="arm-right-group">
              {/* Right Arm mesh and hand */}
              <path d="M164,112 C172,124 176,142 172,162" stroke={c.shirt.includes("hoodie") ? "url(#navy-fabric-grad)" : c.shirt.includes("jacket") ? "#FFFFFF" : `url(#${activeSkin.gradId})`} strokeWidth="10.2" strokeLinecap="round" fill="none" />
              <circle cx="174" cy="166" r="4.2" fill={`url(#${activeSkin.gradId})`} />
            </g>

          </g>

          {/* ==========================================
              PREMIUM modular OUTFITS
              ========================================== */}
          {c.outfit !== "" && (
            <g>
              {/* OUTFIT: RECTOR GALA SUIT (⚖️) */}
              {c.outfit === "outfit-rector" && (
                <g>
                  <path d="M90,110 C90,95 170,95 170,110 L152,190 L108,190 Z" fill="#581C87" transform={`translate(${chestX}, 0)`} />
                  <rect x="122" y="110" width="16" height="80" fill="#111827" transform={`translate(${chestX}, 0)`} />
                  <line x1="122" y1="110" x2="122" y2="190" stroke="#FBBF24" strokeWidth="1.5" transform={`translate(${chestX}, 0)`} />
                  <line x1="138" y1="110" x2="138" y2="190" stroke="#FBBF24" strokeWidth="1.5" transform={`translate(${chestX}, 0)`} />
                  <g transform={`translate(${chestX}, 0)`}>
                    <line x1="126" y1="116" x2="130" y2="130" stroke="#FBBF24" strokeWidth="2" />
                    <line x1="134" y1="116" x2="130" y2="130" stroke="#FBBF24" strokeWidth="2" />
                    <circle cx="130" cy="132" r="6" fill="url(#crest-gradient)" />
                  </g>
                  <g transform={`translate(${armsX}, 0)`}>
                    <path d="M90,110 C76,124 72,148 76,172 L88,172 C84,148 88,124 90,110 Z" fill="#581C87" />
                    <path d="M170,110 C184,124 188,148 184,172 L172,172 C176,148 172,124 170,110 Z" fill="#581C87" />
                    <circle cx="82" cy="172" r="3.5" fill={`url(#${activeSkin.gradId})`} />
                    <circle cx="178" cy="172" r="3.5" fill={`url(#${activeSkin.gradId})`} />
                  </g>
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,190 L108,278 L124,278 L122,190 Z" fill="#111827" />
                    <path d="M138,190 L136,278 L152,278 L148,190 Z" fill="#111827" />
                  </g>
                </g>
              )}

              {/* OUTFIT: SCIENCE SUPREMO EXOSUIT (🧬) */}
              {c.outfit === "outfit-science-supremo" && (
                <g>
                  <path d="M94,110 C94,98 166,98 166,110 L148,170 L112,170 Z" fill="#0F172A" transform={`translate(${chestX}, 0)`} />
                  <g transform={`translate(${chestX}, 0)`}>
                    <circle cx="130" cy="135" r="10" fill="#06B6D4" filter="url(#glow-neon-stage)" />
                    <circle cx="130" cy="135" r="5" fill="#FFFFFF" />
                  </g>
                  <g transform={`translate(${armsX}, 0)`}>
                    <path d="M94,110 C86,124 84,142 88,162" stroke="#1E293B" strokeWidth="10.5" fill="none" />
                    <path d="M94,110 C86,124 84,142 88,162" stroke="#06B6D4" strokeWidth="2" fill="none" filter="url(#glow-neon-stage)" opacity="0.8" />
                    <path d="M166,110 C174,124 176,142 172,162" stroke="#1E293B" strokeWidth="10.5" fill="none" />
                    <path d="M166,110 C174,124 176,142 172,162" stroke="#06B6D4" strokeWidth="2" fill="none" filter="url(#glow-neon-stage)" opacity="0.8" />
                  </g>
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,170 L108,278 L124,278 L122,170 Z" fill="#0F172A" />
                    <path d="M138,170 L136,278 L152,278 L148,170 Z" fill="#0F172A" />
                    <rect x="110" y="222" width="10" height="12" rx="3" fill="#06B6D4" filter="url(#glow-neon-stage)" />
                    <rect x="140" y="222" width="10" height="12" rx="3" fill="#06B6D4" filter="url(#glow-neon-stage)" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* 6. HUMANOID MODULAR NECK */}
          <path d="M125,95 L135,95 L134,110 L126,110 Z" fill={activeSkin.shadow} transform={`translate(${headX}, ${charYOffset})`} />

          {/* 7. HUMANOID HEAD (HEAD SLOT) */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            {/* Tapered 3D skull */}
            <path d="M107,70 C107,45 153,45 153,70 C153,91 143,97 130,97 C117,97 107,91 107,70 Z" fill={`url(#${activeSkin.gradId})`} />
            
            {/* Ears */}
            <path d="M107,70 Q101,70 103,78 Q105,82 108,79 Z" fill={`url(#${activeSkin.gradId})`} />
            <path d="M153,70 Q159,70 157,78 Q155,82 152,79 Z" fill={`url(#${activeSkin.gradId})`} />
            <path d="M106,72 Q103,72 104,77" stroke={activeSkin.shadow} strokeWidth="0.8" fill="none" />
            <path d="M154,72 Q157,72 156,77" stroke={activeSkin.shadow} strokeWidth="0.8" fill="none" />

            {/* Blush */}
            {isFront && (
              <g>
                <circle cx="114" cy="81" r="7.5" fill="url(#blush-radial)" />
                <circle cx="146" cy="81" r="7.5" fill="url(#blush-radial)" />
              </g>
            )}
          </g>

          {/* 8. FACIAL FEATURES (EYES, EYEBROWS, MOUTH, NOSE) */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              {/* Nose and eyebrows */}
              <path d="M129.5,77 L130.5,77 L130.5,80.5 Q130.5,82 129,82" stroke={activeSkin.shadow} strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <ellipse cx="130" cy="80" rx="1.2" ry="0.7" fill="#FFFFFF" opacity="0.4" />
              
              <path d="M108,66 C111,62.5 119,62.5 124,66.5" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M136,66.5 C141,62.5 149,62.5 152,66" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Sweet smile lips */}
              <path d="M126,85 Q130,86.5 134,85" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M127.5,86 Q130,88.5 132.5,86" fill="#F43F5E" opacity="0.65" />

              {/* MODULAR EYES SLOT (Blinking Animation connected) */}
              {c.face === "face-happy" && (
                <g>
                  {/* Left Eye */}
                  <g className="eye-left">
                    <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                    <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                    <circle cx="115.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                    <path d="M109,74 C112,71.5 119,71.5 125,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </g>
                  {/* Right Eye */}
                  <g className="eye-right">
                    <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                    <circle cx="143" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                    <circle cx="141.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                    <path d="M135,74 C138,71.5 145,71.5 151,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </g>
                </g>
              )}

              {/* FACE: STUDYING */}
              {c.face === "face-studying" && (
                <g>
                  <path d="M112,74 C114,72.5 119,72.5 122,74" stroke="#1A0F0A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M138,74 C140,72.5 145,72.5 148,74" stroke="#1A0F0A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  {/* Reading glasses */}
                  <circle cx="117" cy="74" r="10.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                  <circle cx="143" cy="74" r="10.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                  <line x1="127.5" y1="74" x2="132.5" y2="74" stroke="#1E293B" strokeWidth="2" />
                </g>
              )}

              {/* FACE: EXCITED */}
              {c.face === "face-excited" && (
                <g>
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <polygon points="117,69 119,72 122,72 119,74 121,78 117,76 113,78 115,74 112,72 115,72" fill="#FBBF24" />
                  
                  <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="143" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <polygon points="143,69 145,72 148,72 145,74 147,78 143,76 139,78 141,74 138,72 141,72" fill="#FBBF24" />
                </g>
              )}

              {/* FACE: COOL */}
              {c.face === "face-cool" && (
                <g>
                  <path d="M106,66 L124,66 L123,78 Q115,82 107,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <path d="M136,66 L154,66 L153,78 Q145,82 137,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <line x1="124" y1="70" x2="136" y2="70" stroke="#0F172A" strokeWidth="2.5" />
                </g>
              )}

              {/* FACE: WINK */}
              {c.face === "face-wink" && (
                <g>
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <path d="M136,75 Q143,80 150,75" stroke="#1A0F0A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* FACE: CURIOUS */}
              {c.face === "face-curious" && (
                <g>
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="71.5" r="3.8" fill="url(#eyes-pupil)" />
                  <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="143" cy="71.5" r="3.8" fill="url(#eyes-pupil)" />
                </g>
              )}
            </g>
          )}

          {/* 9. FRONT HAIR / BANGS SLOT (Swaps modular hairstyles) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {c.hairStyle === "hair-wavy" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,65 141,60 C130,46 128,46 119,60 C114,65 107,64 107,56 Z" fill="url(#hair-dynamic-grad)" />
                  <path d="M109,56 C120,44 140,44 151,56 C143,50 135,50 130,53 C125,50 117,50 109,56 Z" fill={activeHair.highlight} opacity="0.9" />
                  <path d="M107,56 C103,72 105,86 109,92" stroke="url(#hair-dynamic-grad)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <path d="M153,56 C157,72 155,86 151,92" stroke="url(#hair-dynamic-grad)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,64 141,60 C132,48 128,48 119,60 C114,64 107,64 107,56 Z" fill="url(#hair-dynamic-grad)" />
                  <path d="M107,56 Q102,75 106,102 C108,102 109,75 108,56" fill="url(#hair-dynamic-grad)" />
                  <path d="M153,56 Q158,75 154,102 C152,102 151,75 152,56" fill="url(#hair-dynamic-grad)" />
                </g>
              )}

              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C151,64 147,65 142,61 C135,53 125,53 118,61 C113,65 109,64 107,56 Z" fill="url(#hair-dynamic-grad)" />
                  <rect x="105" y="56" width="5.5" height="38" rx="2" fill="url(#hair-dynamic-grad)" />
                  <rect x="149.5" y="56" width="5.5" height="38" rx="2" fill="url(#hair-dynamic-grad)" />
                </g>
              )}

              {c.hairStyle === "hair-curly" && (
                <g>
                  <circle cx="106" cy="50" r="14" fill="url(#hair-dynamic-grad)" />
                  <circle cx="120" cy="40" r="14" fill="url(#hair-dynamic-grad)" />
                  <circle cx="140" cy="40" r="14" fill="url(#hair-dynamic-grad)" />
                  <circle cx="154" cy="50" r="14" fill="url(#hair-dynamic-grad)" />
                </g>
              )}

              {c.hairStyle === "hair-afro" && (
                <g>
                  <path d="M130,16 C105,16 90,30 90,54 C90,70 100,82 110,88 C100,94 104,104 114,102 C120,106 140,106 146,102 C156,104 160,94 150,88 C160,82 170,70 170,54 C170,30 155,16 130,16 Z" fill="url(#hair-dynamic-grad)" />
                </g>
              )}

              {c.hairStyle === "hair-short" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,62 146,62 141,58 C132,48 128,48 119,58 C114,62 107,62 107,56 Z" fill="url(#hair-dynamic-grad)" />
                  <polygon points="107,44 115,30 120,40" fill="url(#hair-dynamic-grad)" />
                  <polygon points="118,34 128,20 132,30" fill="url(#hair-dynamic-grad)" />
                  <polygon points="128,30 138,18 142,32" fill="url(#hair-dynamic-grad)" />
                </g>
              )}
            </g>
          )}

          {/* 10. HEAD ACCESSORIES SLOT (HATS / HEADWEAR) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="18" ry="6" fill="#111827" />
                  <rect x="112" y="39" width="36" height="8" fill="#111827" />
                  <polygon points="130,30 164,39 130,48 96,39" fill="#1F2937" stroke="#111827" strokeWidth="1" />
                  <path d="M130,39 L156,43 L159,54" fill="none" stroke="url(#crest-gradient)" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="159" cy="54" r="2.2" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#gold-glow)">
                  <path d="M108,48 L110,26 L120,37 L130,18 L140,37 L150,26 L152,48 Z" fill="url(#crest-gradient)" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="130" cy="30" r="2.5" fill="#EF4444" />
                </g>
              )}

              {c.accessory === "acc-headphones" && (
                <g filter="url(#soft-shadow)">
                  <rect x="99" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <rect x="153" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <path d="M103,62 C103,34 157,34 157,62" fill="none" stroke="#7C3AED" strokeWidth="3.2" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && c.face !== "face-studying" && (
                <g>
                  <circle cx="117" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <circle cx="143" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <line x1="126.5" y1="74" x2="133.5" y2="74" stroke="#1E293B" strokeWidth="2" />
                </g>
              )}
            </g>
          )}

          {/* REVERSED COMPATIBILITY VIEW */}
          {!isFront && (
            <g transform={`translate(${backpackX}, ${charYOffset})`}>
              <path d="M109,56 C92,92 88,140 100,195 C108,205 114,200 112,165 C110,135 114,92 130,92 C146,92 150,135 148,165 C146,200 152,205 160,195 C172,140 168,92 151,56 Z" fill="url(#hair-dynamic-grad)" transform={`translate(${headX - backpackX}, 0)`} />
              
              {c.accessory.includes("backpack") && (
                <g>
                  {c.accessory === "acc-school-backpack" && (
                    <rect x="96" y="112" width="68" height="68" rx="16" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
                  )}
                  {c.accessory === "acc-science-backpack" && (
                    <rect x="96" y="110" width="68" height="70" rx="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                  )}
                  {c.accessory === "acc-college-backpack" && (
                    <rect x="99" y="112" width="62" height="18" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
                  )}
                </g>
              )}
            </g>
          )}

        </g>
      </svg>

      {/* Rotation Interface Controls Overlay */}
      <div className="absolute bottom-16 inset-x-2 flex justify-center gap-3.5 z-20">
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => (prev - 45) % 360);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg active:scale-90 transition duration-150"
          title="Girar Izquierda"
        >
          🔄
        </button>
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-4 h-8.5 rounded-full border flex items-center justify-center text-xs font-bold cursor-pointer shadow-lg transition duration-200 ${
            isRotating ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-cyan-500/20" : "bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800"
          }`}
        >
          {isRotating ? "Pausar" : "Auto Girar"}
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => (prev + 45) % 360);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg active:scale-90 transition duration-150"
          title="Girar Derecha"
        >
          🔄
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(-20);
          }}
          className="px-2.5 h-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-lg active:scale-90 transition duration-150"
        >
          Reiniciar
        </button>
      </div>

      {/* Futuristic Telemetry HUD */}
      <div className="absolute top-3 left-4 flex gap-1.5 items-center z-20">
        <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[7.5px] font-black text-cyan-400 tracking-widest font-mono uppercase">
          MODULAR RIG ACTIVE
        </span>
      </div>

      <div className="absolute top-3 right-4 font-mono text-[7px] font-black text-slate-400 tracking-wider z-20 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/40">
        SKINNED_MESH: OK
      </div>

      <div className="absolute bottom-3 left-4 right-4 bg-[#090d16]/95 border border-cyan-500/10 px-3.5 py-2.5 rounded-2xl flex items-center justify-between z-20 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-black text-white leading-none font-mono tracking-wider">
            {isGirl ? "FEMALE SKELETON_01" : "MALE SKELETON_02"}
          </span>
          <span className="text-[7px] font-black text-cyan-400 font-mono mt-0.5 tracking-wider uppercase">
            {c.hairStyle} • {c.shirt} • {c.pants}
          </span>
        </div>
        <div className="flex flex-col text-right font-mono">
          <span className="text-[7.5px] font-black text-emerald-400 leading-none">
            HUMANOID RIG: 100%
          </span>
          <span className="text-[6.5px] font-bold text-slate-500 mt-0.5">
            PBR MATERIALS INJECTED
          </span>
        </div>
      </div>
    </div>
  );
}
