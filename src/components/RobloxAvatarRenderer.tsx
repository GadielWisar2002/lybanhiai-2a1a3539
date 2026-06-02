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
  bodyType?: string;
  zoom?: number;
  viewMode?: "body" | "clothes" | "animation" | "expressions";
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
    skinColor: config?.skinColor || "#E8B89A", // hex skin code
    hairStyle: config?.hairStyle || "hair-short", 
    hairColor: config?.hairColor || "#3B1F0A", // hex color code
    hairHighlight: config?.hairHighlight || "hl-none",
    face: config?.face || "face-happy",
    shirt: config?.shirt || "shirt-academic-jacket",
    pants: config?.pants || "pants-basic-jeans",
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    pet: config?.pet || "",
    aura: config?.aura || "",
    outfit: config?.outfit || "",
    gender: config?.gender || "boy", // boy or girl
    bodyType: config?.bodyType || "delgado", // delgado, normal, atletico, robusto
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
      setYaw((prev) => (prev + 1.2) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Parallax multipliers for 360 effect
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const isFront = cos >= 0;

  const pxFac = sin; 
  const headX = pxFac * 7;
  const eyesX = pxFac * 9.5;
  const hairFrontX = pxFac * 6.5;
  const hairBackX = -pxFac * 4.5;
  const chestX = pxFac * 4.5;
  const armsX = pxFac * 3;
  const feetX = pxFac * 1.5;
  const backpackX = -pxFac * 8;

  const charYOffset = 18;

  // Body Type Scale factors
  let bodyWidthScale = 1.0;
  let bodyHeightScale = 1.0;
  if (c.bodyType === "normal") {
    bodyWidthScale = 1.05;
  } else if (c.bodyType === "atletico") {
    bodyWidthScale = 1.12;
  } else if (c.bodyType === "robusto") {
    bodyWidthScale = 1.2;
    bodyHeightScale = 0.98;
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-full min-h-[300px] overflow-hidden">
      
      {/* Viewport SVG */}
      <svg
        viewBox="0 0 260 350"
        className="w-full h-full"
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
          {/* Neon circular glow under feet */}
          <filter id="glow-neon-stage" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft avatar shadow */}
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          {/* Blue neon stage gradient */}
          <linearGradient id="stage-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B4FF" />
            <stop offset="50%" stopColor="#3B6DE8" />
            <stop offset="100%" stopColor="#8B3DE8" />
          </linearGradient>

          {/* Hologram fill radial */}
          <radialGradient id="hologram-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00B4FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#080D24" stopOpacity="0" />
          </radialGradient>

          {/* Skirt checkered linear */}
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

          {/* Blue varsity jacket body (boy) */}
          <linearGradient id="jacket-blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B6DE8" />
            <stop offset="50%" stopColor="#254EB5" />
            <stop offset="100%" stopColor="#172F75" />
          </linearGradient>

          {/* Gold badge gradient */}
          <linearGradient id="crest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Stylized rounded realistic eyes */}
          <radialGradient id="eyes-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8E5136" />
            <stop offset="65%" stopColor="#59311F" />
            <stop offset="100%" stopColor="#1C0F07" />
          </radialGradient>

          {/* Dark denim pants */}
          <linearGradient id="denim-pants-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E4A7D" />
            <stop offset="55%" stopColor="#1B2E53" />
            <stop offset="100%" stopColor="#0E1B33" />
          </linearGradient>

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
                animation: ${c.viewMode === "animation" ? "idle-breath 3.5s ease-in-out infinite" : "none"};
              }
              .eye-left {
                transform-origin: 117px 74px;
                animation: eye-blink 4.5s ease-in-out infinite;
              }
              .eye-right {
                transform-origin: 143px 74px;
                animation: eye-blink 4.5s ease-in-out infinite;
              }
              .arm-left-group {
                transform-origin: 96px 115px;
                animation: ${c.viewMode === "animation" ? "arm-idle-left 3.5s ease-in-out infinite" : "none"};
              }
              .arm-right-group {
                transform-origin: 164px 115px;
                animation: ${c.viewMode === "animation" ? "arm-idle-right 3.5s ease-in-out infinite" : "none"};
              }
            `}
          </style>
        </defs>

        {/* Circular glowing hologram platform */}
        <g transform="translate(0, 8)">
          <ellipse cx="130" cy="302" rx="74" ry="16" fill="none" stroke="url(#stage-neon)" strokeWidth="3" filter="url(#glow-neon-stage)" opacity="0.9" />
          <ellipse cx="130" cy="302" rx="60" ry="12" fill="url(#hologram-radial)" opacity="0.5" />
          <ellipse cx="130" cy="302" rx="42" ry="8" fill="none" stroke="#00B4FF" strokeWidth="1" opacity="0.6" filter="url(#glow-neon-stage)" />
        </g>

        {/* Math or Golden Aura VFX Slot */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.65">
            <circle cx="130" cy="150" r="92" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeDasharray="8,16" />
            <circle cx="130" cy="150" r="66" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="6,12" />
          </g>
        )}
        {c.aura === "aura-math" && (
          <g filter="url(#glow-neon-stage)" opacity="0.55" stroke="#00B4FF" strokeWidth="1" fill="none" className="font-mono text-[8px] font-bold">
            <circle cx="130" cy="150" r="85" strokeDasharray="4,12" />
            <text x="60" y="90" fill="#00B4FF">E = mc²</text>
            <text x="175" y="105" fill="#00B4FF">π ≈ 3.14</text>
            <text x="50" y="210" fill="#00B4FF">x² + y² = r²</text>
            <text x="170" y="220" fill="#00B4FF">∫ f(x)dx</text>
          </g>
        )}

        {/* ==========================================
            HUMANOID ROOT SKELETON RIG (7 HEADS HIGH)
            ========================================== */}
        <g className="skeleton-root" filter="url(#soft-shadow)" transform={`scale(${bodyWidthScale}, ${bodyHeightScale}) translate(${130 * (1 - bodyWidthScale) / bodyWidthScale}, ${290 * (1 - bodyHeightScale) / bodyHeightScale})`}>
          
          {/* 1. BACK HAIR (Layered behind back) */}
          {isFront && (
            <g transform={`translate(${hairBackX}, ${charYOffset})`}>
              {(c.hairStyle === "hair-wavy" || c.hairStyle === "hair-long" || c.hairStyle === "hair-curly" || c.hairStyle === "hair-pigtails" || c.hairStyle === "hair-braids" || c.hairStyle === "hair-female-modern") && (
                <path
                  d="M102,72 C84,95 72,130 76,195 C80,215 96,210 94,180 C92,145 106,104 130,104 C154,104 168,145 166,180 C164,210 180,215 184,195 C188,130 176,95 158,72 Z"
                  fill={c.hairColor}
                />
              )}
            </g>
          )}

          {/* 2. BACKPACK SLOT */}
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

          {/* 3. HUMANOID LOWER SKELETON (Legs, Pants, Shoes) */}
          {c.viewMode !== "expressions" && (
            <g transform={`translate(${feetX}, 0)`}>
              
              {/* Humanoid Legs Skin Base */}
              <path d="M116,203 Q114,240 117,278 L124,278 Q123,240 122,203 Z" fill={c.skinColor} />
              <path d="M138,203 Q137,240 136,278 L143,278 Q146,240 144,203 Z" fill={c.skinColor} />

              {/* Socks (Female Uniform Style) */}
              {isGirl && c.pants === "pants-basic-skirt" && (
                <g>
                  <path d="M116.5,232 L124,232 L124,278 L117,278 Z" fill="#FFFFFF" />
                  <path d="M116.6,236 Q119.5,237.5 122.3,236" stroke="#1B2E53" strokeWidth="1.5" fill="none" />
                  <path d="M116.7,240 Q119.5,241.5 122.2,240" stroke="#1B2E53" strokeWidth="1.5" fill="none" />

                  <path d="M137.5,232 L143.5,232 L143,278 L136,278 Z" fill="#FFFFFF" />
                  <path d="M137.7,236 Q140.5,237.5 143.3,236" stroke="#1B2E53" strokeWidth="1.5" fill="none" />
                  <path d="M137.6,240 Q140.5,241.5 143.2,240" stroke="#1B2E53" strokeWidth="1.5" fill="none" />
                </g>
              )}

              {/* MODULAR BOTTOM PIECE (BOTTOM SLOT) */}
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

              {c.pants === "pants-basic-jeans" && (
                <g>
                  <path d="M112,170 Q106,220 108,278 L124,278 Q124,220 122,170 Z" fill="url(#denim-pants-grad)" />
                  <path d="M138,170 Q136,220 136,278 L152,278 Q154,220 148,170 Z" fill="url(#denim-pants-grad)" />
                  <path d="M112,170 L112,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                  <path d="M148,170 L148,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                </g>
              )}

              {/* MODULAR SHOES PIECE */}
              {c.shoes !== "" && (
                <g>
                  {/* Left sneaker */}
                  <path d="M114,275 C110,270 125,268 127,275 L128,288 C128,291 113,291 113,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <path d="M113.5,282 Q121,283 127.5,279" stroke="#3B6DE8" strokeWidth="2" fill="none" />
                  <path d="M113,286 L128,286 L128,290 L113,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
                  {/* Right sneaker */}
                  <path d="M133,275 C131,268 146,270 142,275 L143,288 C143,291 128,291 128,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <path d="M128.5,279 Q135,283 142.5,282" stroke="#3B6DE8" strokeWidth="2" fill="none" />
                  <path d="M128,286 L143,286 L143,290 L128,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
                </g>
              )}

            </g>
          )}

          {/* 4. HUMANOID UPPER SKELETON (Torso & Arms) */}
          {c.viewMode !== "expressions" && (
            <g transform={`translate(${chestX}, 0)`}>
              
              {/* Torso skin base */}
              <path d="M100,115 C100,115 130,108 130,108 C130,108 160,115 160,115 L146,180 L114,180 Z" fill={c.skinColor} />

              {/* MODULAR CLOTHING COVERS */}
              {c.shirt === "shirt-basic-hoodie" && (
                <g>
                  <path d="M96,112 C96,98 164,98 164,112 L146,170 C146,172 114,172 114,170 Z" fill="url(#white-hoodie-grad)" stroke="#CBD5E1" strokeWidth="0.8" />
                  <path d="M120,112 L140,112 L130,126 Z" fill={c.skinColor} />
                  <path d="M120,112 L124,124 L130,126 L136,124 L140,112 Z" fill="#FFFFFF" />
                  <circle cx="130" cy="123" r="2.8" fill="#EF4444" />
                  <path d="M130,123 L121,131 L125,133 Z" fill="#B91C1C" />
                  <path d="M130,123 L139,131 L135,133 Z" fill="#B91C1C" />
                </g>
              )}

              {c.shirt === "shirt-academic-jacket" && (
                <g>
                  <path d="M94,110 C94,98 166,98 166,110 L148,170 C148,172 112,172 112,170 Z" fill="url(#jacket-blue-grad)" stroke="#0F172A" strokeWidth="0.8" />
                  <rect x="110" y="166" width="40" height="6" rx="2" fill="#1E3A8A" />
                  <path d="M118,110 L142,110 L130,124 Z" fill={c.skinColor} />
                  <g filter="url(#gold-glow)">
                    <rect x="103" y="120" width="13" height="15" rx="2" fill="url(#crest-gradient)" />
                    <text x="106" y="131" fill="#1C0F07" fontSize="9" fontWeight="900" fontFamily="sans-serif">E</text>
                  </g>
                </g>
              )}

              {c.shirt === "shirt-basic-tee" && (
                <g>
                  <path d="M96,112 C96,98 164,98 164,112 L146,170 L114,170 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
                </g>
              )}

              {c.shirt === "shirt-lab-coat" && (
                <g>
                  <path d="M96,112 C96,98 164,98 164,112 L146,170 L114,170 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
                  <path d="M124,112 L124,170" stroke="#CBD5E1" strokeWidth="1" />
                </g>
              )}

              {/* Sleek arms rigged to shoulder joints */}
              <g className="arm-left-group">
                <path d="M96,112 C88,124 84,142 88,162" stroke={c.shirt.includes("hoodie") ? "url(#navy-fabric-grad)" : c.shirt.includes("jacket") ? "#FFFFFF" : c.skinColor} strokeWidth="10" strokeLinecap="round" fill="none" />
                <circle cx="86" cy="166" r="4.2" fill={c.skinColor} />
              </g>
              <g className="arm-right-group">
                <path d="M164,112 C172,124 176,142 172,162" stroke={c.shirt.includes("hoodie") ? "url(#navy-fabric-grad)" : c.shirt.includes("jacket") ? "#FFFFFF" : c.skinColor} strokeWidth="10" strokeLinecap="round" fill="none" />
                <circle cx="174" cy="166" r="4.2" fill={c.skinColor} />
              </g>
            </g>
          )}

          {/* 5. MODULAR NECK */}
          <path d="M125,95 L135,95 L134,110 L126,110 Z" fill={c.skinColor} transform={`translate(${headX}, ${charYOffset})`} />

          {/* 6. HUMANOID HEAD (HEAD SLOT) */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            <path d="M107,70 C107,45 153,45 153,70 C153,91 143,97 130,97 C117,97 107,91 107,70 Z" fill={c.skinColor} />
            <path d="M107,70 Q101,70 103,78 Q105,82 108,79 Z" fill={c.skinColor} />
            <path d="M153,70 Q159,70 157,78 Q155,82 152,79 Z" fill={c.skinColor} />
            
            {/* Rosy blush */}
            {isFront && (
              <g>
                <circle cx="114" cy="81" r="7.5" fill="url(#blush-radial)" />
                <circle cx="146" cy="81" r="7.5" fill="url(#blush-radial)" />
              </g>
            )}
          </g>

          {/* 7. EXPRESSIVE FACIAL FEATURES */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              <path d="M129.5,77 L130.5,77 L130.5,80.5 Q130.5,82 129,82" stroke="#1A0F0A" strokeWidth="0.9" fill="none" opacity="0.3" strokeLinecap="round" />
              
              <path d="M108,66 C111,62.5 119,62.5 124,66.5" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M136,66.5 C141,62.5 149,62.5 152,66" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              <path d="M126,85 Q130,87.5 134,85" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M127.5,86 Q130,88.5 132.5,86" fill="#F43F5E" opacity="0.65" />

              {/* Blinking almond eyes */}
              <g className="eye-left">
                <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                <circle cx="115.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                <path d="M109,74 C112,71.5 119,71.5 125,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
              <g className="eye-right">
                <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                <circle cx="143" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                <circle cx="141.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                <path d="M135,74 C138,71.5 145,71.5 151,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            </g>
          )}

          {/* 8. FRONT HAIR / BANGS */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              <path d="M107,56 C107,24 153,24 153,56 C153,64 146,65 141,60 C130,46 128,46 119,60 C114,65 107,64 107,56 Z" fill={c.hairColor} />
              
              {/* Hair bangs overlay */}
              {c.hairStyle === "hair-wavy" && (
                <path d="M109,56 C120,44 140,44 151,56 C143,50 135,50 130,53 C125,50 117,50 109,56 Z" fill="#FFFFFF" opacity="0.15" />
              )}
            </g>
          )}

          {/* 9. HEADWEAR ACCESSORIES */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="18" ry="6" fill="#111827" />
                  <rect x="112" y="39" width="36" height="8" fill="#111827" />
                  <polygon points="130,30 164,39 130,48 96,39" fill="#1F2937" stroke="#111827" strokeWidth="1" />
                  <path d="M130,39 L156,43 L159,54" fill="none" stroke="url(#crest-gradient)" strokeWidth="1.8" />
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
                <g>
                  <rect x="99" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <rect x="153" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <path d="M103,62 C103,34 157,34 157,62" fill="none" stroke="#7C3AED" strokeWidth="3.2" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && (
                <g>
                  <circle cx="117" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <circle cx="143" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <line x1="126.5" y1="74" x2="133.5" y2="74" stroke="#1E293B" strokeWidth="2" />
                </g>
              )}
            </g>
          )}

        </g>
      </svg>

    </div>
  );
}
