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

  // Premium organic skin colors with soft shading shadows
  const skinColors: Record<string, { base: string; shadow: string; glow: string }> = {
    "skin-light-1": { base: "#FFF1EB", shadow: "#ECC5B9", glow: "#FFEBE3" },
    "skin-light-2": { base: "#FCDAB7", shadow: "#DEAE83", glow: "#FEEAD4" },
    "skin-medium-1": { base: "#EAAD80", shadow: "#BF8356", glow: "#F5CEB3" },
    "skin-medium-2": { base: "#C68759", shadow: "#9C5E33", glow: "#DFB393" },
    "skin-dark-1": { base: "#7D4E2D", shadow: "#563219", glow: "#A37655" },
  };
  const activeSkin = skinColors[c.skinColor] || skinColors["skin-light-2"];

  // Organic Hair colors
  const hairColors: Record<string, { base: string; highlight: string; shadow: string }> = {
    "color-black": { base: "#1E1E1E", highlight: "#3D3D3D", shadow: "#0B0B0B" },
    "color-brown-light": { base: "#59311F", highlight: "#8E5136", shadow: "#3A1E11" }, // Warm chocolate brown
    "color-brown-dark": { base: "#361D12", highlight: "#5E3827", shadow: "#200F07" },
    "color-blonde": { base: "#DDA14E", highlight: "#F7D496", shadow: "#A5732C" },
    "color-red": { base: "#B53829", highlight: "#E26B5C", shadow: "#801C11" },
    "color-gray": { base: "#7C858A", highlight: "#A6AFB4", shadow: "#525B60" },
    "color-white": { base: "#EBF1F5", highlight: "#FFFFFF", shadow: "#C8D3D9" },
    "color-fantasy-pink": { base: "#D63384", highlight: "#FF7CB2", shadow: "#9A1553" },
    "color-fantasy-blue": { base: "#0D6EFD", highlight: "#6EA8FE", shadow: "#0A46A6" },
    "color-fantasy-purple": { base: "#6F42C1", highlight: "#A370F7", shadow: "#4C2B88" },
  };
  const activeHair = hairColors[c.hairColor] || hairColors["color-brown-light"];

  // Highlights/Mechas matching active highlights
  const highlightColors: Record<string, string> = {
    "hl-black-blue": "#33B3FF",
    "hl-brown-red": "#FF4D4D",
    "hl-blonde-pink": "#FF80BF",
    "hl-custom-neon": "#00FF66",
  };
  const activeHighlightHex = highlightColors[c.hairHighlight] || "";

  // 360 degree rotation parallax calculations (to rotate the illustrated character organically)
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const isFront = cos >= 0;

  // Horizontal parallax translation offsets to simulate volumetric 3D depth on rotation
  const pxFac = sin; 
  const headX = pxFac * 11;
  const eyesX = pxFac * 14;
  const hairFrontX = pxFac * 9;
  const hairBackX = -pxFac * 5;
  const chestX = pxFac * 6;
  const armsX = pxFac * 4;
  const feetX = pxFac * 3;
  const backpackX = -pxFac * 11;

  // Y-axis offset for custom coordinate alignment
  const charYOffset = 18;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-[370px] mx-auto overflow-hidden">
      
      {/* 2.5D High-Fidelity Vector Viewport */}
      <svg
        viewBox="0 0 260 350"
        className="w-full h-full"
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
          {/* Glowing neon filter to match floor stage hologram */}
          <filter id="glow-neon-stage" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Academic gold shield glow filter */}
          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Premium soft drop shadow for layers depth */}
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          {/* Gradients for organic styling */}
          <linearGradient id="stage-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Skirt color gradient */}
          <linearGradient id="skirt-checkers" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* Sudadera blanca premium */}
          <linearGradient id="white-hoodie" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#D8E2ED" />
          </linearGradient>

          {/* Sudadera blanca vista trasera (más sombreada) */}
          <linearGradient id="white-hoodie-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Varsity sleeves (azul marino) */}
          <linearGradient id="sleeve-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Varsity jacket body (boy) */}
          <linearGradient id="jacket-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>

          {/* Letterman white sleeves */}
          <linearGradient id="sleeve-white" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Gold crest */}
          <linearGradient id="crest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Hair shining */}
          <linearGradient id="hair-organic-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeHair.highlight} />
            <stop offset="45%" stopColor={activeHair.base} />
            <stop offset="100%" stopColor={activeHair.shadow} />
          </linearGradient>

          {/* Stylized rounded eyes */}
          <radialGradient id="eyes-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2D1A10" />
            <stop offset="70%" stopColor="#4A2A18" />
            <stop offset="100%" stopColor="#150A05" />
          </radialGradient>

          {/* Dark denim pants */}
          <linearGradient id="denim-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="40%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Soft rounded skin shadows */}
          <linearGradient id="skin-shading-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={activeSkin.shadow} />
            <stop offset="30%" stopColor={activeSkin.base} />
            <stop offset="100%" stopColor={activeSkin.glow} />
          </linearGradient>
          <linearGradient id="skin-shading-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={activeSkin.shadow} />
            <stop offset="30%" stopColor={activeSkin.base} />
            <stop offset="100%" stopColor={activeSkin.glow} />
          </linearGradient>

          {/* Blush gradient */}
          <radialGradient id="blush-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Concentric Glowing Neon Rings Stage (Hologram stage under feet) */}
        <g transform="translate(0, 8)">
          <ellipse cx="130" cy="306" rx="74" ry="18" fill="none" stroke="url(#stage-neon)" strokeWidth="4" filter="url(#glow-neon-stage)" opacity="0.85" />
          <ellipse cx="130" cy="306" rx="55" ry="13" fill="none" stroke="#EC4899" strokeWidth="2" filter="url(#glow-neon-stage)" opacity="0.55" />
          <ellipse cx="130" cy="306" rx="42" ry="10" fill="#000" opacity="0.4" />
        </g>

        {/* 2. Floating Aura Decals */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.7">
            <circle cx="130" cy="150" r="92" fill="none" stroke="#FBBF24" strokeWidth="3" strokeDasharray="8,16" />
            <circle cx="130" cy="150" r="66" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="6,12" />
          </g>
        )}

        {c.aura === "aura-math" && (
          <g opacity="0.75">
            <text x="35" y="72" fill="#22D3EE" fontSize="13" fontFamily="monospace" fontWeight="900">π</text>
            <text x="215" y="85" fill="#22D3EE" fontSize="15" fontFamily="monospace" fontWeight="900">∑</text>
            <text x="32" y="195" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="800">E=mc²</text>
            <text x="210" y="200" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="800">√x</text>
          </g>
        )}

        {/* 3. Mascot Companion Pet Owl (detailed near shoulder) */}
        {c.pet === "pet-owl" && isFront && (
          <g transform={`translate(${164 + headX * 0.25}, ${66 + charYOffset})`} filter="url(#soft-shadow)">
            <rect x="0" y="0" width="26" height="30" rx="9" fill="#78350F" />
            <rect x="3" y="5" width="20" height="21" rx="7" fill="#F5F5F5" />
            <circle cx="8" cy="10" r="4.5" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="8" cy="10" r="2" fill="#000" />
            <circle cx="18" cy="10" r="4.5" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="18" cy="10" r="2" fill="#000" />
            <polygon points="13,12 10,15 16,15" fill="#D97706" />
            {/* Tiny graduation cap */}
            <polygon points="13, -5 24, -2 13, 1 2, -2" fill="#1E293B" />
            <rect x="8" y="-2" width="10" height="3" fill="#0F172A" />
            <path d="M19, -2 L22, 4" stroke="#F59E0B" strokeWidth="1" />
          </g>
        )}

        {/* 4. Academic Backpack (drawn behind base body when front) */}
        {isFront && c.accessory.includes("backpack") && (
          <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
            {c.accessory === "acc-school-backpack" && (
              <g>
                <rect x="95" y="112" width="70" height="70" rx="16" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                <rect x="108" y="140" width="44" height="32" rx="7" fill="#334155" />
                <circle cx="130" cy="156" r="6" fill="url(#crest-gradient)" />
              </g>
            )}
            {c.accessory === "acc-science-backpack" && (
              <g>
                <rect x="96" y="108" width="68" height="74" rx="13" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                <rect x="106" y="116" width="48" height="48" rx="6" fill="#10B981" opacity="0.9" />
                <line x1="114" y1="128" x2="146" y2="128" stroke="#06B6D4" strokeWidth="2" />
                <line x1="114" y1="140" x2="146" y2="140" stroke="#06B6D4" strokeWidth="2" />
              </g>
            )}
            {c.accessory === "acc-college-backpack" && (
              <g>
                <rect x="97" y="108" width="66" height="18" rx="4" fill="#EF4444" stroke="#991B1B" strokeWidth="1.2" />
                <rect x="100" y="126" width="60" height="18" rx="4" fill="#10B981" stroke="#047857" strokeWidth="1.2" />
                <rect x="96" y="144" width="68" height="18" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.2" />
              </g>
            )}
          </g>
        )}

        {/* 5. GORGEOUS ILLUSTRATED CHARACTER BASE */}
        <g filter="url(#soft-shadow)">
          {isGirl ? (
            // ==========================================
            // FEMALE CHARACTER - STYLIZED ROUNDED (MUJER)
            // ==========================================
            <g>
              {/* Slender tubular legs */}
              <path d="M98,190 Q98,238 103,285 Q115,285 116,238 Q112,190 98,190 Z" fill="url(#skin-shading-left)" />
              <path d="M162,190 Q162,238 157,285 Q145,285 144,238 Q148,190 162,190 Z" fill="url(#skin-shading-right)" />
              
              {/* White thigh-high socks wraps round leg */}
              <path d="M98.5,212 C104,214 110,214 115.5,212 L116,285 L103,285 L98.5,238 Z" fill="#FFFFFF" />
              <path d="M144.5,212 C150,214 156,214 161.5,212 L157,285 L144,285 L144.5,238 Z" fill="#FFFFFF" />
              
              {/* Double navy blue stripes wrapping around the sock cylinder */}
              <path d="M98.8,217 C104,219 110,219 115.2,217" stroke="#1A3A73" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M144.8,217 C150,219 156,219 161.2,217" stroke="#1A3A73" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M99,223 C104,225 110,225 115,223" stroke="#1A3A73" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d="M145,223 C150,225 156,225 161,223" stroke="#1A3A73" strokeWidth="2.2" fill="none" strokeLinecap="round" />

              {/* White & blue athletic sneakers with rounded sporty contours */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Left Shoe */}
                <path d="M95,274 C93,254 122,254 124,274 L125,288 C125,291 95,291 95,288 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <path d="M95,282 C105,283 115,282 125,279" stroke="#1E40AF" strokeWidth="2.2" fill="none" />
                <path d="M95,284 L125,284 L125,289 L95,289 Z" fill="#1E40AF" />
                <line x1="102" y1="265" x2="116" y2="265" stroke="#3B82F6" strokeWidth="1.2" />
                <line x1="103" y1="270" x2="115" y2="270" stroke="#3B82F6" strokeWidth="1.2" />

                {/* Right Shoe */}
                <path d="M136,274 C134,254 163,254 165,274 L166,288 C166,291 136,291 136,288 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <path d="M136,282 C146,283 156,282 166,279" stroke="#1E40AF" strokeWidth="2.2" fill="none" />
                <path d="M136,284 L166,284 L166,289 L136,289 Z" fill="#1E40AF" />
                <line x1="143" y1="265" x2="157" y2="265" stroke="#3B82F6" strokeWidth="1.2" />
                <line x1="144" y1="270" x2="156" y2="270" stroke="#3B82F6" strokeWidth="1.2" />
              </g>

              {/* Blue Plaid pleated school skirt with volume folds */}
              <g transform={`translate(${chestX * 0.8}, 0)`}>
                {/* Flared organic skirt base */}
                <path d="M96,170 Q130,166 164,170 Q182,204 186,208 C156,212 104,212 74,208 Q78,204 96,170 Z" fill="url(#skirt-checkers)" stroke="#0F172A" strokeWidth="1" />
                
                {/* Scalloped pleated bottom hem simulation */}
                <path d="M74,208 Q82,210 90,208 Q98,210 106,208 Q114,210 122,208 Q130,210 138,208 Q146,210 154,208 Q162,210 170,208 Q178,210 186,208" stroke="#0F172A" strokeWidth="1.5" fill="none" />
                
                {/* Elegant subtle grid pattern lines */}
                <path d="M96,170 L86,208 M108,170 L102,208 M120,169 L120,208 M132,169 L138,208 M144,170 L154,208 M154,170 L170,208" stroke="url(#crest-gradient)" strokeWidth="1.2" opacity="0.65" />
                <path d="M84,182 Q130,185 176,182 M78,195 Q130,198 182,195" stroke="url(#crest-gradient)" strokeWidth="0.8" opacity="0.5" />
              </g>

              {/* White varsity hoodie with navy cuffs & neck bow tie */}
              <g transform={`translate(${chestX}, 0)`}>
                {/* Torso rounded organic hoodie */}
                <path d="M91,108 C91,95 169,95 169,108 L172,172 C172,176 161,178 130,178 C99,178 88,176 88,172 Z" fill="url(#white-hoodie)" stroke="#CBD5E1" strokeWidth="1" />
                
                {/* Dark blue side contrast panel strips */}
                <path d="M88,114 L96,112 L92,172 L88,172 Z" fill="#1A3A73" />
                <path d="M172,114 L164,112 L168,172 L172,172 Z" fill="#1A3A73" />

                {/* Waistband ribbing */}
                <rect x="92" y="170" width="76" height="8" rx="3" fill="#1A3A73" />
                
                {/* Left/Right Sleeves as rounded tubes */}
                <g transform={`translate(${-chestX + armsX}, 0)`}>
                  <path d="M91,108 Q77,132 76,166" stroke="url(#sleeve-blue)" strokeWidth="13" strokeLinecap="round" fill="none" />
                  <path d="M169,108 Q183,132 184,166" stroke="url(#sleeve-blue)" strokeWidth="13" strokeLinecap="round" fill="none" />
                  
                  {/* Sleeve white cuffs */}
                  <circle cx="76" cy="166" r="6.5" fill="#FFFFFF" />
                  <circle cx="184" cy="166" r="6.5" fill="#FFFFFF" />

                  {/* Skin tone rounded hands */}
                  <circle cx="76" cy="172" r="5" fill={activeSkin.base} />
                  <circle cx="184" cy="172" r="5" fill={activeSkin.base} />
                </g>

                {/* Drawstrings */}
                <path d="M122,118 Q120,146 117,150" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M138,118 Q140,146 143,150" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="117" cy="151" r="1.5" fill="#94A3B8" />
                <circle cx="143" cy="151" r="1.5" fill="#94A3B8" />

                {/* White inner shirt neck & red ribbon bow tie */}
                <polygon points="130,108 120,114 140,114" fill="#FFFFFF" />
                <circle cx="130" cy="117" r="3" fill="#EF4444" />
                <path d="M130,117 L120,126 L124,128 Z" fill="#B91C1C" />
                <path d="M130,117 L140,126 L136,128 Z" fill="#B91C1C" />

                {/* Gold academic mascot shield/crest on the chest */}
                <g filter="url(#gold-glow)">
                  <polygon points="112,126 121,122 121,134 112,138" fill="url(#crest-gradient)" />
                  <polygon points="121,122 130,126 130,138 121,134" fill="url(#crest-gradient)" />
                  <polygon points="121,126 124,128 121,130 118,128" fill="#1E293B" />
                </g>
              </g>
            </g>
          ) : (
            // ==========================================
            // MASCULINE CHARACTER - STYLIZED ROUNDED (HOMBRE)
            // ==========================================
            <g>
              {/* Denim cargo pants - tubular rounded shapes */}
              <g transform={`translate(${feetX}, 0)`}>
                <path d="M99,190 Q97,236 98,276 Q108,278 116,276 Q118,236 116,190 Z" fill="url(#denim-grad)" />
                <path d="M161,190 Q163,236 162,276 Q152,278 144,276 Q142,236 144,190 Z" fill="url(#denim-grad)" />
                
                {/* Round pockets flaps on thighs */}
                <rect x="90" y="210" width="8" height="16" rx="3.5" fill="#1E3A8A" />
                <rect x="162" y="210" width="8" height="16" rx="3.5" fill="#1E3A8A" />
                
                {/* Subtle soft fold lines for trousers volume */}
                <path d="M99,228 Q108,232 115,228" stroke="#1D4ED8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M145,228 Q152,232 161,228" stroke="#1D4ED8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>

              {/* Modern sporty sneakers matching round profile */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Left shoe */}
                <path d="M93,272 C91,254 120,254 122,272 L123,288 C123,291 93,291 93,288 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="93" y="283" width="29" height="6" rx="2" fill="#FFFFFF" />
                <line x1="100" y1="264" x2="114" y2="264" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Right shoe */}
                <path d="M138,272 C136,254 165,254 167,272 L168,288 C168,291 138,291 138,288 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="138" y="283" width="29" height="6" rx="2" fill="#FFFFFF" />
                <line x1="145" y1="264" x2="159" y2="264" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>

              {/* Navy blue letterman jacket with white sleeves */}
              <g transform={`translate(${chestX}, 0)`}>
                {/* Torso rounded jacket */}
                <path d="M91,106 C91,92 169,92 169,106 L172,192 C172,196 161,198 130,198 C99,198 88,196 88,192 Z" fill="url(#jacket-blue)" stroke="#0F172A" strokeWidth="1" />
                
                {/* Waistband ribbing striped */}
                <rect x="91" y="190" width="78" height="8" rx="2.5" fill="#1E3A8A" />
                <line x1="91" y1="194" x2="169" y2="194" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Varsity White Sleeves rounded */}
                <g transform={`translate(${-chestX + armsX}, 0)`}>
                  <path d="M91,106 Q76,130 75,182" stroke="url(#sleeve-white)" strokeWidth="14" strokeLinecap="round" fill="none" />
                  <path d="M169,106 Q184,130 185,182" stroke="url(#sleeve-white)" strokeWidth="14" strokeLinecap="round" fill="none" />
                  
                  {/* Blue striped cuffs */}
                  <circle cx="75" cy="182" r="7" fill="#1E3A8A" />
                  <circle cx="75" cy="182" r="4.5" fill="#FFFFFF" />
                  <circle cx="185" cy="182" r="7" fill="#1E3A8A" />
                  <circle cx="185" cy="182" r="4.5" fill="#FFFFFF" />

                  {/* Skin tone hands */}
                  <circle cx="75" cy="189" r="5" fill={activeSkin.base} />
                  <circle cx="185" cy="189" r="5" fill={activeSkin.base} />
                </g>

                {/* Center line with white metal button dots */}
                <line x1="130" y1="106" x2="130" y2="190" stroke="#111827" strokeWidth="2.2" />
                <circle cx="130" cy="120" r="2.2" fill="#E2E8F0" />
                <circle cx="130" cy="138" r="2.2" fill="#E2E8F0" />
                <circle cx="130" cy="156" r="2.2" fill="#E2E8F0" />
                <circle cx="130" cy="174" r="2.2" fill="#E2E8F0" />

                {/* College letters patch badge */}
                <g filter="url(#gold-glow)">
                  <rect x="104" y="122" width="13" height="16" rx="2.5" fill="url(#crest-gradient)" />
                  <text x="107" y="134" fill="#3A1E11" fontSize="10.5" fontWeight="950" fontFamily="sans-serif">L</text>
                </g>
              </g>
            </g>
          )}

          {/* Skin tone stylized neck (connecting head and torso organically) */}
          <path d="M121,95 C121,95 124,116 130,116 C136,116 139,95 139,95 Z" fill={activeSkin.shadow} transform={`translate(${headX}, ${charYOffset})`} />

          {/* 6. HIGH-FIDELITY SHADED ROUNDED HEAD */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            {/* Tapered egg shape head for friendly cartoon vibe (not perfect circle, not square) */}
            <path d="M98,72 C98,44 162,44 162,72 C162,94 150,102 130,102 C110,102 98,94 98,72 Z" fill={activeSkin.base} />
            
            {/* Soft rounded ears */}
            <circle cx="94" cy="74" r="6" fill={activeSkin.shadow} />
            <circle cx="166" cy="74" r="6" fill={activeSkin.shadow} />

            {/* Cheek rosy blush */}
            {isFront && (
              <g>
                <circle cx="112" cy="83" r="10" fill="url(#blush-radial)" />
                <circle cx="148" cy="83" r="10" fill="url(#blush-radial)" />
              </g>
            )}
          </g>

          {/* 7. EXPRESSIVE STYLIZED FACES */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              {c.face === "face-happy" && (
                <g>
                  {/* Left Expressive Eye */}
                  <ellipse cx="114" cy="74" rx="8" ry="11" fill="#FFFFFF" />
                  <circle cx="114" cy="74" r="6.8" fill="url(#eyes-pupil)" />
                  <circle cx="111.8" cy="70.8" r="2.4" fill="#FFFFFF" />
                  <circle cx="116" cy="77" r="1.0" fill="#FFFFFF" />

                  {/* Right Expressive Eye */}
                  <ellipse cx="146" cy="74" rx="8" ry="11" fill="#FFFFFF" />
                  <circle cx="146" cy="74" r="6.8" fill="url(#eyes-pupil)" />
                  <circle cx="143.8" cy="70.8" r="2.4" fill="#FFFFFF" />
                  <circle cx="148" cy="77" r="1.0" fill="#FFFFFF" />

                  {/* Smooth curved eyelashes line */}
                  <path d="M104,67 Q114,64 120,67" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M156,67 Q146,64 140,67" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />

                  {/* Clean expressive brows */}
                  <path d="M106,58 Q115,53 120,57" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M154,58 Q145,53 140,57" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* Cute simplified smile mouth */}
                  <path d="M123,83 Q130,92 137,83 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="0.5" />
                  <path d="M125,83 Q130,87 135,83" fill="#FFFFFF" />
                </g>
              )}

              {c.face === "face-studying" && (
                <g>
                  {/* Intelligent focus eyes */}
                  <path d="M109,72 Q115,68 121,72" stroke="#1A0F0A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M139,72 Q145,68 151,72" stroke="#1A0F0A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                  {/* Rounded reading glasses */}
                  <circle cx="114" cy="73" r="12" stroke="#1E293B" strokeWidth="2.5" fill="none" />
                  <circle cx="146" cy="73" r="12" stroke="#1E293B" strokeWidth="2.5" fill="none" />
                  <line x1="126" y1="73" x2="134" y2="73" stroke="#1E293B" strokeWidth="2.5" />

                  <path d="M106,57 Q115,52 120,55" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M154,57 Q145,52 140,55" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  
                  {/* Small focused smile */}
                  <path d="M125,88 Q130,92 135,88" stroke="#1A0F0A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-excited" && (
                <g>
                  {/* Sparkling star-like big cartoon eyes */}
                  <polygon points="114,62 116.5,67 122,67.5 118,71 119.5,76.5 114,73.5 108.5,76.5 110,71 106,67.5 111.5,67" fill="url(#crest-gradient)" />
                  <polygon points="146,62 148.5,67 154,67.5 150,71 151.5,76.5 146,73.5 140.5,76.5 142,71 138,67.5 143.5,67" fill="url(#crest-gradient)" />
                  
                  <path d="M106,56 Q115,50 120,54" stroke="#4C2411" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  <path d="M154,56 Q145,50 140,54" stroke="#4C2411" strokeWidth="2.8" strokeLinecap="round" fill="none" />

                  {/* Open happy laughing mouth */}
                  <path d="M121,81 Q130,98 139,81 Z" fill="#B91C1C" />
                  <path d="M124,82 Q130,86 136,82" fill="#FFFFFF" />
                </g>
              )}

              {c.face === "face-cool" && (
                <g>
                  {/* Sleek rounded dark sunglasses */}
                  <path d="M102,66 L126,66 L124,78 Q114,83 104,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <path d="M134,66 L158,66 L156,78 Q146,83 136,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <line x1="125" y1="71" x2="135" y2="71" stroke="#0F172A" strokeWidth="3" />

                  {/* Smart mouth curve */}
                  <path d="M125,87 Q132,88 136,84" stroke="#1A0F0A" strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.face === "face-wink" && (
                <g>
                  {/* Left Eye open */}
                  <ellipse cx="114" cy="74" rx="8" ry="11" fill="#FFFFFF" />
                  <circle cx="114" cy="74" r="6.5" fill="url(#eyes-pupil)" />
                  <circle cx="111.8" cy="70.8" r="2.2" fill="#FFFFFF" />

                  {/* Right Eye winking curve */}
                  <path d="M138,75 Q146,81 154,75" stroke="#1A0F0A" strokeWidth="3" fill="none" strokeLinecap="round" />

                  <path d="M106,58 Q115,53 120,57" stroke="#4C2411" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  <path d="M154,55 Q145,51 140,54" stroke="#4C2411" strokeWidth="2.8" strokeLinecap="round" fill="none" />

                  {/* Smirk mouth */}
                  <path d="M123,85 Q130,90 135,84" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-curious" && (
                <g>
                  {/* Puzzled looking up eyes */}
                  <ellipse cx="114" cy="72" rx="7.5" ry="10" fill="#FFFFFF" />
                  <circle cx="115" cy="68" r="4.8" fill="url(#eyes-pupil)" />
                  <circle cx="113.5" cy="66" r="1.8" fill="#FFFFFF" />

                  <ellipse cx="146" cy="72" rx="7.5" ry="10" fill="#FFFFFF" />
                  <circle cx="147" cy="68" r="4.8" fill="url(#eyes-pupil)" />
                  <circle cx="145.5" cy="66" r="1.8" fill="#FFFFFF" />

                  {/* Thinking brows */}
                  <path d="M104,54 Q114,49 120,53" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M154,61 Q144,57 138,60" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                  {/* Thinking mouth */}
                  <ellipse cx="130" cy="87" rx="3" ry="1.8" fill="#1A0F0A" />
                </g>
              )}
            </g>
          )}

          {/* 8. HAIRSTYLES - REDESIGNED VOLUMETRIC SMOOTH BLOCKS */}
          <g>
            {/* Back hair rendering (behind shoulders) */}
            {isFront && (c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-curly" || (isGirl && c.hairStyle === "hair-short")) && (
              <g transform={`translate(${hairBackX}, ${charYOffset})`}>
                <path d="M95,72 C80,102 78,162 88,188 C94,198 106,194 104,170 C102,136 108,106 114,72 Z" fill="url(#hair-organic-shine)" />
                <path d="M165,72 C180,102 182,162 172,188 C166,198 154,194 156,170 C158,136 152,106 146,72 Z" fill="url(#hair-organic-shine)" />
              </g>
            )}

            {/* Front hair layers (cascading frame) */}
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {/* Hair Wavy (Default female voluminous waves in clean stylized blocks) */}
              {(c.hairStyle === "hair-wavy" || (isGirl && c.hairStyle === "hair-short")) && (
                <g>
                  {/* Top hair dome */}
                  <path d="M92,68 C92,26 168,26 168,68 C168,78 160,78 156,72 C144,54 130,54 116,54 C104,72 92,78 92,68 Z" fill="url(#hair-organic-shine)" />
                  {/* Clean rounded swooshing bangs */}
                  <path d="M98,56 Q130,46 160,64 Q142,46 118,52" fill={activeHair.highlight} opacity="0.9" />
                  
                  {/* Thick smooth waves cascading on chest (Pixar vibe but simplified blocks) */}
                  <path d="M92,66 Q76,104 88,142 Q96,170 91,198 Q84,164 82,126 Z" fill="url(#hair-organic-shine)" />
                  <path d="M168,66 Q184,104 172,142 Q164,170 169,198 Q176,164 178,126 Z" fill="url(#hair-organic-shine)" />

                  {/* Highlights mechas details */}
                  <path d="M84,102 Q94,138 88,168" stroke={activeHair.highlight} strokeWidth="2" fill="none" opacity="0.5" />
                  <path d="M176,102 Q166,138 172,168" stroke={activeHair.highlight} strokeWidth="2" fill="none" opacity="0.5" />

                  {/* Blended warm tip highlights matching reference (Rosa/Rojo) */}
                  {activeHighlightHex && (
                    <g opacity="0.85">
                      <path d="M86,150 Q92,176 89,198 Q83,168 83,150 Z" fill={activeHighlightHex} />
                      <path d="M174,150 Q168,176 171,198 Q177,168 177,150 Z" fill={activeHighlightHex} />
                    </g>
                  )}
                </g>
              )}

              {/* Spiky Short Hair - Rounded blocky style */}
              {!isGirl && c.hairStyle === "hair-short" && (
                <g>
                  <path d="M94,70 C94,36 166,36 166,70 C166,80 156,80 153,76 Q144,66 130,66 Q116,66 107,76 C104,80 94,80 94,70 Z" fill="url(#hair-organic-shine)" />
                  {/* Simplified spiky hair volumetric crest */}
                  <path d="M102,52 L116,34 L126,44 L138,32 L146,44 L158,34 L160,52 Z" fill={activeHair.highlight} />
                </g>
              )}

              {/* Hair Long Style */}
              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M92,68 C92,30 168,30 168,68 C168,78 162,78 158,72 Q144,58 130,58 Q116,58 102,72 C98,78 92,78 92,68 Z" fill="url(#hair-organic-shine)" />
                  <path d="M92,68 C82,100 82,154 92,180 C94,186 98,186 98,176 C96,144 98,110 100,68 Z" fill="url(#hair-organic-shine)" />
                  <path d="M168,68 C178,100 178,154 168,180 C166,186 162,186 162,176 C164,144 162,110 160,68 Z" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Hair Straight Style */}
              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M94,68 C94,34 166,34 166,68 C166,78 158,78 156,72 Q144,58 130,58 Q116,58 104,72 C102,78 94,78 94,68 Z" fill="url(#hair-organic-shine)" />
                  <rect x="94" y="66" width="10" height="60" rx="4.5" fill="url(#hair-organic-shine)" />
                  <rect x="156" y="66" width="10" height="60" rx="4.5" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Hair Afro Style - Volumetric soft overlapping circles */}
              {c.hairStyle === "hair-afro" && (
                <g>
                  <circle cx="130" cy="56" r="36" fill="url(#hair-organic-shine)" />
                  <circle cx="106" cy="62" r="30" fill="url(#hair-organic-shine)" />
                  <circle cx="154" cy="62" r="30" fill="url(#hair-organic-shine)" />
                  <circle cx="130" cy="40" r="28" fill={activeHair.highlight} opacity="0.8" />
                </g>
              )}

              {/* Hair Braids Style */}
              {c.hairStyle === "hair-braids" && (
                <g>
                  <path d="M92,68 C92,34 168,34 168,68 C168,78 160,78 156,72 Q144,58 130,58 Q116,58 104,72 C100,78 92,78 92,68 Z" fill="url(#hair-organic-shine)" />
                  <path d="M90,70 L86,176 Q84,184 92,184 L96,70 Z" fill="url(#hair-organic-shine)" stroke={activeHair.shadow} strokeWidth="1" />
                  <path d="M170,70 L174,176 Q176,184 168,184 L164,70 Z" fill="url(#hair-organic-shine)" stroke={activeHair.shadow} strokeWidth="1" />
                  <circle cx="89" cy="174" r="3" fill="#EF4444" />
                  <circle cx="171" cy="174" r="3" fill="#EF4444" />
                </g>
              )}

              {/* Hair Pigtails Style */}
              {c.hairStyle === "hair-pigtails" && (
                <g>
                  <path d="M92,68 C92,34 168,34 168,68 C168,78 160,78 156,72 Q144,58 130,58 Q116,58 104,72 C100,78 92,78 92,68 Z" fill="url(#hair-organic-shine)" />
                  <ellipse cx="78" cy="62" rx="13" ry="22" fill="url(#hair-organic-shine)" transform="rotate(-20, 78, 62)" />
                  <ellipse cx="182" cy="62" rx="13" ry="22" fill="url(#hair-organic-shine)" transform="rotate(20, 182, 62)" />
                  <circle cx="84" cy="61" r="3.5" fill="#3B82F6" />
                  <circle cx="172" cy="61" r="3.5" fill="#3B82F6" />
                </g>
              )}
            </g>
          </g>

          {/* 9. HEADWEAR ACCESSORIES */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="22" ry="7" fill="#111827" />
                  <rect x="108" y="39" width="44" height="8" fill="#111827" />
                  <polygon points="130,30 166,40 130,50 94,40" fill="#1F2937" stroke="#111827" strokeWidth="1" />
                  <path d="M130,40 L158,45 L161,56" fill="none" stroke="url(#crest-gradient)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="161" cy="58" r="2.5" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#gold-glow)">
                  <path d="M104,48 L106,26 L118,38 L130,18 L142,38 L154,26 L156,48 Z" fill="url(#crest-gradient)" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="130" cy="34" r="3" fill="#EF4444" />
                  <circle cx="118" cy="41" r="1.5" fill="#3B82F6" />
                  <circle cx="142" cy="41" r="1.5" fill="#3B82F6" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && (
                <g>
                  <circle cx="114" cy="73" r="11" stroke="#4B5563" strokeWidth="2.5" fill="none" />
                  <circle cx="146" cy="73" r="11" stroke="#4B5563" strokeWidth="2.5" fill="none" />
                  <line x1="125" y1="73" x2="135" y2="73" stroke="#4B5563" strokeWidth="2.5" />
                </g>
              )}
            </g>
          )}

          {/* 10. HEADPHONES OVERLAY */}
          {c.accessory === "acc-headphones" && isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {/* Rounded comfortable modern earcups */}
              <rect x="88" y="60" width="10" height="26" rx="5" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="1" />
              <rect x="162" y="60" width="10" height="26" rx="5" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="1" />
              <path d="M93,62 C93,36 167,36 167,62" fill="none" stroke="#7C3AED" strokeWidth="4" />
            </g>
          )}

          {/* 11. REVERSED VIEW BACKPACK & HAIR REVERSE (when rotated > 180 degrees) */}
          {!isFront && (
            <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {/* Overwrite Back of head / hair fully so no faces bleed */}
              <path d="M96,72 C96,44 164,44 164,72 C164,94 152,102 130,102 C108,102 96,94 96,72 Z" fill="url(#hair-organic-shine)" transform={`translate(${headX - backpackX}, 0)`} />
              
              {c.accessory.includes("backpack") && (
                <g>
                  {c.accessory === "acc-school-backpack" && (
                    <g>
                      <rect x="92" y="106" width="76" height="78" rx="16" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                      <rect x="102" y="128" width="56" height="42" rx="8" fill="#334155" />
                    </g>
                  )}
                  {c.accessory === "acc-science-backpack" && (
                    <g>
                      <rect x="92" y="104" width="76" height="80" rx="12" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5" />
                      <rect x="100" y="112" width="60" height="52" rx="5" fill="#10B981" />
                    </g>
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
            isRotating ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-purple-500/20" : "bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800"
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

      {/* Floating drag rotation instructions */}
      <span className="absolute top-3 right-4 text-[9px] font-bold tracking-wide text-purple-400 uppercase bg-slate-950/85 px-2 py-0.5 rounded-full border border-purple-500/20 shadow-sm animate-pulse">
        Arrastra para rotar
      </span>
    </div>
  );
}
