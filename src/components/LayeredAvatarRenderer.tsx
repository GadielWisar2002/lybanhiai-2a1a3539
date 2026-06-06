import React, { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────
// LAYER ASSET MAPS  — maps config IDs → PNG paths
// ─────────────────────────────────────────────────────

const BASE_PATH = "/avatars";

const BODY_MAP: Record<string, string> = {
  boy: `${BASE_PATH}/base/body-male.png`,
  girl: `${BASE_PATH}/base/body-female.png`,
};

const HAIR_MAP: Record<string, string> = {
  "hair-short": `${BASE_PATH}/hair/hair-short-brown.png`,
  "hair-wavy": `${BASE_PATH}/hair/hair-long-wavy-pink.png`,
  "hair-straight": `${BASE_PATH}/hair/hair-short-brown.png`,
  "hair-bangs": `${BASE_PATH}/hair/hair-short-brown.png`,
  "hair-mohawk": `${BASE_PATH}/hair/hair-short-brown.png`,
  "hair-afro": `${BASE_PATH}/hair/hair-short-brown.png`,
  "hair-pigtails": `${BASE_PATH}/hair/hair-long-wavy-pink.png`,
  "hair-braids": `${BASE_PATH}/hair/hair-long-wavy-pink.png`,
};

const TOP_MAP: Record<string, string> = {
  "shirt-academic-jacket": `${BASE_PATH}/tops/top-varsity-jacket.png`,
  "shirt-basic-hoodie": `${BASE_PATH}/tops/top-white-hoodie.png`,
  "shirt-basic-tee": `${BASE_PATH}/tops/top-white-hoodie.png`,
  "shirt-lab-coat": `${BASE_PATH}/tops/top-white-hoodie.png`,
};

const BOTTOM_MAP: Record<string, string> = {
  "pants-basic-jeans": `${BASE_PATH}/bottoms/bottom-cargo-pants.png`,
  "pants-basic-skirt": `${BASE_PATH}/bottoms/bottom-plaid-skirt.png`,
};

const SHOES_MAP: Record<string, string> = {
  "shoes-basic-shoes": `${BASE_PATH}/shoes/shoes-hightop-blue.png`,
  "shoes-hightop": `${BASE_PATH}/shoes/shoes-hightop-blue.png`,
  "shoes-lowtop": `${BASE_PATH}/shoes/shoes-lowtop-white.png`,
};

// Full-character preview images (used as fallback / reference)
const PREVIEW_MAP: Record<string, string> = {
  boy: `${BASE_PATH}/avatar-male.png`,
  girl: `${BASE_PATH}/avatar-female.png`,
};

// ─────────────────────────────────────────────────────
// LAYER POSITION CONFIGS
// Each layer specifies: top%, left%, width%, height%
// relative to the main container (which holds the base body)
// ─────────────────────────────────────────────────────

interface LayerPosition {
  top: string;
  left: string;
  width: string;
  height: string;
}

// Positions calibrated so layers align over the A-pose base body
const LAYER_POSITIONS: Record<string, LayerPosition> = {
  body: { top: "0%", left: "5%", width: "90%", height: "100%" },
  hair: { top: "-1.5%", left: "5%", width: "90%", height: "52%" },
  top: { top: "34%", left: "5%", width: "90%", height: "38%" },
  bottom: { top: "54%", left: "5%", width: "90%", height: "32%" },
  shoes: { top: "78%", left: "5%", width: "90%", height: "22%" },
};

// ─────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────

interface AvatarConfig {
  skinColor?: string;
  hairStyle?: string;
  hairColor?: string;
  hairHighlight?: string;
  face?: string;
  shirt?: string;
  pants?: string;
  shoes?: string;
  accessory?: string;
  pet?: string;
  aura?: string;
  outfit?: string;
  gender?: string;
  bodyType?: string;
  zoom?: number;
  viewMode?: string;
}

// Helper function to remove black background from 3D rendered PNG layers client-side
function removeBlackBackground(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Loop through pixels and make black background transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate 2D pixel coordinates
          const pixelIndex = i / 4;
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);

          // Eliminated manual JS hair mask to avoid cutting off parts of the hair.
          // The background removal handles making the black background transparent.

          // Threshold for black background (RGB values close to 0)
          if (r < 18 && g < 18 && b < 18) {
            data[i + 3] = 0; // Set alpha to transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        resolve(src);
      }
    };
    img.onerror = () => {
      resolve(src);
    };
    img.src = src;
  });
}

interface LayeredAvatarRendererProps {
  config: AvatarConfig | null;
  autoRotate?: boolean;
  profileView?: boolean;
}

