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

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 2) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Skin color hex values
  const skinColors: Record<string, string> = {
    "skin-light-1": "#FFEBE1",
    "skin-light-2": "#FCD8B8",
    "skin-medium-1": "#EAA374",
    "skin-medium-2": "#C48053",
    "skin-dark-1": "#7D4A27",
  };
  const activeSkinHex = skinColors[c.skinColor] || skinColors["skin-light-2"];

  // Hair hex colors
  const hairColors: Record<string, string> = {
    "color-black": "#231F20",
    "color-brown-light": "#844E29",
    "color-brown-dark": "#4C2411",
    "color-blonde": "#DE9C26",
    "color-red": "#C83B2B",
    "color-gray": "#828A8F",
    "color-white": "#F9FAFB",
    "color-fantasy-pink": "#EC4899",
    "color-fantasy-blue": "#2563EB",
    "color-fantasy-purple": "#7C3AED",
  };
  const activeHairHex = hairColors[c.hairColor] || hairColors["color-black"];

  // Highlight colors
  const highlightColors: Record<string, string> = {
    "hl-black-blue": "#3B82F6",
    "hl-brown-red": "#EF4444",
    "hl-blonde-pink": "#F472B6",
    "hl-custom-neon": "#10B981",
  };
  const highlightHex = highlightColors[c.hairHighlight] || "";

  // 2.5D Parallax calculations based on yaw angle
  const rad = (yaw * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // We are facing the front when cos is positive
  const isFront = cos >= 0;

  // Parallax horizontal shifts
  const faceX = sin * 18;
  const hairFrontX = sin * 10;
  const chestX = sin * 8;
  const backpackX = -sin * 12;

  // Vertical shifts (slight angle view)
  const pitchY = -4; // slight tilt down

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[280px] h-[340px] mx-auto">
      {/* 2.5D illustrated SVG viewport */}
      <svg
        viewBox="0 0 240 320"
        className="w-full h-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] cursor-grab active:cursor-grabbing"
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
            setYaw((startYaw + deltaX * 0.9) % 360);
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
            setYaw((startYaw + deltaX * 0.9) % 360);
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
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
          </filter>
          <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="hair-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={activeHairHex} />
            <stop offset="100%" stopColor="#111" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="gold-emblem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="pants-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={c.pants === "pants-basic-jeans" ? "#1D4ED8" : "#2E3A4E"} />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="skirt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="60%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* 1. BACKGROUND AURA EFFECT */}
        {c.aura === "aura-golden" && (
          <g filter="url(#glow-gold)" opacity="0.6">
            <circle cx="120" cy="150" r="85" fill="none" stroke="#FBBF24" strokeWidth="4" strokeDasharray="6,12" />
            <circle cx="120" cy="150" r="60" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,8" />
          </g>
        )}

        {c.aura === "aura-math" && (
          <g opacity="0.8">
            <text x="35" y="90" fill="#22D3EE" fontSize="12" fontFamily="monospace" fontWeight="bold">π</text>
            <text x="195" y="100" fill="#22D3EE" fontSize="14" fontFamily="monospace" fontWeight="bold">∑</text>
            <text x="40" y="210" fill="#22D3EE" fontSize="13" fontFamily="monospace" fontWeight="bold">E=mc²</text>
            <text x="175" y="220" fill="#22D3EE" fontSize="12" fontFamily="monospace" fontWeight="bold">√x</text>
            <text x="120" y="40" fill="#22D3EE" fontSize="12" fontFamily="monospace" fontWeight="bold">f(x)</text>
          </g>
        )}

        {/* 2. REAL SHADOW Decal on the Floor */}
        <ellipse cx="120" cy="305" rx="55" ry="12" fill="rgba(0,0,0,0.3)" />

        {/* 3. COMPANION PET OWL (WISER OWL mascot wearing spectacles and mini mortarboard) */}
        {c.pet === "pet-owl" && isFront && (
          <g transform={`translate(${170 + faceX * 0.3}, ${60 + pitchY})`} filter="url(#soft-shadow)">
            {/* Body */}
            <rect x="0" y="0" width="28" height="34" rx="10" fill="#854D29" />
            <rect x="4" y="6" width="20" height="24" rx="8" fill="#FCD8B8" />
            {/* Eyes */}
            <circle cx="8" cy="12" r="5" fill="#FBBF24" stroke="#000" strokeWidth="1" />
            <circle cx="8" cy="12" r="2.5" fill="#000" />
            <circle cx="20" cy="12" r="5" fill="#FBBF24" stroke="#000" strokeWidth="1" />
            <circle cx="20" cy="12" r="2.5" fill="#000" />
            {/* Owl glasses */}
            <circle cx="8" cy="12" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
            <circle cx="20" cy="12" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
            <line x1="14" y1="12" x2="14" y2="12" stroke="#000" strokeWidth="1.5" />
            {/* Beak */}
            <polygon points="14,15 11,19 17,19" fill="#D97706" />
            {/* Mini Graduation Cap */}
            <polygon points="14, -6 28, -2 14, 2 0, -2" fill="#1E293B" />
            <rect x="8" y="-2" width="12" height="4" fill="#0F172A" />
            <path d="M22, -3 L25, 4" stroke="#FBBF24" strokeWidth="1" />
          </g>
        )}

        {/* 4. BACKPACK (renders behind body if facing front) */}
        {isFront && c.accessory.includes("backpack") && (
          <g transform={`translate(${backpackX}, ${pitchY})`} filter="url(#soft-shadow)">
            {c.accessory === "acc-school-backpack" && (
              <rect x="94" y="125" width="52" height="60" rx="14" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
            )}
            {c.accessory === "acc-science-backpack" && (
              <g>
                <rect x="98" y="120" width="44" height="65" rx="8" fill="#1F2937" />
                <rect x="106" y="128" width="28" height="48" rx="6" fill="#34D399" opacity="0.8" />
                <path d="M106 140 L134 140 M106 155 L134 155" stroke="#06B6D4" strokeWidth="2" />
              </g>
            )}
            {c.accessory === "acc-college-backpack" && (
              <g>
                {/* Book stack */}
                <rect x="96" y="126" width="48" height="15" rx="3" fill="#DC2626" />
                <rect x="98" y="141" width="44" height="15" rx="3" fill="#16A34A" />
                <rect x="95" y="156" width="50" height="15" rx="3" fill="#2563EB" />
              </g>
            )}
          </g>
        )}

        {/* 5. CHARACTER BASE BODY */}
        <g filter="url(#soft-shadow)">
          {/* LEGS & SHOES */}
          {isGirl ? (
            <g>
              {/* Slender legs */}
              <rect x="98" y="210" width="16" height="50" fill={activeSkinHex} />
              <rect x="126" y="210" width="16" height="50" fill={activeSkinHex} />
              {/* High socks with navy stripes */}
              <rect x="97" y="225" width="18" height="30" fill="#FFFFFF" />
              <rect x="125" y="225" width="18" height="30" fill="#FFFFFF" />
              <rect x="97" y="228" width="18" height="4" fill="#1E3A8A" />
              <rect x="125" y="228" width="18" height="4" fill="#1E3A8A" />
              {/* High-fidelity white/blue sneakers */}
              <path d="M93,275 C93,265 116,265 116,275 L116,290 C116,293 93,293 93,290 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <path d="M124,275 C124,265 147,265 147,275 L147,290 C147,293 124,293 124,290 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              {/* Blue accent swooshes */}
              <path d="M96,280 Q105,274 112,284" stroke="#2563EB" strokeWidth="2.5" fill="none" />
              <path d="M144,280 Q135,274 128,284" stroke="#2563EB" strokeWidth="2.5" fill="none" />
            </g>
          ) : (
            <g>
              {/* Boy illustrated pants (denim/cargo) */}
              <path d="M94,208 L114,208 L114,274 Q114,276 109,276 L94,276 Z" fill="url(#pants-grad)" />
              <path d="M126,208 L146,208 L146,274 Q146,276 131,276 L126,276 Z" fill="url(#pants-grad)" />
              {/* Cargo pocket & belt chain details */}
              <rect x="89" y="224" width="6" height="15" rx="1.5" fill="#1E293B" />
              <rect x="145" y="224" width="6" height="15" rx="1.5" fill="#1E293B" />
              <path d="M138,206 Q146,212 144,222" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
              {/* Modern blue sneakers */}
              <path d="M90,272 C90,262 115,262 115,272 L115,289 Q115,292 90,292 Z" fill="#1E3A8A" />
              <path d="M125,272 C125,262 150,262 150,272 L150,289 Q150,292 125,292 Z" fill="#1E3A8A" />
              <rect x="90" y="284" width="25" height="8" rx="2" fill="#FFFFFF" />
              <rect x="125" y="284" width="25" height="8" rx="2" fill="#FFFFFF" />
            </g>
          )}

          {/* TORSO & CLOTHING */}
          {isGirl ? (
            <g>
              {/* Pleated Skirt (Falda plisada) */}
              <path d="M90,190 L150,190 L158,218 L82,218 Z" fill="url(#skirt-grad)" />
              {/* Plaid pleated gold stripes */}
              <path d="M96,190 L90,218 M108,190 L104,218 M120,190 L120,218 M132,190 L136,218 M144,190 L150,218" stroke="#F59E0B" strokeWidth="1" />
            </g>
          ) : (
            <g>
              {/* Pants top belt area */}
              <rect x="93" y="190" width="54" height="20" rx="3" fill="#1E293B" />
            </g>
          )}

          {/* Torso Top (Jacket / Blazer / Sudadera) */}
          <rect x="88" y="120" width="64" height="74" rx="12" fill={isGirl ? "#FFFFFF" : "#1E3A8A"} stroke={isGirl ? "#E2E8F0" : "#172554"} strokeWidth="1.5" />

          {/* Underlayer & Ribbons */}
          {isGirl ? (
            <g transform={`translate(${chestX}, ${pitchY})`}>
              {/* White collared shirt with red ribbon tie bow */}
              <polygon points="120,120 110,128 130,128" fill="#F8FAFC" />
              {/* Red school ribbon tie */}
              <circle cx="120" cy="132" r="3.5" fill="#DC2626" />
              <path d="M120,132 L112,142 L116,144 Z" fill="#B91C1C" />
              <path d="M120,132 L128,142 L124,144 Z" fill="#B91C1C" />
              {/* Gold Emblem */}
              <circle cx="106" cy="144" r="5.5" fill="url(#gold-emblem)" />
              <polygon points="106,141 110,144 106,147 102,144" fill="#FFFFFF" />
            </g>
          ) : (
            <g transform={`translate(${chestX}, ${pitchY})`}>
              {/* Varsity white sleeves and zipper */}
              <rect x="88" y="124" width="10" height="66" fill="#F3F4F6" />
              <rect x="142" y="124" width="10" height="66" fill="#F3F4F6" />
              {/* Zipper metal line */}
              <line x1="120" y1="120" x2="120" y2="190" stroke="#94A3B8" strokeWidth="2.5" />
              {/* Big Golden letter L crest */}
              <rect x="98" y="132" width="12" height="15" rx="2" fill="url(#gold-emblem)" />
              <text x="100" y="144" fill="#1E1915" fontSize="12" fontWeight="950" fontFamily="sans-serif">L</text>
            </g>
          )}

          {/* Specific Outfits Overrides */}
          {c.outfit === "outfit-academic-legend" && (
            <g>
              <rect x="86" y="118" width="68" height="78" rx="14" fill="#991B1B" />
              <path d="M120,118 L120,196" stroke="#F59E0B" strokeWidth="3" />
            </g>
          )}

          {c.outfit === "outfit-science-supremo" && (
            <g>
              <rect x="86" y="118" width="68" height="78" rx="10" fill="#1F2937" />
              <circle cx="120" cy="150" r="12" fill="#22D3EE" opacity="0.9" />
            </g>
          )}

          {/* HEAD & FACE */}
          <circle cx="120" cy="80" r="28" fill={activeSkinHex} />

          {/* 6. HIGH-FIDELITY EXPRESSIONAL FACES */}
          {isFront && (
            <g transform={`translate(${faceX}, ${pitchY})`}>
              {c.face === "face-happy" && (
                <g>
                  {/* High fidelity glossy anime eyes */}
                  <rect x="103" y="70" width="13" height="19" rx="5" fill="#1C1915" />
                  <rect x="124" y="70" width="13" height="19" rx="5" fill="#1C1915" />
                  {/* Glossy sparkles */}
                  <circle cx="107" cy="74" r="3.5" fill="#FFFFFF" />
                  <circle cx="111" cy="82" r="1.5" fill="#FFFFFF" />
                  <circle cx="128" cy="74" r="3.5" fill="#FFFFFF" />
                  <circle cx="132" cy="82" r="1.5" fill="#FFFFFF" />
                  {/* Eyelash arcs */}
                  <path d="M101,70 L107,67" stroke="#1C1915" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M139,70 L133,67" stroke="#1C1915" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Motivated brows */}
                  <path d="M100,61 Q110,55 116,61" stroke="#4C2411" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M140,61 Q130,55 124,61" stroke="#4C2411" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  {/* Blush */}
                  <circle cx="98" cy="84" r="5" fill="#F43F5E" opacity="0.55" />
                  <circle cx="142" cy="84" r="5" fill="#F43F5E" opacity="0.55" />
                  {/* Happy open mouth with teeth/tongue */}
                  <path d="M112,88 Q120,102 128,88 Z" fill="#991B1B" />
                  <path d="M114,89 Q120,93 126,89" fill="#FFFFFF" />
                  <circle cx="120" cy="94" r="3" fill="#F43F5E" />
                </g>
              )}

              {c.face === "face-studying" && (
                <g>
                  {/* Focused blue eyes */}
                  <rect x="104" y="71" width="11" height="16" rx="4" fill="#0284C7" />
                  <rect x="125" y="71" width="11" height="16" rx="4" fill="#0284C7" />
                  <circle cx="108" cy="75" r="2.5" fill="#FFFFFF" />
                  <circle cx="129" cy="75" r="2.5" fill="#FFFFFF" />
                  {/* Round nerd glasses frames */}
                  <rect x="96" y="66" width="23" height="23" rx="6" stroke="#0F172A" strokeWidth="3.5" fill="none" />
                  <rect x="121" y="66" width="23" height="23" rx="6" stroke="#0F172A" strokeWidth="3.5" fill="none" />
                  <line x1="119" y1="78" x2="121" y2="78" stroke="#0F172A" strokeWidth="3.5" />
                  {/* motivated smirk */}
                  <path d="M113,94 Q120,98 127,94" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </g>
              )}

              {c.face === "face-excited" && (
                <g>
                  {/* Golden Star eyes */}
                  <polygon points="108,66 111,73 118,73 113,77 115,84 108,80 101,84 103,77 98,73 105,73" fill="#FBBF24" />
                  <polygon points="132,66 135,73 142,73 137,77 139,84 132,80 125,84 127,77 122,73 129,73" fill="#FBBF24" />
                  <circle cx="108" cy="73" r="2" fill="#FFFFFF" />
                  <circle cx="132" cy="73" r="2" fill="#FFFFFF" />
                  {/* Blushing */}
                  <circle cx="98" cy="83" r="6" fill="#EC4899" opacity="0.5" />
                  <circle cx="142" cy="83" r="6" fill="#EC4899" opacity="0.5" />
                  {/* Laughing mouth */}
                  <path d="M110,87 Q120,105 130,87 Z" fill="#991B1B" />
                  <path d="M112,88 Q120,92 128,88" fill="#FFFFFF" />
                </g>
              )}

              {c.face === "face-cool" && (
                <g>
                  {/* Sleek Illustrated academic shades */}
                  <polygon points="98,70 119,70 116,84 102,84" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
                  <polygon points="121,70 142,70 138,84 124,84" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="119" y1="74" x2="121" y2="74" stroke="#0F172A" strokeWidth="4" />
                  {/* Sunglasses reflection glares */}
                  <path d="M112,72 L104,82" stroke="rgba(34,211,238,0.4)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M135,72 L127,82" stroke="rgba(34,211,238,0.4)" strokeWidth="2" strokeLinecap="round" />
                  {/* Confident smirk */}
                  <path d="M114,92 Q123,94 129,88" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>
          )}

          {/* 7. HIGH-FIDELITY HAIRSTYLES */}
          <g>
            {/* Back Hair layer (renders behind head) */}
            {isFront && (c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-curly") && (
              <path
                d="M92,85 C92,130 80,180 84,200 C88,210 100,210 106,190 C110,160 120,130 120,85 Z"
                fill={activeHairHex}
              />
            )}
            {isFront && (c.hairStyle === "hair-long" || c.hairStyle === "hair-wavy" || c.hairStyle === "hair-curly") && (
              <path
                d="M148,85 C148,130 160,180 156,200 C152,210 140,210 134,190 C130,160 120,130 120,85 Z"
                fill={activeHairHex}
              />
            )}

            {/* Front Hair layer (with parallax) */}
            <g transform={`translate(${hairFrontX}, ${pitchY})`}>
              {/* Hair Short (Smart messy spikes) */}
              {c.hairStyle === "hair-short" && (
                <g>
                  {/* Main cap */}
                  <path d="M90,75 C90,45 150,45 150,75 C150,85 142,85 140,82 C135,74 130,76 120,70 C110,76 105,74 100,82 C98,85 90,85 90,75 Z" fill={activeHairHex} />
                  {/* Top spikes */}
                  <path d="M102,52 L112,42 L118,48 L128,38 L134,46 L144,40 L146,55" fill={activeHairHex} />
                  {/* Sideburns */}
                  <path d="M91,72 L93,88 L98,84 Z" fill={activeHairHex} />
                  <path d="M149,72 L147,88 L142,84 Z" fill={activeHairHex} />
                </g>
              )}

              {/* Hair Long (Detailed flowing locks) */}
              {c.hairStyle === "hair-long" && (
                <g>
                  <path d="M88,72 C88,40 152,40 152,72 C152,80 148,82 144,78 C135,68 130,70 120,64 C110,70 105,68 96,78 C92,82 88,80 88,72 Z" fill={activeHairHex} />
                  {/* Long side drapes */}
                  <path d="M88,72 C82,100 84,150 92,175 C94,180 98,180 98,172 C96,140 98,110 100,72 Z" fill={activeHairHex} />
                  <path d="M152,72 C158,100 156,150 148,175 C146,180 142,180 142,172 C144,140 142,110 140,72 Z" fill={activeHairHex} />
                </g>
              )}

              {/* Hair Wavy (Premium waving illustrated strands) */}
              {c.hairStyle === "hair-wavy" && (
                <g>
                  <path d="M88,70 C88,38 152,38 152,70 C152,80 146,80 142,75 Q132,62 120,62 Q108,62 98,75 C94,80 88,80 88,70 Z" fill={activeHairHex} />
                  <path d="M88,68 Q80,100 90,135 Q98,160 92,185 Q88,160 84,130 Z" fill={activeHairHex} />
                  <path d="M152,68 Q160,100 150,135 Q142,160 148,185 Q152,160 156,130 Z" fill={activeHairHex} />
                </g>
              )}

              {/* Hair Straight */}
              {c.hairStyle === "hair-straight" && (
                <g>
                  <path d="M90,72 C90,44 150,44 150,72 C150,82 144,82 142,78 C134,68 128,70 120,64 C112,70 106,68 98,78 C96,82 90,82 90,72 Z" fill={activeHairHex} />
                  <rect x="90" y="70" width="8" height="60" rx="3" fill={activeHairHex} />
                  <rect x="142" y="70" width="8" height="60" rx="3" fill={activeHairHex} />
                </g>
              )}

              {/* Highlight Streaks (Mechas Personalizadas) */}
              {highlightHex && (
                <g opacity="0.9">
                  {/* Highlights matching short spikes */}
                  {c.hairStyle === "hair-short" && (
                    <g>
                      <path d="M112,42 L118,48 L128,38" stroke={highlightHex} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M134,46 L144,40" stroke={highlightHex} strokeWidth="3" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  {/* Highlights on long hair locks */}
                  {c.hairStyle === "hair-long" && (
                    <g>
                      <path d="M84,110 Q86,140 90,165" stroke={highlightHex} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      <path d="M156,110 Q154,140 150,165" stroke={highlightHex} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  {/* Highlights on wavy curls */}
                  {c.hairStyle === "hair-wavy" && (
                    <g>
                      <path d="M84,110 Q94,135 88,160" stroke={highlightHex} strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M156,110 Q146,135 152,160" stroke={highlightHex} strokeWidth="4" fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  {/* Default simple top lock highlight */}
                  {c.hairStyle !== "hair-short" && c.hairStyle !== "hair-long" && c.hairStyle !== "hair-wavy" && (
                    <path d="M110,48 Q120,44 130,48" stroke={highlightHex} strokeWidth="4" fill="none" strokeLinecap="round" />
                  )}
                </g>
              )}
            </g>
          </g>

          {/* 8. HEADWEAR ACCESSORY (Graduation Cap / Wiser Crown) */}
          {isFront && (
            <g transform={`translate(${hairFrontX}, ${pitchY})`} filter="url(#soft-shadow)">
              {c.accessory === "acc-legendary-mortarboard" && (
                <g>
                  {/* Cylinder Base */}
                  <ellipse cx="120" cy="50" rx="22" ry="7" fill="#0F172A" />
                  <rect x="98" y="44" width="44" height="8" fill="#0F172A" />
                  {/* Diamond Flat Top Plate */}
                  <polygon points="120,32 155,42 120,52 85,42" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                  {/* Shiny Golden tassel */}
                  <path d="M120,42 L146,47 L148,60" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="148" cy="62" r="2.5" fill="#D97706" />
                </g>
              )}

              {c.accessory === "acc-knowledge-crown" && (
                <g>
                  {/* Golden Crown with Rubies and Sapphires */}
                  <path d="M96,52 L98,34 L108,44 L120,28 L132,44 L142,34 L144,52 Z" fill="url(#gold-emblem)" stroke="#B45309" strokeWidth="1.5" />
                  <circle cx="120" cy="42" r="3" fill="#DC2626" />
                  <circle cx="108" cy="46" r="2" fill="#2563EB" />
                  <circle cx="132" cy="46" r="2" fill="#2563EB" />
                </g>
              )}
            </g>
          )}

          {/* 9. HEADPHONES ACCESSORY */}
          {c.accessory === "acc-headphones" && isFront && (
            <g transform={`translate(${hairFrontX}, ${pitchY})`} filter="url(#soft-shadow)">
              {/* Left ear cup */}
              <rect x="86" y="66" width="10" height="26" rx="5" fill="#8B5CF6" />
              <rect x="90" y="71" width="4" height="16" rx="2" fill="#C084FC" />
              {/* Right ear cup */}
              <rect x="144" y="66" width="10" height="26" rx="5" fill="#8B5CF6" />
              <rect x="146" y="71" width="4" height="16" rx="2" fill="#C084FC" />
              {/* Headband bridge */}
              <path d="M92,68 C92,44 148,44 148,68" fill="none" stroke="#7C3AED" strokeWidth="4" />
            </g>
          )}

          {/* 10. BACK BACKPACK (Renders in front if facing back) */}
          {!isFront && c.accessory.includes("backpack") && (
            <g transform={`translate(${backpackX}, ${pitchY})`} filter="url(#soft-shadow)">
              {c.accessory === "acc-school-backpack" && (
                <rect x="90" y="120" width="60" height="70" rx="16" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
              )}
              {c.accessory === "acc-science-backpack" && (
                <g>
                  <rect x="94" y="115" width="52" height="75" rx="10" fill="#1F2937" />
                  <rect x="102" y="123" width="36" height="55" rx="8" fill="#34D399" opacity="0.9" />
                  <circle cx="120" cy="150" r="14" fill="#06B6D4" opacity="0.6" />
                </g>
              )}
              {c.accessory === "acc-college-backpack" && (
                <g>
                  <rect x="92" y="120" width="56" height="18" rx="4" fill="#DC2626" />
                  <rect x="94" y="138" width="52" height="18" rx="4" fill="#16A34A" />
                  <rect x="91" y="156" width="58" height="18" rx="4" fill="#2563EB" />
                </g>
              )}
            </g>
          )}
        </g>
      </svg>

      {/* Rotation Interface Controls Overlay */}
      <div className="absolute bottom-4 inset-x-2 flex justify-center gap-1.5 z-20">
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => (prev - 45) % 360);
          }}
          className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
          title="Girar Izquierda"
        >
          🔄
        </button>
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3.5 h-8 rounded-xl border flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition ${
            isRotating ? "bg-primary text-white border-primary" : "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
          }`}
        >
          {isRotating ? "Pausar" : "Auto Girar"}
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw((prev) => (prev + 45) % 360);
          }}
          className="size-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
          title="Girar Derecha"
        >
          🔄
        </button>
        <button
          onClick={() => {
            setIsRotating(false);
            setYaw(-20);
          }}
          className="px-2.5 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 font-bold text-xs text-white cursor-pointer shadow-sm active:scale-95 transition"
        >
          Reiniciar
        </button>
      </div>

      {/* Small drag instructions */}
      <span className="absolute top-2 right-2 text-[9px] font-medium tracking-wide text-slate-400 uppercase bg-slate-950/85 px-1.5 py-0.5 rounded shadow border border-slate-800/80">
        Arrastra para rotar
      </span>
    </div>
  );
}
