import React, { useState, useEffect } from "react";
import { Sparkles, Check, RefreshCw, User, BookOpen } from "lucide-react";

interface AvatarConfig {
  type: "human" | "object";
  gender: string;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  clothesColor: string;
  pantsColor: string;
  hasBackpack: boolean;
  hasGlasses: boolean;
  hasHat: boolean;
}

interface AvatarSelectorProps {
  onStartGame: (config: AvatarConfig) => void;
}

const SKIN_COLORS = ["#ffcc99", "#e0ac69", "#c58c85", "#8d5524", "#f1c27d", "#ffd1a4"];
const HAIR_COLORS = ["#000000", "#4a3728", "#b55229", "#f9a602", "#cccccc", "#1976d2"];
const CLOTHES_COLORS = ["#1976d2", "#e91e63", "#4caf50", "#ffeb3b", "#9c27b0", "#ff9800", "#00bcd4"];

const HUMAN_ROLES = [
  { id: "hombre", name: "Hombre" },
  { id: "mujer", name: "Mujer" },
  { id: "nino", name: "Niño" },
  { id: "nina", name: "Niña" },
  { id: "profesor", name: "Profesor" },
  { id: "cientifica", name: "Científica" },
  { id: "ingeniero", name: "Ingeniero" },
  { id: "arquitecta", name: "Arquitecta" },
  { id: "estudiante", name: "Estudiante" }
];

