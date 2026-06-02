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
    hairStyle: config?.hairStyle || "hair-wavy", // default wavy locks
    hairColor: config?.hairColor || "color-brown-light", // default castaño/chocolate
    hairHighlight: config?.hairHighlight || "hl-none",
    face: config?.face || "face-happy",
    shirt: config?.shirt || "shirt-basic-tee",
    pants: config?.pants || "pants-basic-skirt", // default skirt for girl
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    pet: config?.pet || "",
    aura: config?.aura || "",
    outfit: config?.outfit || "",
    gender: config?.gender || "girl", // default to female as requested
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

  // Skin color values with rich Pixar shading
  const skinColors: Record<string, { base: string; shadow: string }> = {
    "skin-light-1": { base: "#FFF1EB", shadow: "#F7D8CC" },
    "skin-light-2": { base: "#FCDAB7", shadow: "#ECC29B" },
    "skin-medium-1": { base: "#EAAD80", shadow: "#D69566" },
    "skin-medium-2": { base: "#C68759", shadow: "#B27142" },
    "skin-dark-1": { base: "#7D4E2D", shadow: "#673D21" },
  };
  const activeSkin = skinColors[c.skinColor] || skinColors["skin-light-2"];

  // Rich Hair colors
  const hairColors: Record<string, { base: string; highlight: string; shadow: string }> = {
    "color-black": { base: "#1A1A1A", highlight: "#404040", shadow: "#0A0A0A" },
    "color-brown-light": { base: "#59311F", highlight: "#8E5136", shadow: "#3A1E11" }, // Rich chocolate
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

  // 360 degree rotation parallax variables
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const isFront = cos >= 0;

  // Parallax horizontal displacements based on angle to simulate volumetric depth
  const pxFac = sin; 
  const headX = pxFac * 12;
  const eyesX = pxFac * 14;
  const hairFrontX = pxFac * 9;
  const hairBackX = -pxFac * 5;
  const chestX = pxFac * 6;
  const armsX = pxFac * 4;
  const feetX = pxFac * 3;
  const backpackX = -pxFac * 11;

  // Render variables for character dimensions
  const charYOffset = 18;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full h-[370px] mx-auto overflow-hidden">
      {/* High-fidelity Pixar / Disney illustrated vector viewport */}
      <svg
        viewBox="0 0 260 350"
        className="w-full h-full cursor-grab active:cursor-grabbing"
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
          {/* Neon violet glow effect filter */}
          <filter id="glow-neon-stage" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Academic Gold glow filter */}
          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComponentTransfer in="blur" result="glow1">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Premium Drop Shadow for character layers */}
          <filter id="char-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          {/* Beautiful gradients for uniform and shadows */}
          <linearGradient id="neon-stage-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="skirt-blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E2A4A" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <linearGradient id="hoodie-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="gold-crest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="hair-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeHair.highlight} />
            <stop offset="40%" stopColor={activeHair.base} />
            <stop offset="100%" stopColor={activeHair.shadow} />
          </linearGradient>

          <linearGradient id="eye-pupil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3E2723" />
            <stop offset="100%" stopColor="#1A0F0A" />
          </linearGradient>

          <linearGradient id="jeans-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>

        {/* 1. STUNNING NEON GLOWING CIRCULAR STAGE (Matching mockup identical) */}
        <g transform="translate(0, 5)">
          {/* Glowing neon floors */}
          <ellipse cx="130" cy="308" rx="72" ry="17" fill="none" stroke="url(#neon-stage-grad)" strokeWidth="4.5" filter="url(#glow-neon-stage)" opacity="0.9" />
          <ellipse cx="130" cy="308" rx="55" ry="12" fill="none" stroke="#A855F7" strokeWidth="2" filter="url(#glow-neon-stage)" opacity="0.6" />
          <ellipse cx="130" cy="308" rx="80" ry="20" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.3" />
          {/* Subtle core shadow beneath character feet */}
          <ellipse cx="130" cy="308" rx="42" ry="9" fill="#000000" opacity="0.45" />
        </g>

        {/* 2. FLOATING AURA EFFECTS */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.75">
            <circle cx="130" cy="150" r="95" fill="none" stroke="#FBBF24" strokeWidth="4" strokeDasharray="6,18" />
            <circle cx="130" cy="150" r="70" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="8,12" />
            {/* Sparkles */}
            <path d="M70,80 L73,85 L78,86 L73,87 L72,92 L71,87 L66,86 L71,85 Z" fill="#FBBF24" />
            <path d="M190,90 L192,93 L195,94 L192,95 L191,98 L190,95 L187,94 L190,93 Z" fill="#FBBF24" />
            <path d="M60,200 L62,203 L65,204 L62,205 L61,208 L60,205 L57,204 L60,203 Z" fill="#FBBF24" />
            <path d="M200,190 L202,193 L205,194 L202,195 L201,198 L200,195 L197,194 L200,193 Z" fill="#FBBF24" />
          </g>
        )}

        {c.aura === "aura-math" && (
          <g opacity="0.8">
            <text x="35" y="70" fill="#67E8F9" fontSize="13" fontFamily="'Outfit', sans-serif" fontWeight="900" opacity="0.8">π</text>
            <text x="215" y="85" fill="#67E8F9" fontSize="15" fontFamily="'Outfit', sans-serif" fontWeight="900" opacity="0.8">∑</text>
            <text x="30" y="190" fill="#38BDF8" fontSize="12" fontFamily="'Outfit', sans-serif" fontWeight="900" opacity="0.7">E = mc²</text>
            <text x="210" y="200" fill="#38BDF8" fontSize="12" fontFamily="'Outfit', sans-serif" fontWeight="900" opacity="0.7">√x</text>
            <text x="130" y="32" fill="#818CF8" fontSize="11" fontFamily="'Outfit', sans-serif" fontWeight="900" opacity="0.7" textAnchor="middle">f(x)=y</text>
          </g>
        )}

        {/* 3. MASCOT COMPANION PET OWL (sitting detailedly on left shoulder) */}
        {c.pet === "pet-owl" && isFront && (
          <g transform={`translate(${172 + headX * 0.3}, ${70 + charYOffset})`} filter="url(#char-shadow)">
            {/* Owl body */}
            <rect x="0" y="0" width="28" height="34" rx="10" fill="#5D4037" />
            <rect x="3" y="6" width="22" height="23" rx="7" fill="#F5F5F5" />
            {/* Eyes */}
            <circle cx="8" cy="12" r="5" fill="#FFEB3B" stroke="#3E2723" strokeWidth="1" />
            <circle cx="8" cy="12" r="2.5" fill="#000000" />
            <circle cx="20" cy="12" r="5" fill="#FFEB3B" stroke="#3E2723" strokeWidth="1" />
            <circle cx="20" cy="12" r="2.5" fill="#000000" />
            {/* Reading glasses */}
            <circle cx="8" cy="12" r="6.5" fill="none" stroke="#212121" strokeWidth="1.5" />
            <circle cx="20" cy="12" r="6.5" fill="none" stroke="#212121" strokeWidth="1.5" />
            <line x1="14" y1="12" x2="14" y2="12" stroke="#212121" strokeWidth="1.5" />
            {/* Beak & wings */}
            <polygon points="14,14 11,18 17,18" fill="#FF9800" />
            <path d="M-2,10 Q-6,18 0,22" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M30,10 Q34,18 28,22" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Tiny Academic Mortarboard Cap */}
            <polygon points="14, -7 27, -3 14, 1 1, -3" fill="#212121" />
            <rect x="8" y="-3" width="12" height="4.5" fill="#1A1A1A" />
            <path d="M22, -4 L25, 4" stroke="#FFD54F" strokeWidth="1.2" />
          </g>
        )}

        {/* 4. BACKPACK (renders behind character base body when facing front) */}
        {isFront && c.accessory.includes("backpack") && (
          <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#char-shadow)">
            {c.accessory === "acc-school-backpack" && (
              <g>
                {/* School backpack dark blue with gold lines */}
                <rect x="94" y="112" width="72" height="74" rx="18" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                <rect x="108" y="142" width="44" height="34" rx="8" fill="#334155" />
                {/* Gold buckles */}
                <rect x="115" y="132" width="6" height="12" rx="1.5" fill="url(#gold-crest)" />
                <rect x="139" y="132" width="6" height="12" rx="1.5" fill="url(#gold-crest)" />
              </g>
            )}
            {c.accessory === "acc-science-backpack" && (
              <g>
                <rect x="96" y="108" width="68" height="78" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2.5" />
                <rect x="106" y="118" width="48" height="52" rx="7" fill="#10B981" opacity="0.9" />
                {/* Bubbling tubes */}
                <line x1="114" y1="130" x2="146" y2="130" stroke="#06B6D4" strokeWidth="2.5" />
                <line x1="114" y1="144" x2="146" y2="144" stroke="#06B6D4" strokeWidth="2.5" />
                <circle cx="118" cy="124" r="2.5" fill="#38BDF8" />
                <circle cx="134" cy="126" r="1.5" fill="#38BDF8" />
              </g>
            )}
            {c.accessory === "acc-college-backpack" && (
              <g>
                <rect x="96" y="110" width="68" height="20" rx="4" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
                <rect x="99" y="130" width="62" height="20" rx="4" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
                <rect x="95" y="150" width="70" height="20" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
                <line x1="106" y1="102" x2="106" y2="178" stroke="#78350F" strokeWidth="3.5" />
                <line x1="154" y1="102" x2="154" y2="178" stroke="#78350F" strokeWidth="3.5" />
              </g>
            )}
          </g>
        )}

        {/* 5. GORGEOUS ILLUSTRATED CHARACTER BASE */}
        <g filter="url(#char-shadow)">
          {isGirl ? (
            // ==========================================
            // HIGH-FIDELITY FEMALE PIXAR CHARACTER (MUJER)
            // ==========================================
            <g>
              {/* Slender legs */}
              <rect x="105" y="200" width="16" height="52" fill={activeSkin.base} />
              <rect x="139" y="200" width="16" height="52" fill={activeSkin.base} />
              {/* Thigh-high socks */}
              <rect x="104" y="210" width="18" height="42" fill="#FFFFFF" rx="2" />
              <rect x="138" y="210" width="18" height="42" fill="#FFFFFF" rx="2" />
              {/* Double navy blue stripes at top of socks */}
              <rect x="104" y="215" width="18" height="3" fill="#1A3A73" />
              <rect x="138" y="215" width="18" height="3" fill="#1A3A73" />
              <rect x="104" y="221" width="18" height="2.2" fill="#1A3A73" />
              <rect x="138" y="221" width="18" height="2.2" fill="#1A3A73" />

              {/* White sneakers with blue panels and stripes (Exactly as reference image) */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Left Shoe */}
                <path d="M100,248 C100,242 120,242 122,248 L123,285 C123,288 98,288 98,285 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                <path d="M98,280 Q106,280 123,276" stroke="#1A3A73" strokeWidth="2.5" fill="none" />
                <rect x="98" y="281" width="25" height="5.5" rx="1.5" fill="#1A3A73" />
                {/* Blue laces */}
                <line x1="105" y1="256" x2="116" y2="256" stroke="#1E40AF" strokeWidth="1.5" />
                <line x1="106" y1="262" x2="115" y2="262" stroke="#1E40AF" strokeWidth="1.5" />

                {/* Right Shoe */}
                <path d="M136,248 C136,242 156,242 158,248 L159,285 C159,288 134,288 134,285 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                <path d="M134,280 Q142,280 159,276" stroke="#1A3A73" strokeWidth="2.5" fill="none" />
                <rect x="134" y="281" width="25" height="5.5" rx="1.5" fill="#1A3A73" />
                {/* Blue laces */}
                <line x1="141" y1="256" x2="152" y2="256" stroke="#1E40AF" strokeWidth="1.5" />
                <line x1="142" y1="262" x2="151" y2="262" stroke="#1E40AF" strokeWidth="1.5" />
              </g>

              {/* Blue/Amber Plaid Pleated Skirt */}
              <g transform={`translate(${chestX * 0.8}, 0)`}>
                <path d="M96,176 L164,176 L172,204 L88,204 Z" fill="url(#skirt-blue-grad)" stroke="#111827" strokeWidth="1.5" />
                {/* Plaid gold lines */}
                <path d="M102,176 L94,204 M114,176 L110,204 M126,176 L126,204 M138,176 L142,204 M150,176 L158,204 L162,204" stroke="url(#gold-crest)" strokeWidth="1.2" opacity="0.85" />
                <path d="M92,185 L168,185 M89,195 L171,195" stroke="url(#gold-crest)" strokeWidth="1" opacity="0.75" />
              </g>

              {/* White varsity hoodie with navy cuffs & neck bow tie */}
              <g transform={`translate(${chestX}, 0)`}>
                <rect x="94" y="112" width="72" height="68" rx="14" fill="url(#hoodie-grad)" stroke="#D1D5DB" strokeWidth="1.5" />
                {/* Navy Blue letterman stripe panel sleeves */}
                <path d="M94,112 L103,112 L99,176 L94,176 Z" fill="#1E3A8A" />
                <path d="M157,112 L166,112 L166,176 L161,176 Z" fill="#1E3A8A" />
                
                {/* Varsity drawstrings */}
                <path d="M123,126 Q120,154 117,156" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <path d="M137,126 Q140,154 143,156" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

                {/* White inner shirt neck & red ribbon bow tie */}
                <polygon points="130,112 121,118 139,118" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
                <circle cx="130" cy="120" r="3.2" fill="#EF4444" />
                <path d="M130,120 L121,130 L125,132 Z" fill="#991B1B" />
                <path d="M130,120 L139,130 L135,132 Z" fill="#991B1B" />

                {/* Gold academic mascot shield/crest on the chest */}
                <g filter="url(#gold-glow)">
                  <polygon points="112,128 122,124 122,136 112,140" fill="url(#gold-crest)" />
                  <polygon points="122,124 132,128 132,140 122,136" fill="url(#gold-crest)" />
                  {/* Miniature black graduation cap on crest */}
                  <polygon points="122,128 125,130 122,132 119,130" fill="#000000" />
                </g>
              </g>
            </g>
          ) : (
            // ==========================================
            // HIGH-FIDELITY MASCULINE PIXAR CHARACTER (HOMBRE)
            // ==========================================
            <g>
              {/* Dark jeans cargo pants */}
              <g transform={`translate(${feetX}, 0)`}>
                <path d="M101,198 L122,198 L123,266 L100,266 Z" fill="url(#jeans-grad)" stroke="#1D4ED8" strokeWidth="1" />
                <path d="M136,198 L157,198 L158,266 L135,266 Z" fill="url(#jeans-grad)" stroke="#1D4ED8" strokeWidth="1" />
                {/* Cargo pockets */}
                <rect x="94" y="214" width="7" height="18" rx="2" fill="#1E3A8A" />
                <rect x="157" y="214" width="7" height="18" rx="2" fill="#1E3A8A" />
                {/* Belt chain decoration */}
                <path d="M148,198 Q155,206 153,214 Q151,222 147,218" stroke="#D1D5DB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>

              {/* Modern sporty sneakers */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Left Sneaker */}
                <path d="M96,260 C96,252 121,252 121,260 L122,284 L96,284 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="96" y="277" width="26" height="7" rx="2" fill="#FFFFFF" />
                {/* Laces */}
                <line x1="104" y1="264" x2="114" y2="264" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Right Sneaker */}
                <path d="M136,260 C136,252 161,252 161,260 L162,284 L136,284 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="136" y="277" width="26" height="7" rx="2" fill="#FFFFFF" />
                {/* Laces */}
                <line x1="144" y1="264" x2="154" y2="264" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>

              {/* Navy blue Varsity letterman jacket with white sleeves */}
              <g transform={`translate(${chestX}, 0)`}>
                <rect x="94" y="110" width="72" height="92" rx="14" fill="#1E3A8A" stroke="#172554" strokeWidth="1.5" />
                {/* White varsity sleeves */}
                <path d="M94,110 L104,110 L101,192 L94,192 Z" fill="#F3F4F6" />
                <path d="M156,110 L166,110 L166,192 L159,192 Z" fill="#F3F4F6" />
                {/* Metallic zipper */}
                <line x1="130" y1="110" x2="130" y2="202" stroke="#94A3B8" strokeWidth="3" />
                
                {/* Gold Academic varsity letter "L" */}
                <g filter="url(#gold-glow)">
                  <rect x="105" y="124" width="13" height="17" rx="2.5" fill="url(#gold-crest)" />
                  <text x="108" y="137" fill="#2E1C0C" fontSize="11" fontWeight="950" fontFamily="sans-serif">L</text>
                </g>
              </g>
            </g>
          )}

          {/* Underwear Skin Color Neck */}
          <path d="M120,95 L140,95 L135,116 L125,116 Z" fill={activeSkin.shadow} transform={`translate(${headX}, ${charYOffset})`} />

          {/* 6. HIGH-FIDELITY PIXAR / ANIME SHADED HEAD */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            {/* Round illustrated face */}
            <circle cx="130" cy="72" r="33" fill={activeSkin.base} />
            {/* Blushing cheeks */}
            {isFront && (
              <g>
                <circle cx="108" cy="81" r="6" fill="#F43F5E" opacity="0.35" />
                <circle cx="152" cy="81" r="6" fill="#F43F5E" opacity="0.35" />
              </g>
            )}
            {/* Ears */}
            <circle cx="95" cy="74" r="6.5" fill={activeSkin.shadow} />
            <circle cx="165" cy="74" r="6.5" fill={activeSkin.shadow} />
          </g>

          {/* 7. EXPRESSIVE PIXAR ANIME EYES & FACES */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              {c.face === "face-happy" && (
                <g>
                  {/* Left Pixar Eye */}
                  <ellipse cx="114" cy="72" rx="7.5" ry="11.5" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  <ellipse cx="114" cy="72" rx="6" ry="9" fill="url(#eye-pupil)" />
                  {/* Glossy double highlights */}
                  <circle cx="112" cy="68" r="3.2" fill="#FFFFFF" />
                  <circle cx="116.5" cy="76.5" r="1.5" fill="#FFFFFF" />

                  {/* Right Pixar Eye */}
                  <ellipse cx="146" cy="72" rx="7.5" ry="11.5" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  <ellipse cx="146" cy="72" rx="6" ry="9" fill="url(#eye-pupil)" />
                  {/* Glossy double highlights */}
                  <circle cx="144" cy="68" r="3.2" fill="#FFFFFF" />
                  <circle cx="148.5" cy="76.5" r="1.5" fill="#FFFFFF" />

                  {/* Sweet animated eyelashes */}
                  <path d="M104,66 Q112,62 118,65" stroke="#1A0F0A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <path d="M156,66 Q148,62 142,65" stroke="#1A0F0A" strokeWidth="2.2" fill="none" strokeLinecap="round" />

                  {/* Motivated thick brown brows */}
                  <path d="M105,58 Q115,53 121,57" stroke="#4C2411" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M155,58 Q145,53 139,57" stroke="#4C2411" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Small cute smile and tongue */}
                  <path d="M123,83 Q130,94 137,83 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="0.5" />
                  <path d="M125,83 Q130,87 135,83" fill="#FFFFFF" />
                </g>
              )}

              {c.face === "face-studying" && (
                <g>
                  {/* Concentrating squint eyes */}
                  <path d="M109,72 Q115,67 121,72" stroke="#1A0F0A" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M139,72 Q145,67 151,72" stroke="#1A0F0A" strokeWidth="3" fill="none" strokeLinecap="round" />

                  {/* Chic round reading glasses matching reference image */}
                  <circle cx="114" cy="73" r="13" stroke="#1E293B" strokeWidth="3" fill="none" />
                  <circle cx="146" cy="73" r="13" stroke="#1E293B" strokeWidth="3" fill="none" />
                  <line x1="127" y1="73" x2="133" y2="73" stroke="#1E293B" strokeWidth="3.2" />

                  <path d="M105,56 Q115,51 121,55" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M155,56 Q145,51 139,55" stroke="#4C2411" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Smiling lips */}
                  <path d="M125,91 Q130,96 135,91" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-excited" && (
                <g>
                  {/* Star eyes */}
                  <polygon points="114,60 117,67 124,67 119,71 121,78 114,74 107,78 109,71 104,67 111,67" fill="url(#gold-crest)" />
                  <polygon points="146,60 149,67 156,67 151,71 153,78 146,74 139,78 141,71 136,67 143,67" fill="url(#gold-crest)" />
                  
                  <path d="M105,54 Q115,49 121,53" stroke="#4C2411" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <path d="M155,54 Q145,49 139,53" stroke="#4C2411" strokeWidth="3.2" strokeLinecap="round" fill="none" />

                  {/* Gigantic open smile */}
                  <path d="M121,81 Q130,100 139,81 Z" fill="#991B1B" />
                  <path d="M124,82 Q130,86 136,82" fill="#FFFFFF" />
                </g>
              )}

              {c.face === "face-cool" && (
                <g>
                  {/* Sleek black sunglasses */}
                  <path d="M101,65 L127,65 L124,79 L104,79 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
                  <path d="M133,65 L159,65 L156,79 L136,79 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="126" y1="70" x2="134" y2="70" stroke="#0F172A" strokeWidth="3.5" />

                  {/* Confident smug mouth line */}
                  <path d="M124,88 Q133,89 137,84" stroke="#1A0F0A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.face === "face-wink" && (
                <g>
                  {/* Left Eye open */}
                  <ellipse cx="114" cy="72" rx="7" ry="11" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  <ellipse cx="114" cy="72" rx="5.5" ry="8.5" fill="url(#eye-pupil)" />
                  <circle cx="112" cy="68" r="2.8" fill="#FFFFFF" />

                  {/* Right Eye winking curve */}
                  <path d="M137,73 Q146,80 155,73" stroke="#1A0F0A" strokeWidth="3.5" fill="none" strokeLinecap="round" />

                  <path d="M105,58 Q115,53 121,57" stroke="#4C2411" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M155,54 Q145,51 139,55" stroke="#4C2411" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                  {/* Smirk mouth */}
                  <path d="M123,85 Q130,90 135,84" stroke="#1A0F0A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-curious" && (
                <g>
                  {/* Puzzled looking up eyes */}
                  <ellipse cx="114" cy="70" rx="7.5" ry="10" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  <circle cx="115" cy="66" r="5" fill="url(#eye-pupil)" />
                  <circle cx="113" cy="64" r="2.2" fill="#FFFFFF" />

                  <ellipse cx="146" cy="70" rx="7.5" ry="10" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
                  <circle cx="147" cy="66" r="5" fill="url(#eye-pupil)" />
                  <circle cx="145" cy="64" r="2.2" fill="#FFFFFF" />

                  {/* One brow raised, one lowered */}
                  <path d="M104,54 Q114,48 120,53" stroke="#4C2411" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M154,61 Q144,58 138,62" stroke="#4C2411" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Thinking mouth */}
                  <ellipse cx="130" cy="87" rx="3.5" ry="2.2" fill="#1A0F0A" />
                </g>
              )}
            </g>
          )}

          {/* 8. PREMIUM ILLUSTRATED HAIRSTYLES (Exquisite lock flows and gradients) */}
          <g>
            {/* Back hair rendering (drawn first so it falls behind shoulders) */}
            {isFront && (c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-curly" || (isGirl && c.hairStyle === "hair-short")) && (
              <g transform={`translate(${hairBackX}, ${charYOffset})`}>
                {/* Rich volumetric hair locks behind */}
                <path d="M96,72 C80,105 80,172 88,198 C95,208 106,204 104,178 C102,142 108,110 114,72 Z" fill="url(#hair-shine)" />
                <path d="M164,72 C180,105 180,172 172,198 C165,208 154,204 156,178 C158,142 152,110 146,72 Z" fill="url(#hair-shine)" />
                {/* Outer locks */}
                <path d="M86,85 Q68,140 76,192 C80,202 90,200 92,185 C94,150 98,110 102,85 Z" fill={activeHair.shadow} />
                <path d="M174,85 Q192,140 184,192 C180,202 170,200 168,185 C166,150 162,110 158,85 Z" fill={activeHair.shadow} />
              </g>
            )}

            {/* Front hair layers (cascading frame) */}
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {/* Hair Wavy (Default female locks framing face beautifully as reference mockup) */}
              {(c.hairStyle === "hair-wavy" || (isGirl && c.hairStyle === "hair-short")) && (
                <g>
                  {/* Main volumetric crown cap */}
                  <path d="M92,68 C92,30 168,30 168,68 C168,78 160,78 156,72 Q144,56 130,56 Q116,56 104,72 C100,78 92,78 92,68 Z" fill="url(#hair-shine)" />
                  {/* Thick swooping bangs */}
                  <path d="M99,56 Q130,46 158,66 Q142,46 118,52" fill={activeHair.highlight} opacity="0.95" />
                  
                  {/* Bouncy locks falling in front of chest */}
                  <path d="M92,66 Q74,106 88,146 Q98,175 92,204 Q84,168 82,130 Z" fill="url(#hair-shine)" />
                  <path d="M168,66 Q186,106 172,146 Q162,175 168,204 Q176,168 178,130 Z" fill="url(#hair-shine)" />

                  {/* Extra wave details */}
                  <path d="M84,102 Q94,142 88,172" stroke={activeHair.highlight} strokeWidth="2.2" fill="none" opacity="0.6" />
                  <path d="M176,102 Q166,142 172,172" stroke={activeHair.highlight} strokeWidth="2.2" fill="none" opacity="0.6" />
                </g>
              )}

              {/* Spiky Short Hair (Typical for male character base) */}
              {!isGirl && c.hairStyle === "hair-short" && (
                <g>
                  <path d="M94,70 C94,36 166,36 166,70 C166,82 156,82 153,78 C146,70 140,72 130,65 C120,72 114,70 107,78 C104,82 94,82 94,70 Z" fill="url(#hair-shine)" />
                  {/* Spiky details */}
                  <path d="M108,46 L118,34 L126,42 L138,32 L144,42 L155,36 L158,52" fill={activeHair.highlight} />
                  <path d="M96,66 L98,82 L105,78 Z" fill={activeHair.shadow} />
                  <path d="M164,66 L162,82 L155,78 Z" fill={activeHair.shadow} />
                </g>
              )}

              {/* Hair Long Style */}
              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M92,68 C92,32 168,32 168,68 C168,78 162,80 158,74 C148,64 142,66 130,60 C118,66 112,64 102,74 C98,80 92,78 92,68 Z" fill="url(#hair-shine)" />
                  {/* Straight vertical drop locks */}
                  <path d="M92,68 C84,100 86,158 96,186 C98,192 103,192 103,182 C100,148 103,114 105,68 Z" fill="url(#hair-shine)" />
                  <path d="M168,68 C176,100 174,158 164,186 C162,192 157,192 157,182 C160,148 157,114 155,68 Z" fill="url(#hair-shine)" />
                </g>
              )}

              {/* Hair Straight Style */}
              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M94,68 C94,36 166,36 166,68 C166,78 158,78 156,74 C146,64 140,66 130,60 C120,66 114,64 104,74 C102,78 94,78 94,68 Z" fill="url(#hair-shine)" />
                  {/* Straight side flaps */}
                  <rect x="94" y="66" width="10" height="66" rx="4.5" fill="url(#hair-shine)" />
                  <rect x="156" y="66" width="10" height="66" rx="4.5" fill="url(#hair-shine)" />
                </g>
              )}

              {/* Hair Afro Style */}
              {c.hairStyle === "hair-afro" && (
                <g>
                  {/* Massive volumetric circles layered together */}
                  <circle cx="130" cy="56" r="38" fill="url(#hair-shine)" />
                  <circle cx="106" cy="62" r="32" fill="url(#hair-shine)" />
                  <circle cx="154" cy="62" r="32" fill="url(#hair-shine)" />
                  <circle cx="110" cy="42" r="32" fill={activeHair.highlight} opacity="0.9" />
                  <circle cx="150" cy="42" r="32" fill={activeHair.highlight} opacity="0.9" />
                </g>
              )}

              {/* Hair Braids Style */}
              {c.hairStyle === "hair-braids" && (
                <g>
                  <path d="M92,68 C92,34 168,34 168,68 C168,78 160,78 156,74 Q144,58 130,58 Q116,58 104,74 C100,78 92,78 92,68 Z" fill="url(#hair-shine)" />
                  {/* Braided ropes falling down */}
                  <path d="M90,70 L86,180 Q84,188 92,188 L96,70 Z" fill="url(#hair-shine)" stroke={activeHair.shadow} strokeWidth="1" />
                  <path d="M170,70 L174,180 Q176,188 168,188 L164,70 Z" fill="url(#hair-shine)" stroke={activeHair.shadow} strokeWidth="1" />
                  {/* Red hair ties at the end */}
                  <circle cx="89" cy="178" r="3.5" fill="#EF4444" />
                  <circle cx="171" cy="178" r="3.5" fill="#EF4444" />
                </g>
              )}

              {/* Hair Pigtails Style */}
              {c.hairStyle === "hair-pigtails" && (
                <g>
                  <path d="M92,68 C92,34 168,34 168,68 C168,78 160,78 156,74 Q144,58 130,58 Q116,58 104,74 C100,78 92,78 92,68 Z" fill="url(#hair-shine)" />
                  {/* High twin side tails */}
                  <ellipse cx="78" cy="62" rx="14" ry="24" fill="url(#hair-shine)" transform="rotate(-25, 78, 62)" />
                  <ellipse cx="182" cy="62" rx="14" ry="24" fill="url(#hair-shine)" transform="rotate(25, 182, 62)" />
                  {/* Blue ties */}
                  <rect x="84" y="58" width="6" height="7" rx="1.5" fill="#0D6EFD" />
                  <rect x="170" y="58" width="6" height="7" rx="1.5" fill="#0D6EFD" />
                </g>
              )}

              {/* Highlight Overlays (Mechas) */}
              {activeHighlightHex && (
                <g opacity="0.9">
                  {(c.hairStyle === "hair-wavy" || (isGirl && c.hairStyle === "hair-short")) && (
                    <g>
                      <path d="M88,110 Q78,135 84,166" stroke={activeHighlightHex} strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M172,110 Q182,135 176,166" stroke={activeHighlightHex} strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M102,60 Q118,52 134,60" stroke={activeHighlightHex} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
                    </g>
                  )}
                  {!isGirl && c.hairStyle === "hair-short" && (
                    <g>
                      <path d="M118,34 L126,42 L138,32" stroke={activeHighlightHex} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M144,42 L155,36" stroke={activeHighlightHex} strokeWidth="3" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  {c.hairStyle === "hair-long" && (
                    <g>
                      <path d="M87,110 Q88,142 94,168" stroke={activeHighlightHex} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                      <path d="M173,110 Q172,142 166,168" stroke={activeHighlightHex} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )}
            </g>
          </g>

          {/* 9. HEADWEAR ACCESSORIES (Legendary Mortarboard or Knowledge Crown) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#char-shadow)">
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="24" ry="7.5" fill="#111827" />
                  <rect x="106" y="39" width="48" height="9" fill="#111827" />
                  <polygon points="130,30 168,40 130,50 92,40" fill="#1F2937" stroke="#111827" strokeWidth="1.5" />
                  <path d="M130,40 L158,45 L161,58" fill="none" stroke="url(#gold-crest)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="161" cy="60" r="2.8" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#gold-glow)">
                  <path d="M102,48 L104,26 L116,38 L130,18 L144,38 L156,26 L158,48 Z" fill="url(#gold-crest)" stroke="#78350F" strokeWidth="1" />
                  <circle cx="130" cy="34" r="3.2" fill="#EF4444" />
                  <circle cx="116" cy="42" r="2.2" fill="#3B82F6" />
                  <circle cx="144" cy="42" r="2.2" fill="#3B82F6" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && (
                <g>
                  {/* Reading glasses */}
                  <rect x="102" y="63" width="22" height="20" rx="5" stroke="#4B5563" strokeWidth="2.5" fill="none" />
                  <rect x="136" y="63" width="22" height="20" rx="5" stroke="#4B5563" strokeWidth="2.5" fill="none" />
                  <line x1="124" y1="71" x2="136" y2="71" stroke="#4B5563" strokeWidth="2.5" />
                </g>
              )}
            </g>
          )}

          {/* 10. HEADPHONES OVERLAY */}
          {c.accessory === "acc-headphones" && isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#char-shadow)">
              <rect x="88" y="60" width="10.5" height="28" rx="5.5" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="1" />
              <rect x="162" y="60" width="10.5" height="28" rx="5.5" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="1" />
              <path d="M94,62 C94,36 166,36 166,62" fill="none" stroke="#7C3AED" strokeWidth="4.5" />
            </g>
          )}

          {/* 11. REVERSED VIEW BACKPACK & HAIR REVERSE (when facing back) */}
          {!isFront && c.accessory.includes("backpack") && (
            <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#char-shadow)">
              {c.accessory === "acc-school-backpack" && (
                <g>
                  <rect x="92" y="106" width="76" height="82" rx="18" fill="#1E293B" stroke="#0F172A" strokeWidth="3.5" />
                  <rect x="102" y="128" width="56" height="46" rx="9" fill="#334155" />
                </g>
              )}
              {c.accessory === "acc-science-backpack" && (
                <g>
                  <rect x="94" y="102" width="72" height="86" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="3" />
                  <rect x="104" y="112" width="52" height="60" rx="8" fill="#10B981" />
                </g>
              )}
            </g>
          )}
        </g>
      </svg>

      {/* Circular floating menu buttons underneath the avatar, exactly as in mockup */}
      <div className="absolute bottom-16 inset-x-2 flex justify-center gap-3.5 z-20">
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(-20);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg hover:shadow-purple-500/10 active:scale-90 transition duration-150"
          title="Restablecer Pose"
        >
          👤
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(180);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg hover:shadow-purple-500/10 active:scale-90 transition duration-150"
          title="Ver de Espaldas"
        >
          👕
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
            setYaw((prev) => (prev + 90) % 360);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg hover:shadow-purple-500/10 active:scale-90 transition duration-150"
          title="Girar 90 Grados"
        >
          🕺
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(-20);
          }}
          className="size-8.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-sm text-white cursor-pointer shadow-lg hover:shadow-purple-500/10 active:scale-90 transition duration-150"
          title="Expresión Sonriente"
        >
          😊
        </button>
      </div>

      {/* Floating drag rotation instructions */}
      <span className="absolute top-3 right-4 text-[9px] font-bold tracking-wide text-purple-400 uppercase bg-slate-950/85 px-2 py-0.5 rounded-full border border-purple-500/20 shadow-sm animate-pulse">
        Arrastra para rotar
      </span>
    </div>
  );
}
