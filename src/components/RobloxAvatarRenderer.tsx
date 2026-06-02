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
      setYaw((prev) => (prev + 1.2) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Skin colors with soft realistic 3D shading
  const skinColors: Record<string, { base: string; shadow: string; glow: string; gradId: string }> = {
    "skin-light-1": { base: "#FFF1EB", shadow: "#E2BCAE", glow: "#FFEBE3", gradId: "skin-1-grad" },
    "skin-light-2": { base: "#FCDAB7", shadow: "#D59D72", glow: "#FEEAD4", gradId: "skin-2-grad" },
    "skin-medium-1": { base: "#EAAD80", shadow: "#B27850", glow: "#F5CEB3", gradId: "skin-3-grad" },
    "skin-medium-2": { base: "#C68759", shadow: "#91562F", glow: "#DFB393", gradId: "skin-4-grad" },
    "skin-dark-1": { base: "#7D4E2D", shadow: "#4D2C17", glow: "#A37655", gradId: "skin-5-grad" },
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

  // Horizontal parallax translation offsets
  const pxFac = sin; 
  const headX = pxFac * 8;
  const eyesX = pxFac * 11;
  const hairFrontX = pxFac * 7;
  const hairBackX = -pxFac * 5;
  const chestX = pxFac * 5;
  const armsX = pxFac * 3.5;
  const feetX = pxFac * 2;
  const backpackX = -pxFac * 9;

  const charYOffset = 18;
  const hairGradId = `hair-grad-${activeHair.key}`;

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
          {/* Glowing stage stage */}
          <filter id="glow-neon-stage" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
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
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          {/* Neon stage gradient */}
          <linearGradient id="stage-neon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Skirt navy checkers */}
          <linearGradient id="skirt-checkers" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* White hoodie white-cream */}
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
          <linearGradient id={hairGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeHair.highlight} />
            <stop offset="50%" stopColor={activeHair.base} />
            <stop offset="100%" stopColor={activeHair.shadow} />
          </linearGradient>

          {/* Stylized rounded realistic eyes */}
          <radialGradient id="eyes-pupil" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8E5136" />
            <stop offset="65%" stopColor="#59311F" />
            <stop offset="100%" stopColor="#1C0F07" />
          </radialGradient>

          {/* Dark denim pants */}
          <linearGradient id="denim-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A75B4" />
            <stop offset="55%" stopColor="#2D4D7F" />
            <stop offset="100%" stopColor="#192A47" />
          </linearGradient>

          {/* Skin Tone 3D Gradients */}
          <linearGradient id="skin-1-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF5F0" />
            <stop offset="60%" stopColor="#FFE4D9" />
            <stop offset="100%" stopColor="#E8C1B3" />
          </linearGradient>
          <linearGradient id="skin-2-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF0E0" />
            <stop offset="60%" stopColor="#FAD5B4" />
            <stop offset="100%" stopColor="#DFA279" />
          </linearGradient>
          <linearGradient id="skin-3-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5D3B8" />
            <stop offset="60%" stopColor="#E3A376" />
            <stop offset="100%" stopColor="#B87247" />
          </linearGradient>
          <linearGradient id="skin-4-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DBA279" />
            <stop offset="60%" stopColor="#BE7B50" />
            <stop offset="100%" stopColor="#8E4C24" />
          </linearGradient>
          <linearGradient id="skin-5-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A6543" />
            <stop offset="60%" stopColor="#774324" />
            <stop offset="100%" stopColor="#4E2711" />
          </linearGradient>

          {/* Blush gradient */}
          <radialGradient id="blush-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric stage */}
        <g transform="translate(0, 8)">
          <ellipse cx="130" cy="306" rx="74" ry="18" fill="none" stroke="url(#stage-neon)" strokeWidth="3.5" filter="url(#glow-neon-stage)" opacity="0.8" />
          <ellipse cx="130" cy="306" rx="55" ry="13" fill="none" stroke="#EC4899" strokeWidth="1.8" filter="url(#glow-neon-stage)" opacity="0.5" />
          <ellipse cx="130" cy="306" rx="42" ry="10" fill="#000" opacity="0.35" />
        </g>

        {/* Aura */}
        {c.aura === "aura-golden" && (
          <g filter="url(#gold-glow)" opacity="0.65">
            <circle cx="130" cy="150" r="92" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="8,16" />
            <circle cx="130" cy="150" r="66" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,12" />
          </g>
        )}
        {c.aura === "aura-math" && (
          <g filter="url(#glow-neon)" opacity="0.55" stroke="#22D3EE" strokeWidth="1" fill="none" className="font-mono text-[8px] font-bold">
            <circle cx="130" cy="150" r="85" strokeDasharray="4,12" />
            <text x="60" y="90" fill="#22D3EE">E = mc²</text>
            <text x="175" y="105" fill="#22D3EE">π ≈ 3.14</text>
            <text x="50" y="210" fill="#22D3EE">x² + y² = r²</text>
            <text x="170" y="220" fill="#22D3EE">∫ f(x)dx</text>
          </g>
        )}

        {/* BACK HAIR (Layered correctly behind body in front view) */}
        {isFront && (
          <g transform={`translate(${hairBackX}, ${charYOffset})`}>
            {c.hairStyle === "hair-wavy" && (
              <g>
                <path d="M102,72 C84,95 72,130 76,195 C80,215 96,210 94,180 C92,145 106,104 130,104 C154,104 168,145 166,180 C164,210 180,215 184,195 C188,130 176,95 158,72 Z" fill={`url(#${hairGradId})`} />
                {activeHighlightHex !== "transparent" && (
                  <g opacity="0.75">
                    <path d="M80,120 Q68,160 84,190" stroke={activeHighlightHex} strokeWidth="3" fill="none" />
                    <path d="M180,120 Q192,160 176,190" stroke={activeHighlightHex} strokeWidth="3" fill="none" />
                  </g>
                )}
              </g>
            )}

            {c.hairStyle === "hair-long" && (
              <g>
                <path d="M102,72 C80,105 76,160 80,225 C84,235 98,230 96,200 C94,150 106,104 130,104 C154,104 166,150 164,200 C162,230 176,235 180,225 C184,160 180,105 158,72 Z" fill={`url(#${hairGradId})`} />
                {activeHighlightHex !== "transparent" && (
                  <g opacity="0.75">
                    <path d="M82,110 C78,140 82,180 88,210" stroke={activeHighlightHex} strokeWidth="2.8" fill="none" />
                    <path d="M178,110 C182,140 178,180 172,210" stroke={activeHighlightHex} strokeWidth="2.8" fill="none" />
                  </g>
                )}
              </g>
            )}

            {c.hairStyle === "hair-straight" && (
              <g>
                <path d="M102,72 C86,105 84,160 84,215 C84,222 94,222 96,215 C96,150 106,104 130,104 C154,104 164,150 164,215 C166,222 176,222 176,215 C176,160 174,105 158,72 Z" fill={`url(#${hairGradId})`} />
              </g>
            )}

            {c.hairStyle === "hair-curly" && (
              <g>
                <path d="M102,72 C80,95 68,130 72,185 C76,195 90,195 88,175 C86,145 106,104 130,104 C154,104 174,145 172,175 C170,195 184,195 188,185 C192,130 180,95 158,72 Z" fill={`url(#${hairGradId})`} />
              </g>
            )}

            {c.hairStyle === "hair-braids" && (
              <g>
                <path d="M106,70 L98,82 L106,94 L102,106 L108,118 L102,130 L108,142 L102,154 L106,166 L100,175 Q98,180 104,180 L108,172 L108,70 Z" fill={`url(#${hairGradId})`} stroke={activeHair.shadow} strokeWidth="0.8" />
                <circle cx="102" cy="180" r="3.5" fill="#EF4444" />
                <path d="M154,70 L162,82 L154,94 L158,106 L152,118 L158,130 L152,142 L158,154 L154,166 L160,175 Q162,180 156,180 L152,172 L152,70 Z" fill={`url(#${hairGradId})`} stroke={activeHair.shadow} strokeWidth="0.8" />
                <circle cx="158" cy="180" r="3.5" fill="#EF4444" />
              </g>
            )}

            {c.hairStyle === "hair-pigtails" && (
              <g>
                <ellipse cx="86" cy="62" rx="14" ry="24" fill={`url(#${hairGradId})`} transform="rotate(-30, 86, 62)" />
                <circle cx="95" cy="54" r="3.5" fill="#EF4444" />
                <ellipse cx="174" cy="62" rx="14" ry="24" fill={`url(#${hairGradId})`} transform="rotate(30, 174, 62)" />
                <circle cx="165" cy="54" r="3.5" fill="#EF4444" />
              </g>
            )}
          </g>
        )}

        {/* Mascot Pet */}
        {c.pet === "pet-owl" && isFront && (
          <g transform={`translate(${164 + headX * 0.25}, ${66 + charYOffset})`} filter="url(#soft-shadow)">
            <rect x="0" y="0" width="24" height="28" rx="8" fill="#78350F" />
            <rect x="3" y="4" width="18" height="20" rx="6" fill="#F5F5F5" />
            <circle cx="8" cy="9" r="4" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="8" cy="9" r="1.8" fill="#000" />
            <circle cx="16" cy="9" r="4" fill="#FDE047" stroke="#3E2723" strokeWidth="0.8" />
            <circle cx="16" cy="9" r="1.8" fill="#000" />
            <polygon points="12,11 9,14 15,14" fill="#D97706" />
            {/* Tiny graduation hat for pet owl */}
            <polygon points="12,-4 22,-1 12,2 2,-1" fill="#1E293B" />
            <rect x="10" y="0" width="4" height="4" fill="#1E293B" />
          </g>
        )}

        {/* Backpack behind torso */}
        {isFront && c.accessory.includes("backpack") && (
          <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
            {c.accessory === "acc-school-backpack" && (
              <g>
                <rect x="97" y="112" width="66" height="66" rx="16" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                <rect x="107" y="132" width="46" height="36" rx="8" fill="#B91C1C" />
                <path d="M110,112 L110,126 M150,112 L150,126" stroke="#475569" strokeWidth="5" />
              </g>
            )}
            {c.accessory === "acc-science-backpack" && (
              <g>
                <rect x="97" y="110" width="66" height="68" rx="10" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                <rect x="103" y="116" width="54" height="46" rx="5" fill="#10B981" />
                {/* Glowing cyan tubes */}
                <rect x="110" y="122" width="8" height="30" rx="2" fill="#06B6D4" filter="url(#glow-neon)" />
                <rect x="142" y="122" width="8" height="30" rx="2" fill="#06B6D4" filter="url(#glow-neon)" />
              </g>
            )}
            {c.accessory === "acc-college-backpack" && (
              <g>
                {/* Stack of leather bound books */}
                <rect x="99" y="112" width="62" height="18" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1" />
                <rect x="101" y="115" width="58" height="12" fill="#FEF3C7" />
                <rect x="97" y="130" width="66" height="18" rx="3" fill="#1E3A8A" stroke="#172554" strokeWidth="1" />
                <rect x="99" y="133" width="62" height="12" fill="#FEF3C7" />
                <rect x="95" y="148" width="70" height="20" rx="3" fill="#065F46" stroke="#064E3B" strokeWidth="1" />
                <rect x="97" y="151" width="66" height="14" fill="#FEF3C7" />
              </g>
            )}
          </g>
        )}

        {/* CHARACTER BODY (Legs, Torso, Arms - Perfectly proportioned in 1:5 ratio) */}
        <g filter="url(#soft-shadow)">
          {isGirl ? (
            // ==========================================
            // FEMALE CHARACTER - STYLIZED PROPORTIONS (MUJER)
            // ==========================================
            <g>
              {/* Slender tapered legs (not pillars!) */}
              <g transform={`translate(${feetX}, 0)`}>
                {/* Thighs narrow down to knees at 240, then expand slightly at calves, narrowing at ankles 278 */}
                <path d="M116,203 Q114,240 117,278 L124,278 Q123,240 122,203 Z" fill={`url(#${activeSkin.gradId})`} />
                <path d="M138,203 Q137,240 136,278 L143,278 Q146,240 144,203 Z" fill={`url(#${activeSkin.gradId})`} />
                
                {/* White socks wrap legs */}
                <path d="M116.5,232 C116.5,232 119.5,233.5 122.5,232 L124,278 L117,278 Z" fill="#FFFFFF" />
                <path d="M116.5,232 C116.5,232 119.5,233.5 122.5,232" stroke="#CBD5E1" strokeWidth="1" fill="none" />
                <path d="M116.6,236 Q119.5,237.5 122.3,236" stroke="#1B2E53" strokeWidth="1.5" fill="none" />
                <path d="M116.7,240 Q119.5,241.5 122.2,240" stroke="#1B2E53" strokeWidth="1.5" fill="none" />

                <path d="M137.5,232 C137.5,232 140.5,233.5 143.5,232 L143,278 L136,278 Z" fill="#FFFFFF" />
                <path d="M137.5,232 C137.5,232 140.5,233.5 143.5,232" stroke="#CBD5E1" strokeWidth="1" fill="none" />
                <path d="M137.7,236 Q140.5,237.5 143.3,236" stroke="#1B2E53" strokeWidth="1.5" fill="none" />
                <path d="M137.6,240 Q140.5,241.5 143.2,240" stroke="#1B2E53" strokeWidth="1.5" fill="none" />

                {/* Sneaker footwear */}
                {c.shoes === "shoes-basic-shoes" && (
                  <g>
                    {/* Left sneaker */}
                    <path d="M114,275 C110,270 125,268 127,275 L128,288 C128,291 113,291 113,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                    <path d="M113.5,282 Q121,283 127.5,279" stroke="#3B82F6" strokeWidth="2" fill="none" />
                    <path d="M113,286 L128,286 L128,290 L113,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
                    <line x1="118" y1="271" x2="123" y2="271" stroke="#3B82F6" strokeWidth="1.2" />
                    <line x1="119" y1="274" x2="122" y2="274" stroke="#3B82F6" strokeWidth="1.2" />

                    {/* Right sneaker */}
                    <path d="M133,275 C131,268 146,270 142,275 L143,288 C143,291 128,291 128,288 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                    <path d="M128.5,279 Q135,283 142.5,282" stroke="#3B82F6" strokeWidth="2" fill="none" />
                    <path d="M128,286 L143,286 L143,290 L128,290 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.8" />
                    <line x1="133" y1="271" x2="138" y2="271" stroke="#3B82F6" strokeWidth="1.2" />
                    <line x1="134" y1="274" x2="137" y2="274" stroke="#3B82F6" strokeWidth="1.2" />
                  </g>
                )}
                {c.shoes === "shoes-academic-shoes" && (
                  <g>
                    {/* Mahogany leather loafers */}
                    <path d="M113,274 C110,270 126,268 127,274 L128,288 C128,291 113,291 113,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
                    <circle cx="120" cy="275" r="2.2" fill="#FBBF24" />
                    <path d="M133,274 C131,268 147,270 144,274 L144,288 C144,291 129,291 129,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
                    <circle cx="137" cy="275" r="2.2" fill="#FBBF24" />
                  </g>
                )}
              </g>

              {/* Skirt option (flared school pleated skirt) */}
              {c.pants === "pants-basic-skirt" && (
                <g transform={`translate(${chestX * 0.8}, 0)`}>
                  {/* Detailed 3D pleats with alternate shading */}
                  <path d="M114,170 L121,170 L115,203 L106,201 Z" fill="url(#navy-fabric-grad)" />
                  <path d="M121,170 L128,170 L125,204 L115,203 Z" fill="url(#navy-fabric-grad)" />
                  <path d="M128,170 L135,170 L134,204 L125,204 Z" fill="url(#navy-fabric-grad)" />
                  <path d="M135,170 L142,170 L144,204 L134,204 Z" fill="url(#navy-fabric-grad)" />
                  <path d="M142,170 L149,170 L153,203 L144,204 Z" fill="url(#navy-fabric-grad)" />
                  <path d="M149,170 L156,170 L163,201 L153,203 Z" fill="url(#navy-fabric-grad)" />

                  {/* Plaid gold lines bending with pleats */}
                  <path d="M109,176 Q130,179 151,176" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" fill="none" />
                  <path d="M105,188 Q130,191 155,188" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" fill="none" />
                  <path d="M102,197 Q130,200 158,197" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" fill="none" />
                  <path d="M114,170 L107,201 M121,170 L116,203 M128,170 L125,204 M135,170 L134,204 M142,170 L144,204 M149,170 L153,203 M156,170 L162,201" stroke="#FBBF24" strokeWidth="1.0" opacity="0.7" fill="none" />
                </g>
              )}

              {/* Jeans option (also for girls) */}
              {c.pants === "pants-basic-jeans" && (
                <g transform={`translate(${feetX}, 0)`}>
                  <path d="M112,170 Q106,220 108,278 L124,278 Q124,220 122,170 Z" fill="url(#denim-pants-grad)" />
                  <path d="M138,170 Q136,220 136,278 L152,278 Q154,220 148,170 Z" fill="url(#denim-pants-grad)" />
                  <path d="M112,170 L112,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                  <path d="M148,170 L148,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                  <rect x="99" y="206" width="8" height="15" rx="1.5" fill="#1E3A8A" filter="url(#soft-shadow)" />
                  <rect x="153" y="206" width="8" height="15" rx="1.5" fill="#1E3A8A" filter="url(#soft-shadow)" />
                </g>
              )}

              {/* Female Varsity Hoodie / Shirt */}
              {c.outfit === "" && (c.shirt === "shirt-basic-hoodie" || c.shirt === "shirt-basic-tee" || c.shirt === "shirt-academic-jacket" || c.shirt === "shirt-lab-coat") && (
                <g transform={`translate(${chestX}, 0)`}>
                  {/* Tapered body */}
                  <path d="M96,112 C96,98 164,98 164,112 L146,170 C146,172 114,172 114,170 Z" fill="url(#white-hoodie)" stroke="#CBD5E1" strokeWidth="0.8" />
                  
                  {/* Collar neck opening */}
                  <path d="M120,112 L140,112 L130,126 Z" fill={`url(#${activeSkin.gradId})`} />
                  <path d="M120,112 L124,124 L130,126 L136,124 L140,112 Z" fill="#FFFFFF" />
                  
                  {/* Red school ribbon tie */}
                  <circle cx="130" cy="123" r="2.8" fill="#EF4444" />
                  <path d="M130,123 L121,131 L125,133 Z" fill="#B91C1C" />
                  <path d="M130,123 L139,131 L135,133 Z" fill="#B91C1C" />

                  {/* Drawstrings */}
                  <path d="M123,116 Q121,138 118,142" stroke="#94A3B8" strokeWidth="1.8" fill="none" />
                  <rect x="116.5" y="142" width="3" height="3.5" rx="0.8" fill="#94A3B8" />
                  <path d="M137,116 Q139,138 142,142" stroke="#94A3B8" strokeWidth="1.8" fill="none" />
                  <rect x="140.5" y="142" width="3" height="3.5" rx="0.8" fill="#94A3B8" />

                  {/* Sleek rounded tube sleeves (contrasting navy) */}
                  <g transform={`translate(${-chestX + armsX}, 0)`}>
                    <path d="M96,112 C88,124 84,142 88,162" stroke="url(#navy-fabric-grad)" strokeWidth="10.2" strokeLinecap="round" fill="none" />
                    <path d="M164,112 C172,124 176,142 172,162" stroke="url(#navy-fabric-grad)" strokeWidth="10.2" strokeLinecap="round" fill="none" />
                    
                    {/* Cuffs */}
                    <circle cx="88" cy="162" r="5.5" fill="#FFFFFF" />
                    <circle cx="172" cy="162" r="5.5" fill="#FFFFFF" />

                    {/* Skin hands */}
                    <circle cx="86" cy="166" r="4.2" fill={`url(#${activeSkin.gradId})`} />
                    <circle cx="174" cy="166" r="4.2" fill={`url(#${activeSkin.gradId})`} />
                  </g>

                  {/* Gold crest */}
                  <g filter="url(#gold-glow)">
                    <polygon points="112,126 118,122 118,133 112,137" fill="url(#crest-gradient)" />
                    <polygon points="118,122 124,126 124,137 118,133" fill="url(#crest-gradient)" />
                  </g>
                </g>
              )}
            </g>
          ) : (
            // ==========================================
            // MASCULINE CHARACTER - STYLIZED PROPORTIONS (HOMBRE)
            // ==========================================
            <g>
              {/* Contoured Denim Jeans */}
              <g transform={`translate(${feetX}, 0)`}>
                <path d="M112,170 Q106,220 108,278 L124,278 Q124,220 122,170 Z" fill="url(#denim-pants-grad)" />
                <path d="M138,170 Q136,220 136,278 L152,278 Q154,220 148,170 Z" fill="url(#denim-pants-grad)" />
                {/* Stitch lines */}
                <path d="M112,170 L112,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                <path d="M148,170 L148,278" stroke="#F97316" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.6" />
                {/* Cargo pockets */}
                <rect x="99" y="206" width="8" height="15" rx="1.5" fill="#1D4ED8" filter="url(#soft-shadow)" />
                <rect x="153" y="206" width="8" height="15" rx="1.5" fill="#1D4ED8" filter="url(#soft-shadow)" />
              </g>

              {/* Loafers or Sneakers for boy */}
              <g transform={`translate(${feetX}, 0)`}>
                {c.shoes === "shoes-basic-shoes" && (
                  <g>
                    <path d="M114,275 C110,270 125,268 127,275 L128,288 C128,291 113,291 113,288 Z" fill="#1D4ED8" stroke="#172554" strokeWidth="1" />
                    <rect x="113" y="284" width="15" height="4" rx="1" fill="#FFFFFF" />
                    <path d="M133,275 C131,268 146,270 142,275 L143,288 C143,291 128,291 128,288 Z" fill="#1D4ED8" stroke="#172554" strokeWidth="1" />
                    <rect x="128" y="284" width="15" height="4" rx="1" fill="#FFFFFF" />
                  </g>
                )}
                {c.shoes === "shoes-academic-shoes" && (
                  <g>
                    <path d="M113,274 C110,270 126,268 127,274 L128,288 C128,291 113,291 113,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
                    <path d="M133,274 C131,268 147,270 144,274 L144,288 C144,291 129,291 129,288 Z" fill="#451A03" stroke="#1C0F07" strokeWidth="1.2" />
                  </g>
                )}
              </g>

              {/* Male Varsity Jacket / Shirt */}
              {c.outfit === "" && (c.shirt === "shirt-basic-hoodie" || c.shirt === "shirt-basic-tee" || c.shirt === "shirt-academic-jacket" || c.shirt === "shirt-lab-coat") && (
                <g transform={`translate(${chestX}, 0)`}>
                  <path d="M94,110 C94,98 166,98 166,110 L148,170 C148,172 112,172 112,170 Z" fill="url(#navy-fabric-grad)" stroke="#0F172A" strokeWidth="0.8" />
                  <rect x="110" y="166" width="40" height="6" rx="2" fill="#1E3A8A" />

                  {/* Collar and neck */}
                  <path d="M118,110 L142,110 L130,124 Z" fill={`url(#${activeSkin.gradId})`} />
                  <path d="M120,110 L125,120 L130,122 L135,120 L140,110 Z" fill="#64748B" />

                  {/* Varsity White Leather Sleeves */}
                  <g transform={`translate(${-chestX + armsX}, 0)`}>
                    <path d="M94,110 C86,124 84,142 88,162" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" fill="none" />
                    <path d="M166,110 C174,124 176,142 172,162" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" fill="none" />
                    
                    {/* Blue cuffs */}
                    <circle cx="88" cy="162" r="5.8" fill="#1E3A8A" />
                    <circle cx="172" cy="162" r="5.8" fill="#1E3A8A" />
                    
                    {/* Skin hands */}
                    <circle cx="86" cy="167" r="4.2" fill={`url(#${activeSkin.gradId})`} />
                    <circle cx="174" cy="167" r="4.2" fill={`url(#${activeSkin.gradId})`} />
                  </g>

                  {/* Letterman 'E' Badge */}
                  <g filter="url(#gold-glow)">
                    <rect x="103" y="120" width="13" height="15" rx="2" fill="url(#crest-gradient)" />
                    <text x="106" y="131" fill="#1C0F07" fontSize="9" fontWeight="900" fontFamily="sans-serif">E</text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* ==========================================
              PREMIUM PREMIUM OUTFITS (REPLACES SHIRT/PANTS)
              ========================================== */}
          {c.outfit !== "" && (
            <g>
              {/* OUTFIT: RECTOR GALA SUIT (⚖️) */}
              {c.outfit === "outfit-rector" && (
                <g>
                  {/* Robe body */}
                  <path d="M90,110 C90,95 170,95 170,110 L152,190 L108,190 Z" fill="#581C87" transform={`translate(${chestX}, 0)`} />
                  <rect x="122" y="110" width="16" height="80" fill="#111827" transform={`translate(${chestX}, 0)`} />
                  <line x1="122" y1="110" x2="122" y2="190" stroke="#FBBF24" strokeWidth="1.5" transform={`translate(${chestX}, 0)`} />
                  <line x1="138" y1="110" x2="138" y2="190" stroke="#FBBF24" strokeWidth="1.5" transform={`translate(${chestX}, 0)`} />
                  
                  {/* Big rector medal */}
                  <g transform={`translate(${chestX}, 0)`}>
                    <line x1="126" y1="116" x2="130" y2="130" stroke="#FBBF24" strokeWidth="2" />
                    <line x1="134" y1="116" x2="130" y2="130" stroke="#FBBF24" strokeWidth="2" />
                    <circle cx="130" cy="132" r="6" fill="url(#crest-gradient)" filter="url(#soft-shadow)" />
                  </g>

                  {/* Flowing wide robe sleeves */}
                  <g transform={`translate(${armsX}, 0)`}>
                    <path d="M90,110 C76,124 72,148 76,172 L88,172 C84,148 88,124 90,110 Z" fill="#581C87" />
                    <path d="M170,110 C184,124 188,148 184,172 L172,172 C176,148 172,124 170,110 Z" fill="#581C87" />
                    <circle cx="82" cy="172" r="3.5" fill={`url(#${activeSkin.gradId})`} />
                    <circle cx="178" cy="172" r="3.5" fill={`url(#${activeSkin.gradId})`} />
                  </g>

                  {/* Gown long trousers */}
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,190 L108,278 L124,278 L122,190 Z" fill="#111827" />
                    <path d="M138,190 L136,278 L152,278 L148,190 Z" fill="#111827" />
                  </g>
                </g>
              )}

              {/* OUTFIT: SCIENCE SUPREMO EXOSUIT (🧬) */}
              {c.outfit === "outfit-science-supremo" && (
                <g>
                  {/* Cyber armor body */}
                  <path d="M94,110 C94,98 166,98 166,110 L148,170 L112,170 Z" fill="#0F172A" transform={`translate(${chestX}, 0)`} />
                  
                  {/* Glowing cyber reactor */}
                  <g transform={`translate(${chestX}, 0)`}>
                    <circle cx="130" cy="135" r="10" fill="#06B6D4" filter="url(#glow-neon)" />
                    <circle cx="130" cy="135" r="5" fill="#FFFFFF" />
                    <path d="M94,110 L106,122 M166,110 L154,122" stroke="#06B6D4" strokeWidth="2.5" filter="url(#glow-neon)" />
                  </g>

                  {/* Robot arm sleeves */}
                  <g transform={`translate(${armsX}, 0)`}>
                    <path d="M94,110 C86,124 84,142 88,162" stroke="#1E293B" strokeWidth="10.5" fill="none" />
                    <path d="M94,110 C86,124 84,142 88,162" stroke="#06B6D4" strokeWidth="2" fill="none" filter="url(#glow-neon)" opacity="0.8" />
                    <path d="M166,110 C174,124 176,142 172,162" stroke="#1E293B" strokeWidth="10.5" fill="none" />
                    <path d="M166,110 C174,124 176,142 172,162" stroke="#06B6D4" strokeWidth="2" fill="none" filter="url(#glow-neon)" opacity="0.8" />
                  </g>

                  {/* Robot legs */}
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,170 L108,278 L124,278 L122,170 Z" fill="#0F172A" />
                    <path d="M138,170 L136,278 L152,278 L148,170 Z" fill="#0F172A" />
                    <rect x="110" y="222" width="10" height="12" rx="3" fill="#06B6D4" filter="url(#glow-neon)" />
                    <rect x="140" y="222" width="10" height="12" rx="3" fill="#06B6D4" filter="url(#glow-neon)" />
                  </g>
                </g>
              )}

              {/* OUTFIT: MATH GENIUS (🔢) */}
              {c.outfit === "outfit-math-genius" && (
                <g>
                  {/* Grid shirt */}
                  <path d="M96,112 C96,98 164,98 164,112 L146,170 C146,172 114,172 114,170 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" transform={`translate(${chestX}, 0)`} />
                  
                  {/* Leather suspenders */}
                  <g transform={`translate(${chestX}, 0)`}>
                    <rect x="115" y="112" width="3.5" height="58" fill="#78350F" />
                    <rect x="141.5" y="112" width="3.5" height="58" fill="#78350F" />
                    <rect x="114" y="136" width="5.5" height="3" rx="0.5" fill="#F59E0B" />
                    <rect x="140.5" y="136" width="5.5" height="3" rx="0.5" fill="#F59E0B" />
                    <circle cx="130" cy="130" r="2" fill="#78350F" />
                  </g>

                  {/* Sleeves with checkered cuff */}
                  <g transform={`translate(${armsX}, 0)`}>
                    <path d="M96,112 C88,124 84,142 88,162" stroke="#F8FAFC" strokeWidth="9.8" strokeLinecap="round" fill="none" />
                    <path d="M164,112 C172,124 176,142 172,162" stroke="#F8FAFC" strokeWidth="9.8" strokeLinecap="round" fill="none" />
                    <circle cx="88" cy="162" r="5" fill="#78350F" />
                    <circle cx="172" cy="162" r="5" fill="#78350F" />
                  </g>

                  {/* Brown scholarly trousers */}
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,170 L108,278 L124,278 L122,170 Z" fill="#78350F" />
                    <path d="M138,170 L136,278 L152,278 L148,170 Z" fill="#78350F" />
                  </g>
                </g>
              )}

              {/* OUTFIT: INVESTIGATOR CAMEL TRENCH COAT (🔍) */}
              {c.outfit === "outfit-investigator" && (
                <g>
                  {/* Trench coat camel */}
                  <path d="M92,110 C92,96 168,96 168,110 L148,190 L112,190 Z" fill="#D97706" opacity="0.85" transform={`translate(${chestX}, 0)`} />
                  
                  {/* Detailed coat buttons, lapels and belt */}
                  <g transform={`translate(${chestX}, 0)`}>
                    <polygon points="92,110 114,128 114,110" fill="#B45309" />
                    <polygon points="168,110 146,128 146,110" fill="#B45309" />
                    <rect x="110" y="160" width="40" height="7" fill="#451A03" />
                    <rect x="127" y="157" width="7" height="13" rx="1.5" fill="none" stroke="#FBBF24" strokeWidth="2" />
                    <circle cx="118" cy="134" r="2.2" fill="#451A03" />
                    <circle cx="118" cy="148" r="2.2" fill="#451A03" />
                    <circle cx="142" cy="134" r="2.2" fill="#451A03" />
                    <circle cx="142" cy="148" r="2.2" fill="#451A03" />
                  </g>

                  {/* Trousers under coat */}
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,190 L108,278 L124,278 L122,190 Z" fill="#1E293B" />
                    <path d="M138,190 L136,278 L152,278 L148,190 Z" fill="#1E293B" />
                  </g>
                </g>
              )}

              {/* OUTFIT: ACADEMIC LEGEND ROYAL CAPE (🦁) */}
              {c.outfit === "outfit-academic-legend" && (
                <g>
                  {/* Royal red cape in background */}
                  <path d="M84,110 C70,140 68,220 84,280 C90,290 170,290 176,280 C192,220 190,140 176,110 Z" fill="url(#crimson-fabric-grad)" transform={`translate(${chestX * 0.5}, 0)`} />
                  
                  {/* Golden armor plate breastplate */}
                  <path d="M96,110 C96,98 164,98 164,110 L148,170 L112,170 Z" fill="url(#crest-gradient)" stroke="#B45309" strokeWidth="1" transform={`translate(${chestX}, 0)`} />
                  
                  {/* Lion seal shield */}
                  <g transform={`translate(${chestX}, 0)`}>
                    <path d="M124,120 L136,120 L134,136 L130,140 L126,136 Z" fill="#EF4444" stroke="#FFF" strokeWidth="1" />
                    <path d="M128,128 L130,126 L132,128 L130,134 Z" fill="url(#crest-gradient)" />
                    {/* Golden epaulets */}
                    <rect x="90" y="105" width="16" height="7" rx="2" fill="url(#crest-gradient)" stroke="#B45309" strokeWidth="0.8" />
                    <rect x="154" y="105" width="16" height="7" rx="2" fill="url(#crest-gradient)" stroke="#B45309" strokeWidth="0.8" />
                  </g>

                  {/* Royal trousers */}
                  <g transform={`translate(${feetX}, 0)`}>
                    <path d="M112,170 L108,278 L124,278 L122,170 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.5" />
                    <path d="M138,170 L136,278 L152,278 L148,170 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.5" />
                  </g>
                </g>
              )}
            </g>
          )}

          {/* Skin tone neck (connecting head and body) */}
          <path d="M125,95 L135,95 L134,110 L126,110 Z" fill={activeSkin.shadow} transform={`translate(${headX}, ${charYOffset})`} />

          {/* ==========================================
              STYLIZED DETAILED HEAD & ROSY CHEEKS
              ========================================== */}
          <g transform={`translate(${headX}, ${charYOffset})`}>
            {/* Smooth 3D-shaded tapered chin student head */}
            <path d="M107,70 C107,45 153,45 153,70 C153,91 143,97 130,97 C117,97 107,91 107,70 Z" fill={`url(#${activeSkin.gradId})`} />
            
            {/* Elegant ears with helix shading */}
            <path d="M107,70 Q101,70 103,78 Q105,82 108,79 Z" fill={`url(#${activeSkin.gradId})`} />
            <path d="M153,70 Q159,70 157,78 Q155,82 152,79 Z" fill={`url(#${activeSkin.gradId})`} />
            <path d="M106,72 Q103,72 104,77" stroke={activeSkin.shadow} strokeWidth="0.8" fill="none" />
            <path d="M154,72 Q157,72 156,77" stroke={activeSkin.shadow} strokeWidth="0.8" fill="none" />

            {/* Natural warm rosy blush (Front view only) */}
            {isFront && (
              <g>
                <circle cx="114" cy="81" r="7.5" fill="url(#blush-radial)" />
                <circle cx="146" cy="81" r="7.5" fill="url(#blush-radial)" />
              </g>
            )}
          </g>

          {/* ==========================================
              EXPRESSIVE REAL STUDENT FACES (No Roblox simplicity!)
              ========================================== */}
          {isFront && (
            <g transform={`translate(${eyesX}, ${charYOffset})`}>
              {/* BASE FACIAL FEATURES (ALWAYS VISIBLE EXCEPT UNDER MASK) */}
              <g>
                {/* Nose bridge and highlight */}
                <path d="M129.5,77 L130.5,77 L130.5,80.5 Q130.5,82 129,82" stroke={activeSkin.shadow} strokeWidth="0.9" fill="none" opacity="0.85" strokeLinecap="round" />
                <ellipse cx="130" cy="80" rx="1.2" ry="0.7" fill="#FFFFFF" opacity="0.4" />
                
                {/* Arched neatly styled eyebrows */}
                <path d="M108,66 C111,62.5 119,62.5 124,66.5" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M136,66.5 C141,62.5 149,62.5 152,66" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />

                {/* Sweet smile lips */}
                <path d="M126,85 Q130,86.5 134,85" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M127.5,86 Q130,88.5 132.5,86" fill="#F43F5E" opacity="0.65" />
              </g>

              {/* FACE: HAPPY (Almond hazel premium eyes) */}
              {c.face === "face-happy" && (
                <g>
                  {/* Left Premium Eye */}
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <ellipse cx="117" cy="73" rx="7" ry="3.5" fill="#E2E8F0" opacity="0.6" />
                  <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <circle cx="115.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                  <circle cx="118.5" cy="75.5" r="0.6" fill="#FFFFFF" />
                  <path d="M109,74 C112,71.5 119,71.5 125,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M111,70 C114,68.5 119,68.5 122,70" stroke="#8E5136" strokeWidth="0.8" opacity="0.6" fill="none" />

                  {/* Right Premium Eye */}
                  <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <ellipse cx="143" cy="73" rx="7" ry="3.5" fill="#E2E8F0" opacity="0.6" />
                  <circle cx="143" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <circle cx="141.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                  <circle cx="144.5" cy="75.5" r="0.6" fill="#FFFFFF" />
                  <path d="M135,74 C138,71.5 145,71.5 151,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M137,70 C140,68.5 145,68.5 148,70" stroke="#8E5136" strokeWidth="0.8" opacity="0.6" fill="none" />
                </g>
              )}

              {/* FACE: STUDYING (Focused reading eyes and sleek frames) */}
              {c.face === "face-studying" && (
                <g>
                  {/* Focused squint eyes */}
                  <path d="M112,74 C114,72.5 119,72.5 122,74" stroke="#1A0F0A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M138,74 C140,72.5 145,72.5 148,74" stroke="#1A0F0A" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                  {/* Stylish black reading glasses */}
                  <circle cx="117" cy="74" r="10.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                  <circle cx="117" cy="74" r="10.5" stroke="#64748B" strokeWidth="0.8" fill="none" opacity="0.4" />
                  <circle cx="143" cy="74" r="10.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                  <circle cx="143" cy="74" r="10.5" stroke="#64748B" strokeWidth="0.8" fill="none" opacity="0.4" />
                  <line x1="127.5" y1="74" x2="132.5" y2="74" stroke="#1E293B" strokeWidth="2.5" />
                  {/* Glass highlights */}
                  <path d="M110,69 L115,64" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
                  <path d="M136,69 L141,64" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
                </g>
              )}

              {/* FACE: EXCITED (Stars-in-eyes spark) */}
              {c.face === "face-excited" && (
                <g>
                  {/* Big glittering eyes */}
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  {/* Golden starry highlights */}
                  <polygon points="117,69 119,72 122,72 119,74 121,78 117,76 113,78 115,74 112,72 115,72" fill="#FBBF24" />
                  <circle cx="118.5" cy="75.5" r="0.8" fill="#FFFFFF" />

                  <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="143" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <polygon points="143,69 145,72 148,72 145,74 147,78 143,76 139,78 141,74 138,72 141,72" fill="#FBBF24" />
                  <circle cx="144.5" cy="75.5" r="0.8" fill="#FFFFFF" />

                  {/* Big open cute happy smile */}
                  <path d="M125,84 C125,84 130,94 135,84 Z" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.8" />
                  <path d="M127,85 Q130,88 133,85 Z" fill="#FCA5A5" />
                </g>
              )}

              {/* FACE: COOL (Sleek aviator dark sunglasses) */}
              {c.face === "face-cool" && (
                <g>
                  {/* Premium cool dark sunglasses */}
                  <path d="M106,66 L124,66 L123,78 Q115,82 107,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <path d="M107,67 L123,67 L122,77 Z" fill="#FFFFFF" opacity="0.15" />
                  <path d="M136,66 L154,66 L153,78 Q145,82 137,78 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                  <path d="M137,67 L153,67 L152,77 Z" fill="#FFFFFF" opacity="0.15" />
                  <line x1="124" y1="70" x2="136" y2="70" stroke="#0F172A" strokeWidth="2.5" />
                  
                  {/* Specular glare lines */}
                  <line x1="108" y1="69" x2="114" y2="75" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
                  <line x1="138" y1="69" x2="144" y2="75" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
                </g>
              )}

              {/* FACE: WINK (Playful smirk) */}
              {c.face === "face-wink" && (
                <g>
                  {/* Left Premium Eye open */}
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="74" r="4.2" fill="url(#eyes-pupil)" />
                  <circle cx="115.5" cy="72.5" r="1.3" fill="#FFFFFF" />
                  <path d="M109,74 C112,71.5 119,71.5 125,74" stroke="#1A0F0A" strokeWidth="2" strokeLinecap="round" fill="none" />

                  {/* Right eye closed in wink */}
                  <path d="M136,75 Q143,80 150,75" stroke="#1A0F0A" strokeWidth="2.8" strokeLinecap="round" fill="none" />

                  {/* Smirk smile */}
                  <path d="M126,85 Q131,88 135,83" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* FACE: CURIOUS (Inquisitive focus) */}
              {c.face === "face-curious" && (
                <g>
                  {/* Curious eyes looking upwards */}
                  <ellipse cx="117" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="117" cy="71.5" r="3.8" fill="url(#eyes-pupil)" />
                  <circle cx="116" cy="70" r="1.2" fill="#FFFFFF" />

                  <ellipse cx="143" cy="74" rx="7" ry="5.5" fill="#FFFFFF" />
                  <circle cx="143" cy="71.5" r="3.8" fill="url(#eyes-pupil)" />
                  <circle cx="142" cy="70" r="1.2" fill="#FFFFFF" />

                  {/* Raised curious left eyebrow */}
                  <path d="M107,63 C111,59.5 119,59.5 124,63" stroke="#3A1E11" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />

                  {/* Inquisitive tiny circular mouth */}
                  <ellipse cx="130" cy="85" rx="2.5" ry="1.8" fill="#1C0F07" />
                </g>
              )}
            </g>
          )}

          {/* FRONT HAIR (Bangs & side frames - layered ON TOP of the face) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`}>
              {c.hairStyle === "hair-wavy" && (
                <g>
                  {/* Cap crown */}
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,65 141,60 C130,46 128,46 119,60 C114,65 107,64 107,56 Z" fill={`url(#${hairGradId})`} />
                  {/* Dynamic wave bangs */}
                  <path d="M109,56 C120,44 140,44 151,56 C143,50 135,50 130,53 C125,50 117,50 109,56 Z" fill={activeHair.highlight} opacity="0.9" />
                  {/* Side locks framing temple */}
                  <path d="M107,56 C103,72 105,86 109,92" stroke={`url(#${hairGradId})`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <path d="M153,56 C157,72 155,86 151,92" stroke={`url(#${hairGradId})`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,64 141,60 C132,48 128,48 119,60 C114,64 107,64 107,56 Z" fill={`url(#${hairGradId})`} />
                  <path d="M107,56 Q102,75 106,102 C108,102 109,75 108,56" fill={`url(#${hairGradId})`} />
                  <path d="M153,56 Q158,75 154,102 C152,102 151,75 152,56" fill={`url(#${hairGradId})`} />
                </g>
              )}

              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C151,64 147,65 142,61 C135,53 125,53 118,61 C113,65 109,64 107,56 Z" fill={`url(#${hairGradId})`} />
                  <rect x="105" y="56" width="5.5" height="38" rx="2" fill={`url(#${hairGradId})`} />
                  <rect x="149.5" y="56" width="5.5" height="38" rx="2" fill={`url(#${hairGradId})`} />
                  <rect x="105" y="66" width="50" height="3" fill="#FFFFFF" opacity="0.3" />
                </g>
              )}

              {c.hairStyle === "hair-curly" && (
                <g>
                  {/* Interlocking fluffy curl rings */}
                  <circle cx="106" cy="50" r="14" fill={`url(#${hairGradId})`} />
                  <circle cx="120" cy="40" r="14" fill={`url(#${hairGradId})`} />
                  <circle cx="140" cy="40" r="14" fill={`url(#${hairGradId})`} />
                  <circle cx="154" cy="50" r="14" fill={`url(#${hairGradId})`} />
                  <circle cx="112" cy="62" r="10" fill={`url(#${hairGradId})`} />
                  <circle cx="148" cy="62" r="10" fill={`url(#${hairGradId})`} />
                  <circle cx="130" cy="48" r="12" fill={`url(#${hairGradId})`} />
                </g>
              )}

              {c.hairStyle === "hair-afro" && (
                <g>
                  <path d="M130,16 C105,16 90,30 90,54 C90,70 100,82 110,88 C100,94 104,104 114,102 C120,106 140,106 146,102 C156,104 160,94 150,88 C160,82 170,70 170,54 C170,30 155,16 130,16 Z" fill={`url(#${hairGradId})`} />
                  <circle cx="104" cy="44" r="18" fill={`url(#${hairGradId})`} />
                  <circle cx="156" cy="44" r="18" fill={`url(#${hairGradId})`} />
                  <circle cx="112" cy="74" r="16" fill={`url(#${hairGradId})`} />
                  <circle cx="148" cy="74" r="16" fill={`url(#${hairGradId})`} />
                  <circle cx="130" cy="34" r="22" fill={`url(#${hairGradId})`} />
                </g>
              )}

              {c.hairStyle === "hair-braids" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,64 141,60 C132,48 128,48 119,60 C114,64 107,64 107,56 Z" fill={`url(#${hairGradId})`} />
                </g>
              )}

              {c.hairStyle === "hair-pigtails" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,64 146,64 141,60 C132,48 128,48 119,60 C114,64 107,64 107,56 Z" fill={`url(#${hairGradId})`} />
                </g>
              )}

              {c.hairStyle === "hair-short" && (
                <g>
                  <path d="M107,56 C107,24 153,24 153,56 C153,62 146,62 141,58 C132,48 128,48 119,58 C114,62 107,62 107,56 Z" fill={`url(#${hairGradId})`} />
                  <polygon points="107,44 115,30 120,40" fill={`url(#${hairGradId})`} />
                  <polygon points="118,34 128,20 132,30" fill={`url(#${hairGradId})`} />
                  <polygon points="128,30 138,18 142,32" fill={`url(#${hairGradId})`} />
                  <polygon points="138,34 146,24 151,38" fill={`url(#${hairGradId})`} />
                  <polygon points="145,44 153,32 155,46" fill={`url(#${hairGradId})`} />
                  <path d="M107,56 C104,66 105,74 107,77" stroke={`url(#${hairGradId})`} strokeWidth="3" strokeLinecap="round" />
                  <path d="M153,56 C156,66 155,74 153,77" stroke={`url(#${hairGradId})`} strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}

          {/* ==========================================
              HEADWEAR & EYEWEAR ACCESSORIES (PREMIUM)
              ========================================== */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {/* ACC: BIRRETE GRADUATION (🎓) */}
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  <ellipse cx="130" cy="46" rx="18" ry="6" fill="#111827" />
                  <rect x="112" y="39" width="36" height="8" fill="#111827" />
                  <polygon points="130,30 164,39 130,48 96,39" fill="#1F2937" stroke="#111827" strokeWidth="1" />
                  {/* Golden tassel */}
                  <path d="M130,39 L156,43 L159,54" fill="none" stroke="url(#crest-gradient)" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="159" cy="54" r="2.2" fill="#D97706" />
                </g>
              )}

              {/* ACC: KNOWLEDGE ROYAL CROWN (👑) */}
              {c.accessory === "acc-knowledge-crown" && (
                <g filter="url(#gold-glow)">
                  <path d="M108,48 L110,26 L120,37 L130,18 L140,37 L150,26 L152,48 Z" fill="url(#crest-gradient)" stroke="#78350F" strokeWidth="0.8" />
                  {/* Jewels */}
                  <circle cx="130" cy="30" r="2.5" fill="#EF4444" />
                  <circle cx="118" cy="40" r="1.8" fill="#3B82F6" />
                  <circle cx="142" cy="40" r="1.8" fill="#3B82F6" />
                </g>
              )}

              {/* ACC: NERD ACADEMIC GLASSES (Sit on nose bridge) */}
              {c.accessory === "acc-nerd-glasses" && c.face !== "face-studying" && (
                <g>
                  <circle cx="117" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <circle cx="143" cy="74" r="9.5" stroke="#1E293B" strokeWidth="2" fill="none" />
                  <line x1="126.5" y1="74" x2="133.5" y2="74" stroke="#1E293B" strokeWidth="2" />
                  <path d="M111,70 L115,66" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
                  <path d="M137,70 L142,66" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
                </g>
              )}

              {/* ACC: CYBER VIOLET HEADPHONES sitting perfectly */}
              {c.accessory === "acc-headphones" && (
                <g filter="url(#soft-shadow)">
                  <rect x="99" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <rect x="153" y="60" width="8" height="24" rx="4" fill="#8B5CF6" stroke="#5B21B6" strokeWidth="0.8" />
                  <path d="M103,62 C103,34 157,34 157,62" fill="none" stroke="#7C3AED" strokeWidth="3.2" />
                </g>
              )}

              {/* ACC: MINI GLOBE ORBITING */}
              {c.accessory === "acc-education-globe" && (
                <g filter="url(#soft-shadow)" transform="translate(48, 140)">
                  <circle cx="0" cy="0" r="12" fill="#3B82F6" />
                  {/* Green continents */}
                  <path d="M-6,-4 C-6,-4 -2,-8 2,-4 C6,0 6,-2 2,2 C-2,6 -4,2 -6,-4 Z" fill="#10B981" />
                  <path d="M-10,0 C-10,0 -8,-2 -6,2 Z" fill="#10B981" />
                  {/* Ring */}
                  <ellipse cx="0" cy="0" rx="18" ry="4" fill="none" stroke="#60A5FA" strokeWidth="1.8" transform="rotate(-15)" />
                </g>
              )}

              {/* ACC: FLOATING WISDOM BOOK */}
              {c.accessory === "acc-floating-book" && (
                <g filter="url(#soft-shadow)" transform="translate(-48, 120)">
                  {/* Open book */}
                  <polygon points="-12,-8 0,-4 0,10 -12,6" fill="#F8FAFC" />
                  <polygon points="12,-8 0,-4 0,10 12,6" fill="#F8FAFC" />
                  <path d="-12,-8 L-14,-7 L-14,7 L-12,6 Z" fill="#78350F" />
                  <path d="12,-8 L14,-7 L14,7 L12,6 Z" fill="#78350F" />
                  {/* Magic sparkles */}
                  <circle cx="-6" cy="-14" r="1.5" fill="#FBBF24" filter="url(#gold-glow)" />
                  <circle cx="8" cy="-18" r="1" fill="#FBBF24" filter="url(#gold-glow)" />
                </g>
              )}
            </g>
          )}

          {/* REVERSED VIEW */}
          {!isFront && (
            <g transform={`translate(${backpackX}, ${charYOffset})`} filter="url(#soft-shadow)">
              {/* Back hair covering head from behind */}
              <path d="M109,56 C92,92 88,140 100,195 C108,205 114,200 112,165 C110,135 114,92 130,92 C146,92 150,135 148,165 C146,200 152,205 160,195 C172,140 168,92 151,56 Z" fill={`url(#${hairGradId})`} transform={`translate(${headX - backpackX}, 0)`} />
              
              {/* Backpack fully visible on reverso */}
              {c.accessory.includes("backpack") && (
                <g>
                  {c.accessory === "acc-school-backpack" && (
                    <g>
                      <rect x="96" y="112" width="68" height="68" rx="16" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
                      <rect x="104" y="130" width="52" height="36" rx="8" fill="#B91C1C" />
                      {/* Shoulder strap loops */}
                      <path d="M100,112 C100,98 114,98 114,112" fill="none" stroke="#7F1D1D" strokeWidth="4" />
                      <path d="M160,112 C160,98 146,98 146,112" fill="none" stroke="#7F1D1D" strokeWidth="4" />
                    </g>
                  )}
                  {c.accessory === "acc-science-backpack" && (
                    <g>
                      <rect x="96" y="110" width="68" height="70" rx="12" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
                      <rect x="102" y="116" width="56" height="48" rx="6" fill="#10B981" />
                      <rect x="112" y="122" width="8" height="32" rx="2" fill="#06B6D4" filter="url(#glow-neon)" />
                      <rect x="140" y="122" width="8" height="32" rx="2" fill="#06B6D4" filter="url(#glow-neon)" />
                    </g>
                  )}
                  {c.accessory === "acc-college-backpack" && (
                    <g>
                      <rect x="99" y="112" width="62" height="18" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
                      <rect x="97" y="130" width="66" height="18" rx="3" fill="#1E3A8A" stroke="#172554" strokeWidth="1.5" />
                      <rect x="95" y="148" width="70" height="20" rx="3" fill="#065F46" stroke="#064E3B" strokeWidth="1.5" />
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