const OBJECT_ROLES = [
  { id: "libro", name: "Libro Educativo 📚" },
  { id: "lapiz", name: "Lápiz del Conocimiento ✏️" },
  { id: "robot", name: "Robot Programable 🤖" },
  { id: "computadora", name: "Computadora de Ciencia 💻" },
  { id: "microscopio", name: "Microscopio Óptico 🔬" },
  { id: "globo", name: "Globo Terráqueo 🌐" }
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onStartGame }) => {
  const [type, setType] = useState<"human" | "object">("human");
  const [gender, setGender] = useState("estudiante");
  const [skinColor, setSkinColor] = useState(SKIN_COLORS[0]);
  const [hairStyle, setHairStyle] = useState("corto");
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [clothesColor, setClothesColor] = useState(CLOTHES_COLORS[0]);
  const [pantsColor, setPantsColor] = useState("#37474f");
  const [hasBackpack, setHasBackpack] = useState(false);
  const [hasGlasses, setHasGlasses] = useState(false);
  const [hasHat, setHasHat] = useState(false);

  // Load configuration from localstorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mc_v2_avatar_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AvatarConfig;
        setType(parsed.type || "human");
        setGender(parsed.gender || "estudiante");
        setSkinColor(parsed.skinColor || SKIN_COLORS[0]);
        setHairStyle(parsed.hairStyle || "corto");
        setHairColor(parsed.hairColor || HAIR_COLORS[0]);
        setClothesColor(parsed.clothesColor || CLOTHES_COLORS[0]);
        setPantsColor(parsed.pantsColor || "#37474f");
        setHasBackpack(parsed.hasBackpack || false);
        setHasGlasses(parsed.hasGlasses || false);
        setHasHat(parsed.hasHat || false);
      } catch (e) {}
    }
  }, []);

  const handleStart = () => {
    const config: AvatarConfig = {
      type,
      gender,
      skinColor,
      hairStyle,
      hairColor,
      clothesColor,
      pantsColor,
      hasBackpack,
      hasGlasses,
      hasHat
    };
    // Save to localstorage
    localStorage.setItem("mc_v2_avatar_config", JSON.stringify(config));
    onStartGame(config);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl bg-slate-900/80 border border-[#143224] backdrop-blur rounded-3xl p-8 shadow-2xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: PREVIEW */}
        <div className="flex flex-col justify-between items-center bg-slate-950/60 rounded-2xl p-6 border border-slate-800">
          <div className="w-full text-center">
            <h2 className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider">
              Vista Previa 3D
            </h2>
            <p className="text-xs text-slate-400 mt-1">El modelo primitivo de tu avatar se armará en el juego.</p>
          </div>

          {/* Dummy visual preview of character */}
          <div className="w-48 h-64 bg-slate-900 border border-emerald-500/25 rounded-2xl flex flex-col justify-center items-center gap-4 relative overflow-hidden shadow-inner">
            {type === "human" ? (
              <div className="flex flex-col items-center">
                {/* Hair */}
                <div 
                  className="w-12 h-6 rounded-t-full" 
                  style={{ backgroundColor: hairColor, borderRadius: hairStyle === "largo" ? "20px 20px 0 0" : "15px 15px 0 0" }} 
                />
                {/* Head */}
                <div className="w-10 h-10 rounded-full mt-0.5 relative flex justify-center items-center" style={{ backgroundColor: skinColor }}>
                  {hasGlasses && <div className="absolute top-3 w-8 h-2 border-2 border-black rounded-full" />}
                  {/* Face details */}
                  <div className="flex gap-2.5 mt-1">
                    <div className="w-1 h-1 bg-black rounded-full" />
                    <div className="w-1 h-1 bg-black rounded-full" />
                  </div>
                </div>
                {/* Torso */}
                <div className="w-14 h-16 rounded-lg mt-1 relative flex justify-center items-center" style={{ backgroundColor: clothesColor }}>
                  {hasBackpack && <div className="absolute -left-2 w-3 h-10 bg-slate-800 rounded" />}
                  <span className="text-[10px] uppercase font-black text-slate-900/60">{gender.substring(0, 4)}</span>
                </div>
                {/* Legs */}
                <div className="flex gap-3.5 mt-0.5">
                  <div className="w-3.5 h-10 rounded-b" style={{ backgroundColor: pantsColor }} />
                  <div className="w-3.5 h-10 rounded-b" style={{ backgroundColor: pantsColor }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-6xl animate-bounce">
                  {gender === "libro" && "📚"}
                  {gender === "lapiz" && "✏️"}
                  {gender === "robot" && "🤖"}
                  {gender === "computadora" && "💻"}
                  {gender === "microscopio" && "🔬"}
                  {gender === "globo" && "🌐"}
                </span>
                <span className="text-xs uppercase font-extrabold text-slate-400 mt-2">{gender}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl cursor-pointer transition active:scale-95 shadow-xl shadow-emerald-500/10 border-none flex items-center justify-center gap-1.5"
          >
            <Sparkles className="size-4" /> ¡Entrar al Mundo Abierto!
          </button>
        </div>

        {/* RIGHT COLUMN: CONFIGURATION OPTIONS */}
        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <User className="size-5 text-emerald-400" /> Configura tu Avatar
            </h3>

            {/* Type tabs */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => { setType("human"); setGender("estudiante"); }}
                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex justify-center items-center gap-1.5 ${type === "human" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 hover:bg-slate-800 text-slate-400"}`}
              >
                <User className="size-4" /> Avatares Humanos
              </button>
              <button
                onClick={() => { setType("object"); setGender("libro"); }}
                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex justify-center items-center gap-1.5 ${type === "object" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 hover:bg-slate-800 text-slate-400"}`}
              >
                <BookOpen className="size-4" /> Objetos Educativos
              </button>
            </div>

            {/* Role/Model select */}
            <div className="mt-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Rol o Modelo</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {(type === "human" ? HUMAN_ROLES : OBJECT_ROLES).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setGender(r.id)}
                    className={`py-2.5 px-2 text-[10px] font-black rounded-lg border transition text-center truncate cursor-pointer ${gender === r.id ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 hover:bg-slate-800 text-slate-300"}`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Customization Details (Humans only) */}
            {type === "human" && (
              <div className="mt-4 space-y-3">
                {/* Hair styles */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Corte de Cabello</label>
                  <div className="flex gap-2">
                    {["corto", "largo", "birrete", "casco"].map(h => (
                      <button
                        key={h}
                        onClick={() => setHairStyle(h)}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition uppercase cursor-pointer ${hairStyle === h ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" : "border-slate-800 text-slate-400 hover:bg-slate-800"}`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Palette */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Tono de Piel</label>
                  <div className="flex gap-2">
                    {SKIN_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSkinColor(c)}
                        className="size-6 rounded-full border border-slate-700 transition cursor-pointer relative"
                        style={{ backgroundColor: c }}
                      >
                        {skinColor === c && <Check className="size-3 text-slate-900 absolute inset-0 m-auto font-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair color */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Color del Cabello</label>
                  <div className="flex gap-2">
                    {HAIR_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setHairColor(c)}
                        className="size-6 rounded-full border border-slate-700 transition cursor-pointer relative"
                        style={{ backgroundColor: c }}
                      >
                        {hairColor === c && <Check className="size-3 text-white absolute inset-0 m-auto font-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shirt color */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Color de Ropa</label>
                  <div className="flex gap-2">
                    {CLOTHES_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setClothesColor(c)}
                        className="size-6 rounded-full border border-slate-700 transition cursor-pointer relative"
                        style={{ backgroundColor: c }}
                      >
                        {clothesColor === c && <Check className="size-3 text-slate-900 absolute inset-0 m-auto font-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories checkboxes */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Accesorios</label>
                  <div className="flex gap-4 text-xs font-bold text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasBackpack} onChange={e => setHasBackpack(e.target.checked)} className="rounded border-slate-800 text-emerald-500 accent-emerald-500" />
                      <span>Mochila 🎒</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasGlasses} onChange={e => setHasGlasses(e.target.checked)} className="rounded border-slate-800 text-emerald-500 accent-emerald-500" />
                      <span>Gafas 👓</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasHat} onChange={e => setHasHat(e.target.checked)} className="rounded border-slate-800 text-emerald-500 accent-emerald-500" />
                      <span>Sombrero 🎩</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