export function LayeredAvatarRenderer({
  config,
  autoRotate = false,
  profileView = false,
}: LayeredAvatarRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [processedLayers, setProcessedLayers] = useState<Record<string, string>>({});

  const c = {
    gender: config?.gender || "boy",
    hairStyle: config?.hairStyle || "hair-short",
    shirt: config?.shirt || "shirt-academic-jacket",
    pants: config?.pants || "pants-basic-jeans",
    shoes: config?.shoes || "shoes-basic-shoes",
    accessory: config?.accessory || "",
    aura: config?.aura || "",
    zoom: profileView ? 2.2 : (config?.zoom || 1.0),
    viewMode: profileView ? "expressions" : (config?.viewMode || "body"),
  };

  // Breathing animation
  useEffect(() => {
    if (c.viewMode !== "animation") return;
    const interval = setInterval(() => {
      setBreathPhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [c.viewMode]);

  // Fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Resolve image paths from config
  const bodyImg = BODY_MAP[c.gender] || BODY_MAP.boy;
  const hairImg = HAIR_MAP[c.hairStyle] || HAIR_MAP["hair-short"];
  const topImg = TOP_MAP[c.shirt] || TOP_MAP["shirt-academic-jacket"];
  const bottomImg = BOTTOM_MAP[c.pants] || BOTTOM_MAP["pants-basic-jeans"];
  const shoesImg = SHOES_MAP[c.shoes] || SHOES_MAP["shoes-basic-shoes"];

  // Process all layers to make black background transparent
  useEffect(() => {
    let active = true;
    const processAll = async () => {
      const keys = ["body", "bottom", "shoes", "top", "hair"];
      const urls: Record<string, string> = {
        body: bodyImg,
        bottom: bottomImg,
        shoes: shoesImg,
        top: topImg,
        hair: hairImg,
      };

      const results: Record<string, string> = {};
      await Promise.all(
        keys.map(async (key) => {
          const processed = await removeBlackBackground(urls[key]);
          results[key] = processed;
        })
      );

      if (active) {
        setProcessedLayers(results);
      }
    };

    processAll();
    return () => {
      active = false;
    };
  }, [bodyImg, bottomImg, shoesImg, topImg, hairImg]);

  const allProcessed = 
    processedLayers.body && 
    processedLayers.bottom && 
    processedLayers.shoes && 
    processedLayers.top && 
    processedLayers.hair;

  // Breathing offset
  const breathOffset =
    !profileView && c.viewMode === "animation"
      ? Math.sin((breathPhase * Math.PI) / 180) * 3
      : 0;

  // Accent color based on gender
  const accent = c.gender === "boy" ? "#3B6DE8" : "#E83B8E";

  // Head Group Layers (head of base body + hair layer)
  // Separamos exactamente en el cuello. Así la cabeza se mueve de forma independiente del torso.
  const headLayers = [
    { 
      id: "body_head", 
      src: processedLayers.body || bodyImg, 
      pos: LAYER_POSITIONS.body, 
      zIndex: 1, 
      clipPath: "inset(0% 0% 68% 0%)" // Mantiene el 32% superior (cabeza y cuello) para solapamiento
    },
    { 
      id: "hair", 
      src: processedLayers.hair || hairImg, 
      pos: LAYER_POSITIONS.hair, 
      zIndex: 2 
    },
  ];

  // Body Group Layers (torso downwards + clothes + shoes)
  // El torso comienza desde el 28% hacia abajo. Esto crea un solapamiento con la cabeza (28% a 32%) para evitar huecos.
  const bodyLayers = [
    { 
      id: "body_torso", 
      src: processedLayers.body || bodyImg, 
      pos: LAYER_POSITIONS.body, 
      zIndex: 1, 
      clipPath: "inset(28% 0% 0% 0%)" 
    },
    { 
      id: "bottom", 
      src: processedLayers.bottom || bottomImg, 
      pos: LAYER_POSITIONS.bottom, 
      zIndex: 2 
    },
    { 
      id: "shoes", 
      src: processedLayers.shoes || shoesImg, 
      pos: LAYER_POSITIONS.shoes, 
      zIndex: 3 
    },
    { 
      id: "top", 
      src: processedLayers.top || topImg, 
      pos: LAYER_POSITIONS.top, 
      zIndex: 4 
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center select-none w-full h-full overflow-hidden ${profileView ? "min-h-0" : "min-h-[360px]"}`}
      style={{
        opacity: loaded && allProcessed ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      {/* Hologram platform glow */}
      {!profileView && (
        <>
          <div
            className="absolute bottom-[4%] left-1/2 -translate-x-1/2"
            style={{
              width: "55%",
              height: "24px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${accent}40 0%, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
          <div
            className="absolute bottom-[4%] left-1/2 -translate-x-1/2"
            style={{
              width: "50%",
              height: "20px",
              borderRadius: "50%",
              border: `2px solid ${accent}90`,
              boxShadow: `0 0 12px ${accent}60`,
              background: "transparent",
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute bottom-[4.5%] left-1/2 -translate-x-1/2"
            style={{
              width: "32%",
              height: "12px",
              borderRadius: "50%",
              border: `1px solid ${accent}50`,
              background: "transparent",
            }}
          />
        </>
      )}

      {/* Floating particles */}
      {!profileView && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { x: "20%", y: "80%", size: 3, delay: 0 },
            { x: "75%", y: "85%", size: 2, delay: 0.5 },
            { x: "15%", y: "70%", size: 4, delay: 1.2 },
            { x: "80%", y: "65%", size: 2.5, delay: 0.8 },
            { x: "35%", y: "90%", size: 2, delay: 1.5 },
            { x: "65%", y: "75%", size: 3, delay: 0.3 },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                background: accent,
                opacity: 0.4,
                animation: `float-particle ${3 + i * 0.4}s ease-in-out ${p.delay}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Aura effects */}
      {!profileView && c.aura === "aura-golden" && (
        <div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "70%",
            height: "70%",
            borderRadius: "50%",
            border: "2px dashed #FFD70060",
            boxShadow: "0 0 30px #FFD70020, inset 0 0 30px #FFD70010",
            animation: "spin 8s linear infinite",
          }}
        />
      )}
      {!profileView && c.aura === "aura-math" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[75%] h-[75%] rounded-full border border-dashed"
            style={{
              borderColor: "#00B4FF30",
              animation: "spin 12s linear infinite reverse",
            }}
          />
          {["E=mc²", "π≈3.14", "∫f(x)dx", "x²+y²=r²"].map((txt, i) => (
            <span
              key={i}
              className="absolute text-[9px] font-mono font-bold pointer-events-none"
              style={{
                color: "#00B4FF60",
                top: `${20 + i * 18}%`,
                left: i % 2 === 0 ? "8%" : "72%",
              }}
            >
              {txt}
            </span>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          AVATAR LAYER STACK
          ═══════════════════════════════════════════ */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `scale(${c.zoom}) translateY(${profileView ? "28%" : breathOffset + "px"})`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <div
          className="relative"
          style={{
            width: profileView ? "100%" : "min(80%, 320px)",
            height: profileView ? "100%" : "min(90%, 400px)",
          }}
        >
          {/* BODY & CLOTHES GROUP (torso, pants, shoes, top) */}
          {bodyLayers.map((layer) => (
            <img
              key={layer.id}
              src={layer.src}
              alt={`Avatar layer: ${layer.id}`}
              draggable={false}
              className="absolute transition-all duration-300"
              style={{
                top: layer.pos.top,
                left: layer.pos.left,
                width: layer.pos.width,
                height: layer.pos.height,
                zIndex: layer.zIndex,
                objectFit: "contain",
                mixBlendMode: "normal",
                clipPath: layer.clipPath,
                // Highlight when hovered
                filter:
                  hoveredLayer === (layer.id === "body_torso" ? "body" : layer.id)
                    ? `drop-shadow(0 0 8px ${accent})`
                    : "none",
              }}
              onMouseEnter={() => setHoveredLayer(layer.id === "body_torso" ? "body" : layer.id)}
              onMouseLeave={() => setHoveredLayer(null)}
            />
          ))}

          {/* HEAD & HAIR GROUP (head base, hair) */}
          <div 
            className="absolute inset-0"
            style={{ 
              zIndex: 5,
              // Grouped head Bobbing/Translation relative to body
              transform: `translateY(0px)`, 
              transition: "transform 0.2s ease-out" 
            }}
          >
            {headLayers.map((layer) => (
              <img
                key={layer.id}
                src={layer.src}
                alt={`Avatar layer: ${layer.id}`}
                draggable={false}
                className="absolute transition-all duration-300"
                style={{
                  top: layer.pos.top,
                  left: layer.pos.left,
                  width: layer.pos.width,
                  height: layer.pos.height,
                  zIndex: layer.zIndex,
                  objectFit: "contain",
                  mixBlendMode: "normal",
                  clipPath: layer.clipPath,
                  // Highlight when hovered
                  filter:
                    hoveredLayer === (layer.id === "body_head" ? "body" : layer.id)
                      ? `drop-shadow(0 0 8px ${accent})`
                      : "none",
                }}
                onMouseEnter={() => setHoveredLayer(layer.id === "body_head" ? "body" : layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
              />
            ))}
          </div>

          {/* Shadow under character */}
          <div
            className="absolute"
            style={{
              bottom: "-2%",
              left: "25%",
              width: "50%",
              height: "8%",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.45)",
              filter: "blur(6px)",
              zIndex: 0,
            }}
          />
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-30px) scale(0.5); opacity: 0; }
        }
        @keyframes spin {
          from { transform: translate(-50%, 0) rotate(0deg); }
          to { transform: translate(-50%, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
