import React from "react";
import { Compass, MapPin } from "lucide-react";

interface MinimapProps {
  playerX: number;
  playerZ: number;
  cameraYaw: number;
  activeBiome: string;
}

const ACADEMIES = [
  { name: "C. Universitario", x: 0, z: 0, color: "bg-emerald-500" },
  { name: "Valle Matemático", x: -600, z: 600, color: "bg-green-600" },
  { name: "M. Científicas", x: -600, z: -600, color: "bg-blue-400" },
  { name: "C. Tecnológica", x: 600, z: -600, color: "bg-yellow-400" },
  { name: "D. Histórico", x: 600, z: 600, color: "bg-orange-500" },
  { name: "Lago Central", x: 0, z: -200, color: "bg-cyan-400" }
];

export const Minimap: React.FC<MinimapProps> = ({ playerX, playerZ, cameraYaw, activeBiome }) => {
  // Convert 3D world coordinates (e.g. -1000 to 1000) to relative percentages (e.g. 0% to 100%) for mapping
  const worldToMinimap = (coord: number) => {
    const minVal = -1000;
    const maxVal = 1000;
    const pct = ((coord - minVal) / (maxVal - minVal)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const pxPct = worldToMinimap(playerX);
  const pzPct = worldToMinimap(playerZ);

  // Rotation of player needle based on camera rotation Y (radians)
  const rotationDegrees = (cameraYaw * 180) / Math.PI;

  return (
    <div className="bg-slate-900/90 border border-[#143224] backdrop-blur p-4 rounded-3xl w-60 shadow-2xl flex flex-col items-center gap-3">
      <div className="flex justify-between items-center w-full border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
        <span className="flex items-center gap-1">
          <Compass className="size-4 text-emerald-400" />Radar Campus
        </span>
        <span className="text-[10px] text-slate-400 font-black">Coords: ({playerX}, {playerZ})</span>
      </div>

      {/* Stylized Minimap Grid Panel */}
      <div className="w-44 h-44 bg-slate-950 border-2 border-emerald-500/20 rounded-full relative overflow-hidden flex justify-center items-center shadow-inner">
        {/* Radar crosshairs grid lines */}
        <div className="absolute inset-0 border border-emerald-500/5 rounded-full m-8" />
        <div className="absolute inset-0 border border-emerald-500/5 rounded-full m-16" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-500/10 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-500/10 -translate-y-1/2" />

        {/* Dynamic Biome Centers Map pins */}
        {ACADEMIES.map(ac => {
          const axPct = worldToMinimap(ac.x);
          const azPct = worldToMinimap(ac.z);
          return (
            <div
              key={ac.name}
              className={`absolute size-2 rounded-full ${ac.color} group cursor-help`}
              style={{
                left: `${axPct}%`,
                bottom: `${azPct}%`,
                transform: "translate(-50%, 50%)"
              }}
              title={ac.name}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                {ac.name}
              </div>
            </div>
          );
        })}

        {/* Player Position Needle Marker */}
        <div
          className="absolute size-3 bg-rose-500 border border-white rounded-full flex justify-center items-center z-10 shadow-md"
          style={{
            left: `${pxPct}%`,
            bottom: `${pzPct}%`,
            transform: "translate(-50%, 50%)"
          }}
        >
          {/* Arrow pointing to orientation */}
          <div
            className="w-1.5 h-3 bg-rose-500 rounded-t-full -translate-y-0.5 border-t border-white"
            style={{
              transform: `rotate(${rotationDegrees}deg)`
            }}
          />
        </div>
      </div>

      <div className="text-[10px] text-center w-full uppercase font-black text-slate-400 bg-slate-950/40 py-1 rounded-lg border border-slate-950">
        Zona: <span className="text-emerald-400 font-extrabold">{activeBiome}</span>
      </div>
    </div>
  );
};
