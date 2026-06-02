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

  // Skin colors with soft realistic shading
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
    "color-brown-light": { base: "#59311F", highlight: "#8E5136", shadow: "#3A1E11" }, 
    "color-brown-dark": { base: "#361D12", highlight: "#5E3827", shadow: "#200F07" },
    "color-blonde": { base: "#DDA14E", highlight: "#F7D496", shadow: "#A5732C" },
    "color-red": { base: "#B53829", highlight: "#E26B5C", shadow: "#801C11" },
    "color-gray": { base: "#7C858A", highlight: "#A6AFB4", shadow: "#525B60" },
    "color-white": { base: "#EBF1F5", highlight: "#FFFFFF", shadow: "#C8D3D9" },
    "color-fantasy-pink": { base: "#D63384", highlight: "#FF7CB2", shadow: "#9A1553" },
    "color-fantasy-blue": { base: "#0EA5E9", highlight: "#38BDF8", shadow: "#0369A1" },
    "color-fantasy-purple": { base: "#6F42C1", highlight: "#A370F7", shadow: "#4C2B88" },
  };
  const activeHair = hairColors[c.hairColor] || hairColors["color-brown-light"];

  // Highlights/Mechas matching active highlights
  const highlightColors: Record<string, string> = {
    "hl-black-blue": "#38BDF8",
    "hl-brown-red": "#EF4444",
    "hl-blonde-pink": "#F472B6",
    "hl-custom-neon": "#4ADE80",
  };
  const activeHighlightHex = highlightColors[c.hairHighlight] || "";

  // 360 degree rotation parallax calculations (to rotate the illustrated character organically)
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const isFront = cos >= 0;

  // Horizontal parallax translation offsets to simulate volumetric 3D depth on rotation
  const pxFac = sin; 
  const headX = pxFac * 8;
  const eyesX = pxFac * 11;
  const hairFrontX = pxFac * 7;
  const hairBackX = -pxFac * 4;
  const chestX = pxFac * 5;
  const armsX = pxFac * 3;
  const feetX = pxFac * 2;
  const backpackX = -pxFac * 8;

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
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          {/* Gradients for organic styling */}
          <linearGradient id="stage-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Skirt navy gradient */}
          <linearGradient id="skirt-checkers" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* Sudadera blanca premium */}
          <linearGradient id="white-hoodie" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Varsity sleeves (azul marino) */}
          <linearGradient id="sleeve-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Varsity jacket body (boy) */}
          <linearGradient id="jacket-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#172554" />
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

          {/* Stylized rounded realistic eyes */}
          <radialGradient id="eyes-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C0F07" />
            <stop offset="65%" stopColor="#3E2512" />
            <stop offset="100%" stopColor="#0B0502" />
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
            <stop offset="40%" stopColor={activeSkin.base} />
            <stop offset="100%" stopColor={activeSkin.glow} />
          </linearGradient>
          <linearGradient id="skin-shading-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={activeSkin.shadow} />
            <stop offset="40%" stopColor={activeSkin.base} />
            <stop offset="100%" stopColor={activeSkin.glow} />
          </linearGradient>

          {/* Blush gradient */}
          <radialGradient id="blush-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Concentric Glowing Neon Rings Stage (Hologram stage under feet) */}
        <g transform="translate(0, 8)">
          <ellipse cx="130" cy="306" rx="74" ry="18" fill="none" stroke="url(#stage-neon)" strokeWidth="3.5" filter="url(#glow-neon-stage)" opacity="0.8" />
          <ellipse cx="130" cy="306" rx="55" ry="13" fill="none" stroke="#EC4899" strokeWidth="1.8" filter="url(#glow-neon-stage)" opacity="0.5" />
          <ellipse cx="130" cy="306" rx="42" ry="10" fill="#000" opacity="0.35" />
        </g>

        {/* 2. Floating Aura Decals */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.65">
            <circle cx="130" cy="150" r="92" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="8,16" />
            <circle cx="130" cy="150" r="66" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,12" />
          </g>
        )}

        {c.aura === "aura-math" && (
          <g opacity="0.7">
            <text x="35" y="72" fill="#22D3EE" fontSize="12" fontFamily="monospace" fontWeight="900">π</text>
            <text x="215" y="85" fill="#22D3EE" fontSize="14" fontFamily="monospace" fontWeight="900">∑</text>
            <text x="32" y="195" fill="#0EA5E9" fontSize="10" fontFamily="monospace" fontWeight="800">E=mc²</text>
            <text x="210" y="200" fill="#0EA5E9" fontSize="10" fontFamily="monospace" fontWeight="800">√x</text>
          </g>
        )}

        {/* 3. Mascot Companion Pet Owl */}
        {c.pet === "pet-owl" && isFront && (
          <g transform={`translate(${160 + headX * 0.25}, ${66 + charYOffset})`} filter="url(#soft-shadow)">
            <rect x="0" y="0" width="24" height="28" rx="8" fill="#78350F" />
            <rect x="3" y="4" width="18" height="20" rx="6" fill="#F5F5F5" />
            <circle cx="8" cy="9" r="4" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="8" cy="9" r="1.8" fill="#000" />
            <circle cx="16" cy="9" r="4" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="16" cy="9" r="1.8" fill="#000" />
            <polygon points="12,11 9,14 15,14" fill="#D97706" />
            {/* Tiny cap */}
            <polygon points="12, -4 22, -1 12, 2 2, -1" fill="#1E293B" />
            <rect x="7" y="-2" width="10" height="2.5" fill="#0F172A" />
          </g>
        )}

        {/* 4. Academic Backpack (Behind in front view) */}
        {isFront && c.accessory.includes("backpack") && (
          <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
            {c.accessory === "acc-school-backpack" && (
              <g>
                <rect x="98" y="116" width="64" height="64" rx="14" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                <rect x="108" y="142" width="44" height="28" rx="6" fill="#334155" />
                <circle cx="130" cy="156" r="5" fill="url(#crest-gradient)" />
              </g>
            )}
            {c.accessory === "acc-science-backpack" && (
              <g>
                <rect x="98" y="112" width="64" height="66" rx="11" fill="#0F172A" stroke="#1E293B" strokeWidth="1.8" />
                <rect x="106" y="120" width="48" height="42" rx="5" fill="#10B981" opacity="0.9" />
              </g>
            )}
            {c.accessory === "acc-college-backpack" && (
              <g>
                <rect x="99" y="112" width="62" height="16" rx="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
                <rect x="102" y="128" width="56" height="16" rx="3" fill="#10B981" stroke="#047857" strokeWidth="1" />
                <rect x="98" y="144" width="64" height="16" rx="3" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
              </g>
            )}
          </g>
        )}

        {/* 5. GORGEOUS STYLIZED 3D STUDENT CHARACTERS */}
        <g filter="url(#soft-shadow)">
          {isGirl ? (
            // ==========================================
            // FEMALE CHARACTER - STYLIZED PROPORTIONS (1:5)
            // ==========================================
            <g>
              {/* Slender tapered legs */}
              <path d="M109,196 Q108,238 110,280 L118,280 Q118,238 117,196 Z" fill="url(#skin-shading-left)" />
              <path d="M143,196 Q142,238 142,280 L150,280 Q152,238 151,196 Z" fill="url(#skin-shading-right)" />
              
              {/* White socks ceñidas */}
              <path d="M109.5,225 L118.5,225 L118,280 L110,280 Z" fill="#FFFFFF" />
              <path d="M142.5,225 L151.5,225 L150,280 L142,280 Z" fill="#FFFFFF" />
              
              {/* Dark blue socks stripes (curved wrap around ankle) */}
              <path d="M109.5,230 C112,231 116,231 118.5,230" stroke="#1A3A73" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M142.5,230 C145,231 149,231 151.5,230" stroke="#1A3A73" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M109.5,235 C112,236 116,236 118.5,235" stroke="#1A3A73" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M142.5,235 C145,236 149,236 151.5,235" stroke="#1A3A73" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Slim sporty white-blue sneakers */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Left sneaker */}
                <path d="M103,275 C101,260 123,260 125,275 L126,288 C126,290 102,290 102,288 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <path d="M102,282 C108,283 118,282 126,279" stroke="#1D4ED8" strokeWidth="1.8" fill="none" />
                <path d="M102,284 L126,284 L126,289 L102,289 Z" fill="#1D4ED8" />

                {/* Right sneaker */}
                <path d="M135,275 C133,260 155,260 157,275 L158,288 C158,290 134,290 134,288 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <path d="M134,282 C140,283 150,282 158,279" stroke="#1D4ED8" strokeWidth="1.8" fill="none" />
                <path d="M134,284 L158,284 L158,289 L134,289 Z" fill="#1D4ED8" />
              </g>

              {/* Flared pleated navy school skirt with plaid lines */}
              <g transform={`translate(${chestX * 0.8}, 0)`}>
                <path d="M110,168 L150,168 L159,196 C130,200 130,200 101,196 Z" fill="url(#skirt-checkers)" stroke="#0F172A" strokeWidth="0.8" />
                
                {/* Pleat scallops at hem */}
                <path d="M101,196 Q110,198 120,196 Q130,198 140,196 Q150,198 159,196" stroke="#0F172A" strokeWidth="1" fill="none" />
                
                {/* Checkered lines */}
                <path d="M110,168 L106,196 M120,168 L118,196 M130,168 L130,196 M140,168 L142,196 M150,168 L154,196" stroke="url(#crest-gradient)" strokeWidth="1" opacity="0.6" />
                <path d="M107,178 Q130,180 153,178 M103,188 Q130,191 157,188" stroke="url(#crest-gradient)" strokeWidth="0.8" opacity="0.45" />
              </g>

              {/* White varsity hoodie with navy contrast sleeves & red neck ribbon */}
              <g transform={`translate(${chestX}, 0)`}>
                {/* Slim, tapered hoodie body (not wide box!) */}
                <path d="M98,112 C98,102 162,102 162,112 L148,168 C148,170 112,170 112,168 Z" fill="url(#white-hoodie)" stroke="#CBD5E1" strokeWidth="0.8" />
                
                {/* Side ribbing contrast lines */}
                <path d="M99,116 L105,114 L101,168 L99,168 Z" fill="#1A3A73" />
                <path d="M161,116 L155,114 L159,168 L161,168 Z" fill="#1A3A73" />
                <rect x="111" y="166" width="38" height="6" rx="2" fill="#1A3A73" />

                {/* Rounded slender tube sleeves */}
                <g transform={`translate(${-chestX + armsX}, 0)`}>
                  {/* Left Sleeve */}
                  <path d="M98,112 C88,126 86,146 90,164" stroke="url(#sleeve-blue)" strokeWidth="9" strokeLinecap="round" fill="none" />
                  {/* Right Sleeve */}
                  <path d="M162,112 C172,126 174,146 170,164" stroke="url(#sleeve-blue)" strokeWidth="9" strokeLinecap="round" fill="none" />
                  
                  {/* White cuffs */}
                  <circle cx="90" cy="164" r="5" fill="#FFFFFF" />
                  <circle cx="170" cy="164" r="5" fill="#FFFFFF" />

                  {/* Skin hands */}
                  <circle cx="90" cy="168" r="4.2" fill={activeSkin.base} />
                  <circle cx="170" cy="168" r="4.2" fill={activeSkin.base} />
                </g>

                {/* Drawstrings */}
                <path d="M123,118 Q121,142 119,145" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M137,118 Q139,142 141,145" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="119" cy="146" r="1.2" fill="#64748B" />
                <circle cx="141" cy="146" r="1.2" fill="#64748B" />

                {/* Shirt collar V-neck & Red bow ribbon */}
                <polygon points="130,110 122,115 138,115" fill="#FFFFFF" />
                <circle cx="130" cy="118" r="2.8" fill="#EF4444" />
                <path d="M130,118 L122,126 L126,128 Z" fill="#B91C1C" />
                <path d="M130,118 L138,126 L134,128 Z" fill="#B91C1C" />

                {/* Gold Crest */}
                <g filter="url(#gold-glow)">
                  <polygon points="113,126 121,122 121,133 113,137" fill="url(#crest-gradient)" />
                  <polygon points="121,122 129,126 129,137 121,133" fill="url(#crest-gradient)" />
                </g>
              </g>
            </g>
          ) : (
            // ==========================================
            // MASCULINE CHARACTER - STYLIZED PROPORTIONS (1:5)
            // ==========================================
            <g>
              {/* Denim cargo pants - slim and contoured */}
              <g transform={`translate(${feetX}, 0)`}>
                <path d="M108,170 Q106,220 108,278 L122,278 Q122,220 120,170 Z" fill="url(#denim-grad)" />
                <path d="M140,170 Q138,220 138,278 L152,278 Q154,220 152,170 Z" fill="url(#denim-grad)" />
                <rect x="98" y="206" width="6" height="14" rx="2" fill="#1E3A8A" />
                <rect x="156" y="206" width="6" height="14" rx="2" fill="#1E3A8A" />
              </g>

              {/* Sporty sneakers boy */}
              <g transform={`translate(${feetX}, 0)`}>
                <path d="M102,275 C100,260 122,260 124,275 L125,288 C125,290 101,290 101,288 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="101" y="283" width="24" height="5" rx="1.5" fill="#FFFFFF" />
                <path d="M136,275 C134,260 156,260 158,275 L159,288 C159,290 135,290 135,288 Z" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="135" y="283" width="24" height="5" rx="1.5" fill="#FFFFFF" />
              </g>

              {/* Slim varsity jacket boy */}
              <g transform={`translate(${chestX}, 0)`}>
                <path d="M96,110 C96,98 164,98 164,110 L150,170 C150,172 110,172 110,170 Z" fill="url(#jacket-blue)" stroke="#0F172A" strokeWidth="0.8" />
                <rect x="108" y="168" width="44" height="6" rx="2" fill="#1E3A8A" />

                {/* Varsity White Sleeves rounded */}
                <g transform={`translate(${-chestX + armsX}, 0)`}>
                  <path d="M97,110 C87,126 85,146 89,178" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <path d="M163,110 C173,126 175,146 171,178" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
                  
                  {/* Cuffs */}
                  <circle cx="89" cy="178" r="6" fill="#1E3A8A" />
                  <circle cx="171" cy="178" r="6" fill="#1E3A8A" />
                  
                  {/* Skin hands */}
                  <circle cx="89" cy="184" r="4.2" fill={activeSkin.base} />
                  <circle cx="171" cy="184" r="4.2" fill={activeSkin.base} />
                </g>

                {/* Letterman 'E' badge */}
                <g filter="url(#gold-glow)">
                  <rect x="104" y="122" width="12" height="15" rx="2" fill="url(#crest-gradient)" />
                  <text x="107" y="133" fill="#3A1E11" fontSize="9.5" fontWeight="950" fontFamily="sans-serif">E</text>
                </g>
              </g>
            </g>
          )}

          {/* Skin tone neck (connecting head and body) */}
          <path d="M125,96 L135,96 L134,110 L126,110 Z" fill={activeSkin.shadow} transform={`translate(${headX}, ${charYOffset})`} />

          {/* 6. ROUNDED STYLIZED STUDENT HEAD */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            {/* Tapered egg shape head (Proportioned to 42px x 46px - 20% size ratio) */}
            <path d="M109,72 C109,47 151,47 151,72 C151,91 142,98 130,98 C118,98 109,91 109,72 Z" fill={activeSkin.base} />
            
            {/* Ears */}
            <circle cx="106" cy="74" r="5" fill={activeSkin.shadow} />
            <circle cx="154" cy="74" r="5" fill={activeSkin.shadow} />

            {/* Rosy blush cheeks (Front view only) */}
            {isFront && (
              <g>
                <circle cx="116" cy="82" r="8" fill="url(#blush-radial)" />
                <circle cx="144" cy="82" r="8" fill="url(#blush-radial)" />
              </g>
            )}
          </g>

          {/* 7. EXPRESSIVE REALISTIC FACES (Not exaggerated anime) */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              {c.face === "face-happy" && (
                <g>
                  {/* Left Realistic Eye */}
                  <ellipse cx="116" cy="74" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="116" cy="74" r="4.5" fill="url(#eyes-pupil)" />
                  <circle cx="114.5" cy="71.5" r="1.5" fill="#FFFFFF" />

                  {/* Right Realistic Eye */}
                  <ellipse cx="144" cy="74" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="144" cy="74" r="4.5" fill="url(#eyes-pupil)" />
                  <circle cx="142.5" cy="71.5" r="1.5" fill="#FFFFFF" />

                  {/* Eyeliner strokes */}
                  <path d="M109,72 C113,69 119,69 123,72" stroke="#1A0F0A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path d="M137,72 C141,69 147,69 151,72" stroke="#1A0F0A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                  {/* Eyebrows */}
                  <path d="M110,63 C113,60 119,60 122,63" stroke="#4C2411" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M138,63 C141,60 147,60 150,63" stroke="#4C2411" strokeWidth="2" fill="none" strokeLinecap="round" />

                  {/* Sweet smart student smile */}
                  <path d="M126,84 C128,87 132,87 134,84" stroke="#B91C1C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-studying" && (
                <g>
                  {/* Focus reading eyes */}
                  <path d="M111,73 Q116,69 121,73" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M139,73 Q144,69 149,73" stroke="#1A0F0A" strokeWidth="2" fill="none" strokeLinecap="round" />

                  {/* Stylized rounded reading glasses */}
                  <circle cx="116" cy="73" r="10" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <circle cx="144" cy="73" r="10" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <line x1="126" y1="73" x2="134" y2="73" stroke="#1E293B" strokeWidth="2" />

                  <path d="M110,62 Q116,58 121,61" stroke="#4C2411" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M140,62 Q145,58 150,61" stroke="#4C2411" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  
                  <path d="M126,87 C128,89 132,89 134,87" stroke="#1A0F0A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-excited" && (
                <g>
                  {/* Big expressive happy student eyes */}
                  <ellipse cx="116" cy="74" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="116" cy="74" r="4.5" fill="url(#eyes-pupil)" />
                  <circle cx="114.5" cy="71.5" r="1.8" fill="#FFFFFF" />
                  <circle cx="117.5" cy="76.5" r="0.8" fill="#FFFFFF" />

                  <ellipse cx="144" cy="74" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="144" cy="74" r="4.5" fill="url(#eyes-pupil)" />
                  <circle cx="142.5" cy="71.5" r="1.8" fill="#FFFFFF" />
                  <circle cx="145.5" cy="76.5" r="0.8" fill="#FFFFFF" />
                  
                  <path d="M110,61 Q116,56 121,60" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M140,61 Q145,56 150,60" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                  <path d="M124,82 Q130,95 136,82 Z" fill="#B91C1C" />
                </g>
              )}

              {c.face === "face-cool" && (
                <g>
                  {/* Rounded cool sunglasses */}
                  <path d="M106,66 L124,66 L123,76 Q115,80 107,76 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
                  <path d="M136,66 L154,66 L153,76 Q145,80 137,76 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
                  <line x1="124" y1="70" x2="136" y2="70" stroke="#0F172A" strokeWidth="2.5" />

                  <path d="M125,85 Q131,86 135,82" stroke="#1A0F0A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.face === "face-wink" && (
                <g>
                  <ellipse cx="116" cy="74" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="116" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <circle cx="114.5" cy="71.5" r="1.5" fill="#FFFFFF" />

                  <path d="M138,75 Q144,80 150,75" stroke="#1A0F0A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                  <path d="M110,63 Q116,58 121,62" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M140,61 Q145,58 150,61" stroke="#4C2411" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                  <path d="M125,84 Q130,88 134,83" stroke="#1A0F0A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </g>
              )}

              {c.face === "face-curious" && (
                <g>
                  <ellipse cx="116" cy="73" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="116" cy="70" r="3.5" fill="url(#eyes-pupil)" />
                  
                  <ellipse cx="144" cy="73" rx="5.5" ry="7.5" fill="#FFFFFF" />
                  <circle cx="144" cy="70" r="3.5" fill="url(#eyes-pupil)" />

                  <path d="M109,56 Q116,51 121,55" stroke="#4C2411" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M140,61 Q135,58 131,61" stroke="#4C2411" strokeWidth="2" strokeLinecap="round" fill="none" />

                  <ellipse cx="130" cy="85" rx="2.5" ry="1.5" fill="#1A0F0A" />
                </g>
              )}
            </g>
          )}

          {/* 8. HAIRSTYLES - FLOWING REARWARDS (Does not cover the body) */}
          <g>
            {/* Layer 1: Back Hair (Drawn in background to flow behind shoulders) */}
            {isFront && (c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-curly" || (isGirl && c.hairStyle === "hair-short")) && (
              <g transform={`translate(${hairBackX}, ${charYOffset})`}>
                <path d="M109,56 C94,92 90,140 100,190 C108,200 114,195 112,160 C110,130 114,92 130,92 C146,92 150,130 148,160 C146,195 152,200 160,190 C170,140 166,92 151,56 Z" fill="url(#hair-organic-shine)" />
                
                {/* Highlights mechas details (Rosa/Rojo) */}
                {activeHighlightHex && (
                  <g opacity="0.8">
                    <path d="M96,150 Q102,176 99,190 Q93,168 93,150 Z" fill={activeHighlightHex} />
                    <path d="M164,150 Q158,176 161,190 Q167,168 167,150 Z" fill={activeHighlightHex} />
                  </g>
                )}
              </g>
            )}

            {/* Layer 2: Front Bangs & Side Frame locks (Drawn in front of ears, but very neat and thin) */}
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {/* Hair Wavy (Default student locks framing forehead beautifully) */}
              {(c.hairStyle === "hair-wavy" || (isGirl && c.hairStyle === "hair-short")) && (
                <g>
                  {/* Top crown cap */}
                  <path d="M109,56 C109,24 151,24 151,56 C151,64 145,64 141,60 C132,48 128,48 119,60 C115,64 109,64 109,56 Z" fill="url(#hair-organic-shine)" />
                  {/* Bangs swoop */}
                  <path d="M109,56 C120,48 140,48 151,56 C144,52 136,52 130,55 C124,52 116,52 109,56 Z" fill={activeHair.highlight} opacity="0.9" />
                  
                  {/* Very thin side temple frame locks (leaving the rest behind shoulders!) */}
                  <path d="M109,56 C105,70 106,85 109,92 C111,85 110,70 110,56 Z" fill="url(#hair-organic-shine)" />
                  <path d="M151,56 C155,70 154,85 151,92 C149,85 150,70 150,56 Z" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Spiky Short Hair */}
              {!isGirl && c.hairStyle === "hair-short" && (
                <g>
                  <path d="M109,56 C109,28 151,28 151,56 C151,62 145,62 141,58 C132,48 128,48 119,58 C115,62 109,62 109,56 Z" fill="url(#hair-organic-shine)" />
                  {/* Volumetric Crest spikes */}
                  <path d="M114,42 L124,28 L130,36 L138,26 L144,36 L150,42 Z" fill={activeHair.highlight} />
                </g>
              )}

              {/* Hair Long Style */}
              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M109,56 C109,26 151,26 151,56 C151,64 145,64 141,60 C132,48 128,48 119,60 C115,64 109,64 109,56 Z" fill="url(#hair-organic-shine)" />
                  {/* Side locks */}
                  <path d="M109,56 C105,72 107,88 109,102 C111,88 110,72 110,56 Z" fill="url(#hair-organic-shine)" />
                  <path d="M151,56 C155,72 153,88 151,102 C149,88 150,72 150,56 Z" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Hair Straight Style */}
              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M109,56 C109,26 151,26 151,56 C151,64 145,64 141,60 C132,48 128,48 119,60 C115,64 109,64 109,56 Z" fill="url(#hair-organic-shine)" />
                  <rect x="106" y="56" width="6" height="42" rx="2.5" fill="url(#hair-organic-shine)" />
                  <rect x="148" y="56" width="6" height="42" rx="2.5" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Hair Afro Style */}
              {c.hairStyle === "hair-afro" && (
                <g>
                  <circle cx="130" cy="52" r="28" fill="url(#hair-organic-shine)" />
                  <circle cx="110" cy="58" r="22" fill="url(#hair-organic-shine)" />
                  <circle cx="150" cy="58" r="22" fill="url(#hair-organic-shine)" />
                </g>
              )}

              {/* Hair Braids Style */}
              {c.hairStyle === "hair-braids" && (
                <g>
                  <path d="M109,56 C109,26 151,26 151,56 C151,64 145,64 141,60 C132,48 128,48 119,60 C115,64 109,64 109,56 Z" fill="url(#hair-organic-shine)" />
                  <path d="M108,56 L105,124 Q103,130 109,130 L112,56 Z" fill="url(#hair-organic-shine)" stroke={activeHair.shadow} strokeWidth="0.8" />
                  <path d="M152,56 L155,124 Q157,130 151,130 L148,56 Z" fill="url(#hair-organic-shine)" stroke={activeHair.shadow} strokeWidth="0.8" />
                </g>
              )}

              {/* Hair Pigtails Style */}
              {c.hairStyle === "hair-pigtails" && (
                <g>
                  <path d="M109,56 C109,26 151,26 151,56 C151,64 145,64 141,60 C132,48 128,48 119,60 C115,64 109,64 109,56 Z" fill="url(#hair-organic-shine)" />
                  <ellipse cx="94" cy="54" rx="10" ry="16" fill="url(#hair-organic-shine)" transform="rotate(-15, 94, 54)" />
                  <ellipse cx="166" cy="54" rx="10" ry="16" fill="url(#hair-organic-shine)" transform="rotate(15, 166, 54)" />
                </g>
              )}
            </g>
          </g>

          {/* 9. HEADWEAR ACCESSORIES */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="18" ry="6" fill="#111827" />
                  <rect x="112" y="39" width="36" height="8" fill="#111827" />
                  <polygon points="130,30 162,39 130,48 98,39" fill="#1F2937" stroke="#111827" strokeWidth="1" />
                  <path d="M130,39 L156,43 L159,52" fill="none" stroke="url(#crest-gradient)" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="159" cy="54" r="2" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#gold-glow)">
                  <path d="M110,48 L112,30 L121,39 L130,22 L139,39 L148,30 L150,48 Z" fill="url(#crest-gradient)" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="130" cy="34" r="2.5" fill="#EF4444" />
                </g>
              )}

              {c.accessory === "acc-nerd-glasses" && (
                <g>
                  <circle cx="116" cy="73" r="9" stroke="#4B5563" strokeWidth="2" fill="none" />
                  <circle cx="144" cy="73" r="9" stroke="#4B5563" strokeWidth="2" fill="none" />
                  <line x1="125" y1="73" x2="135" y2="73" stroke="#4B5563" strokeWidth="2" />
                </g>
              )}
            </g>
          )}

          {/* 10. HEADPHONES OVERLAY */}
          {c.accessory === "acc-headphones" && isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              <rect x="100" y="60" width="8" height="22" rx="4" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="0.8" />
              <rect x="152" y="60" width="8" height="22" rx="4" fill="#8B5CF6" stroke="#4C1D95" strokeWidth="0.8" />
              <path d="M104,62 C104,38 156,38 156,62" fill="none" stroke="#7C3AED" strokeWidth="3" />
            </g>
          )}

          {/* 11. REVERSED VIEW BACKPACK & HAIR REVERSE */}
          {!isFront && (
            <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {/* Overwrite Back of head / hair fully so no faces bleed */}
              <path d="M109,56 C94,92 90,140 100,190 C108,200 114,195 112,160 C110,130 114,92 130,92 C146,92 150,130 148,160 C146,195 152,200 160,190 C170,140 166,92 151,56 Z" fill="url(#hair-organic-shine)" transform={`translate(${headX - backpackX}, 0)`} />
              
              {c.accessory.includes("backpack") && (
                <g>
                  {c.accessory === "acc-school-backpack" && (
                    <g>
                      <rect x="98" y="112" width="64" height="66" rx="14" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                      <rect x="106" y="130" width="48" height="34" rx="6" fill="#334155" />
                    </g>
                  )}
                  {c.accessory === "acc-science-backpack" && (
                    <g>
                      <rect x="98" y="110" width="64" height="68" rx="10" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                      <rect x="104" y="116" width="52" height="44" rx="4" fill="#10B981" />
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
