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
  const [yaw, setYaw] = useState(0);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [activeTab, setActiveTab] = useState<"sheet" | "front" | "side" | "back">("sheet");

  const gender = config?.gender || "girl";
  const isGirl = gender === "girl";

  useEffect(() => {
    setIsRotating(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      // Rotate through views
      setActiveTab((prev) => {
        if (prev === "sheet") return "front";
        if (prev === "front") return "side";
        if (prev === "side") return "back";
        return "sheet";
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Load the premium 3D AAA turnaround sheet
  const imageUrl = isGirl ? "/avatar_female_3d_sheet.png" : "/avatar_male_3d_sheet.png";

  // Determine transform based on view tab selection
  // This lets the user zoom and pan into the Front, Side, and Back views of the AAA 3D model!
  const getTransform = () => {
    if (activeTab === "sheet") return "scale(1.0)";
    if (isGirl) {
      // Female: [Front, Side, Back]
      if (activeTab === "front") return "scale(2.3) translate(28%, 5%)";
      if (activeTab === "side") return "scale(2.3) translate(0%, 5%)";
      if (activeTab === "back") return "scale(2.3) translate(-28%, 5%)";
    } else {
      // Male: [Side, Front, Back]
      if (activeTab === "side") return "scale(2.3) translate(28%, 5%)";
      if (activeTab === "front") return "scale(2.3) translate(0%, 5%)";
      if (activeTab === "back") return "scale(2.3) translate(-28%, 5%)";
    }
    return "scale(1.0)";
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-[370px] mx-auto overflow-hidden rounded-3xl bg-[#030712] border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      
      {/* Blueprint Grid Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#030712_95%),linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:100%_100%,20px_20px] opacity-10 pointer-events-none z-0" />
      
      {/* Sci-Fi Scanner Line Effect */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 shadow-[0_0_8px_#22d3ee] animate-[bounce_5s_infinite] pointer-events-none z-20" />

      {/* Main Turnaround Sheet Viewport Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden z-10">
        <img
          src={imageUrl}
          alt={`3D Character Turnaround ${gender}`}
          className="w-full h-full object-cover transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
          style={{
            transform: `${getTransform()} scale(${scale})`,
          }}
        />

        {/* Dynamic Glowing Sci-Fi Vignette and HUD Overlay */}
        <div className="absolute inset-0 border-[3px] border-cyan-500/10 pointer-events-none rounded-3xl">
          {/* Top Tech Marks */}
          <div className="absolute top-3 left-4 flex gap-1 items-center">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[7.5px] font-black text-cyan-400 tracking-wider font-mono uppercase">
              STATUS: GAME_READY
            </span>
          </div>

          <div className="absolute top-3 right-4 flex gap-1.5 items-center font-mono text-[7px] font-bold text-slate-500">
            <span>FN_3D: turn_v2.0</span>
          </div>

          {/* Bottom Hologram Specs Overlay */}
          <div className="absolute bottom-16 left-4 right-4 bg-[#090d16]/90 border border-cyan-500/20 px-3 py-2 rounded-xl flex items-center justify-between pointer-events-auto backdrop-blur-md shadow-lg">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-white leading-none font-mono">
                {isGirl ? "ESTUDIANTE (FEMENINA)" : "ESTUDIANTE (MASCULINO)"}
              </span>
              <span className="text-[7.5px] font-bold text-cyan-400 font-mono mt-0.5 uppercase">
                {isGirl ? "CAPUCHA VARSITY • FALDA PLISADA" : "CHAQUETA VARSITY • JEANS SLIM"}
              </span>
            </div>
            <div className="flex flex-col text-right font-mono">
              <span className="text-[8px] font-black text-slate-400 leading-none">
                POLY: ~24.5K
              </span>
              <span className="text-[7px] font-bold text-emerald-400 mt-0.5">
                Unity / Unreal Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic View Selector Controls */}
      <div className="absolute bottom-3 inset-x-4 flex justify-between items-center z-20">
        <div className="flex bg-[#090d16]/90 border border-slate-800 p-0.5 rounded-xl backdrop-blur-md shadow-lg">
          {(["sheet", "front", "side", "back"] as const).map((view) => (
            <button
              key={view}
              onClick={() => {
                setIsRotating(false);
                setActiveTab(view);
              }}
              className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase transition-all cursor-pointer font-mono ${
                activeTab === view
                  ? "bg-cyan-500 text-[#030712] shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {view === "sheet" ? "360° Sheet" : view}
            </button>
          ))}
        </div>

        {/* Auto Rotate controls */}
        <button
          onClick={() => setIsRotating((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl border flex items-center justify-center text-[8.5px] font-black tracking-wider uppercase cursor-pointer shadow-lg transition duration-200 font-mono ${
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
