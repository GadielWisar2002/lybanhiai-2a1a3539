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
  const [activeTab, setActiveTab] = useState<"sheet" | "front" | "side" | "back">("sheet");
  const [isRotating, setIsRotating] = useState(autoRotate);

  const gender = config?.gender || "girl";
  const isGirl = gender === "girl";

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "sheet") return "front";
        if (prev === "front") return "side";
        if (prev === "side") return "back";
        return "sheet";
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Load the actual premium 3D AAA character sheets that look exactly like the images
  const imageUrl = isGirl ? "/avatar_female_3d_sheet.png" : "/avatar_male_3d_sheet.png";

  // Calculate the left offset for the sliding turnaround view window
  // Width of the sliding window is 260px, height is 350px.
  // The image is scaled to 300% width to focus on each of the 3 views (Front, Side, Back).
  const getSlidingStyle = (): React.CSSProperties => {
    if (activeTab === "sheet") {
      return {
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        objectFit: "contain",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      };
    }

    let translateX = "0%";
    if (isGirl) {
      // Female: [Front, Side, Back]
      if (activeTab === "front") translateX = "0%";
      if (activeTab === "side") translateX = "-33.33%";
      if (activeTab === "back") translateX = "-66.66%";
    } else {
      // Male: [Side, Front, Back]
      if (activeTab === "side") translateX = "0%";
      if (activeTab === "front") translateX = "-33.33%";
      if (activeTab === "back") translateX = "-66.66%";
    }

    return {
      width: "300%",
      height: "100%",
      transform: `translateX(${translateX}) scale(${scale * 1.05})`,
      transformOrigin: "left center",
      objectFit: "cover",
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-[370px] mx-auto overflow-hidden rounded-3xl bg-[#040814] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.22)]">
      
      {/* Sci-Fi Blueprint Tech Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#040814_95%),linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:100%_100%,20px_20px] opacity-15 pointer-events-none z-0" />
      
      {/* Glowing Neon Laser Scanline Animation */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 shadow-[0_0_10px_#22d3ee] animate-[bounce_5s_infinite] pointer-events-none z-20" />

      {/* Main Viewport Container */}
      <div className="relative w-full h-[310px] flex items-center justify-start overflow-hidden z-10">
        <img
          src={imageUrl}
          alt={`3D Character AAA ${gender}`}
          style={getSlidingStyle()}
          className="select-none pointer-events-none"
        />

        {/* Dynamic Glowing Sci-Fi Vignette & Tech HUD Overlay */}
        <div className="absolute inset-0 border-[2px] border-cyan-500/20 pointer-events-none rounded-3xl">
          {/* Top Info Marks */}
          <div className="absolute top-3 left-4 flex gap-1.5 items-center">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[8px] font-black text-cyan-400 tracking-widest font-mono uppercase">
              STUDIO_RENDER: AAA_ACTIVE
            </span>
          </div>

          <div className="absolute top-3 right-4 font-mono text-[7px] font-bold text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/40">
            RIG: SKELETON_OK
          </div>

          {/* Bottom Telemetry Spec Panel */}
          <div className="absolute bottom-3 left-4 right-4 bg-[#080c14]/95 border border-cyan-500/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between pointer-events-auto backdrop-blur-md shadow-2xl">
            <div className="flex flex-col text-left">
              <span className="text-[9.5px] font-black text-white leading-none font-mono tracking-wider">
                {isGirl ? "ESTUDIANTE FEMENINA (3D)" : "ESTUDIANTE MASCULINO (3D)"}
              </span>
              <span className="text-[7.5px] font-bold text-cyan-400 font-mono mt-1 tracking-widest uppercase">
                {isGirl ? "Capucha Varsity • Falda Escolar" : "Chaqueta Varsity • Jeans Denim"}
              </span>
            </div>
            <div className="flex flex-col text-right font-mono">
              <span className="text-[8px] font-black text-emerald-400 leading-none">
                MATERIALES PBR 4K
              </span>
              <span className="text-[6.5px] font-bold text-slate-500 mt-1">
                Pixar / Unreal Engine Style
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector Controls Overlay */}
      <div className="absolute bottom-16 inset-x-4 flex justify-between items-center z-20">
        <div className="flex bg-[#080c14]/90 border border-slate-850 p-0.5 rounded-xl backdrop-blur-md shadow-lg">
          {(["sheet", "front", "side", "back"] as const).map((view) => (
            <button
              key={view}
              onClick={() => {
                setIsRotating(false);
                setActiveTab(view);
              }}
              className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase transition-all cursor-pointer font-mono ${
                activeTab === view
                  ? "bg-cyan-500 text-[#040814] shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {view === "sheet" ? "360° Ficha" : view}
            </button>
          ))}
        </div>

        {/* Auto Rotate Button */}
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase cursor-pointer shadow-lg transition duration-200 font-mono ${
            isRotating 
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-cyan-500/20" 
              : "bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800"
          }`}
        >
          {isRotating ? "Pausar" : "Auto Girar"}
        </button>
      </div>

    </div>
  );
}
