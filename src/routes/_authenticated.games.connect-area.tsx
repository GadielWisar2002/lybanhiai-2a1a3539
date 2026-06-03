import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Timer, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/connect-area")({
  head: () => ({ meta: [{ title: "Conecta tu Área — Lybanhi" }] }),
  component: ConnectAreaGamePage,
});

interface MatchPair {
  left: string;
  right: string;
  career: string;
  desc: string;
}

const PAIRS_DB: Record<string, Record<string, MatchPair[]>> = {
  es: {
    tools: [
      { left: "Escalpelo", right: "Medicina", career: "Medicina / Cirugía", desc: "Instrumento en forma de cuchillo pequeño utilizado para procedimientos quirúrgicos y disecciones." },
      { left: "Algoritmo", right: "Computación", career: "Ingeniería de Sistemas", desc: "Conjunto lógico de operaciones para procesamiento de datos y desarrollo de aplicaciones informáticas." },
      { left: "Contrato", right: "Derecho", career: "Derecho / Ciencias Políticas", desc: "Acuerdo legal voluntario formulado por escrito que establece derechos y obligaciones vinculantes." },
      { left: "Vernier", right: "Mecánica", career: "Ingeniería Mecánica", desc: "Calibre de precisión deslizante para medir diámetros internos, externos y profundidades." },
    ],
    concepts: [
      { left: "Fotosíntesis", right: "Biología", career: "Biología / Botánica", desc: "Proceso químico en plantas que convierte luz solar y CO2 en oxígeno y carbohidratos." },
      { left: "PIB", right: "Economía", career: "Economía / Finanzas", desc: "Producto Interno Bruto: valor monetario total de los bienes y servicios producidos por un país." },
      { left: "Leyes Newton", right: "Física", career: "Física / Astronomía", desc: "Tres principios físicos fundamentales que describen la relación entre fuerzas y movimiento corporal." },
    ]
  },
  en: {
    tools: [
      { left: "Scalpel", right: "Medicine", career: "Medicine", desc: "A small and extremely sharp bladed instrument used for surgery and anatomical dissection." },
      { left: "Algorithm", right: "Computing", career: "Computer Science", desc: "A finite sequence of rigorous instructions used to solve class problems or perform computation." }
    ]
  }
};

function ConnectAreaGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (PAIRS_DB[i18n.language] ? i18n.language : "es") as keyof typeof PAIRS_DB;
  const currentDb = PAIRS_DB[lang];

  const [mode, setMode] = useState<"tools" | "concepts">("tools");
  const [leftList, setLeftList] = useState<string[]>([]);
  const [rightList, setRightList] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [glossary, setGlossary] = useState<MatchPair[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "timeout">("playing");
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const activePairs = currentDb[mode] || [];

  // Shuffle lists on load or mode switch
  useEffect(() => {
    const lefts = activePairs.map(p => p.left).sort(() => Math.random() - 0.5);
    const rights = activePairs.map(p => p.right).sort(() => Math.random() - 0.5);
    setLeftList(lefts);
    setRightList(rights);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches({});
    setTimeLeft(60);
    setGameStatus("playing");
  }, [mode, lang]);

  // Timer loop
  useEffect(() => {
    if (gameStatus !== "playing") return;
    if (timeLeft <= 0) {
      setGameStatus("timeout");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStatus]);

  // Connection evaluation logic
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const pair = activePairs.find(p => p.left === selectedLeft && p.right === selectedRight);
      if (pair) {
        setMatches(prev => ({ ...prev, [selectedLeft]: selectedRight }));
        setGlossary(prev => [...prev, pair]);
        setScore(s => s + 15);
        toast.success(`¡Conexión correcta! (${selectedLeft} ↔ ${selectedRight})`);
        
        // Remove from list
        setLeftList(p => p.filter(x => x !== selectedLeft));
        setRightList(p => p.filter(x => x !== selectedRight));

        // Check victory
        if (Object.keys(matches).length + 1 === activePairs.length) {
          setGameStatus("won");
          claimReward();
        }
      } else {
        // Penalty 5 seconds
        setTimeLeft(p => Math.max(0, p - 5));
        toast.error("Error. Penalización de 5 segundos ⏱");
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [selectedLeft, selectedRight]);

  const claimReward = async () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    try {
      await rewardCoins({ data: { coins: 5 } });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("+5 Sombreritos ganados! 🎓");
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setLeftList(activePairs.map(p => p.left).sort(() => Math.random() - 0.5));
    setRightList(activePairs.map(p => p.right).sort(() => Math.random() - 0.5));
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatches({});
    setGlossary([]);
    setTimeLeft(60);
    setGameStatus("playing");
    setScore(0);
    setRewardClaimed(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Conecta tu Área</h1>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>{score} pts</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        
        {/* Top bar controls */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-3">
            {/* Mode switch */}
            <div className="flex bg-[#0D1535] border border-[#1E2D5A] p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => setMode("tools")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border-none cursor-pointer ${
                  mode === "tools" ? "bg-white text-[#080D24]" : "text-[#8896B3]"
                }`}
              >
                Herramientas
              </button>
              <button
                onClick={() => setMode("concepts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border-none cursor-pointer ${
                  mode === "concepts" ? "bg-white text-[#080D24]" : "text-[#8896B3]"
                }`}
              >
                Conceptos
              </button>
            </div>
            <span className="flex items-center gap-1 text-cyan-400 font-bold text-xs">
              <Timer className="size-4 animate-pulse" /> {timeLeft}s
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted/30 border border-[#1E2D5A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B6DE8] to-cyan-400 transition-all duration-300"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* Pairing columns */}
        {gameStatus === "playing" && (
          <div className="grid grid-cols-2 gap-6 my-8">
            {/* Left Column */}
            <div className="flex flex-col gap-3.5">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left pl-2">Ítem / Herramienta</h4>
              {leftList.map((frag) => (
                <button
                  key={frag}
                  onClick={() => setSelectedLeft(frag)}
                  className="h-14 bg-[#0D1535] hover:bg-[#1A2240] border rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center p-3 text-white active:scale-95"
                  style={{
                    borderColor: selectedLeft === frag ? "#3B6DE8" : "#1E2D5A",
                    boxShadow: selectedLeft === frag ? "0 0 10px #3B6DE860" : "none"
                  }}
                >
                  {frag}
                </button>
              ))}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3.5">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left pl-2">Área / Carrera</h4>
              {rightList.map((frag) => (
                <button
                  key={frag}
                  onClick={() => setSelectedRight(frag)}
                  className="h-14 bg-[#0D1535] hover:bg-[#1A2240] border rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center p-3 text-white active:scale-95"
                  style={{
                    borderColor: selectedRight === frag ? "#3B6DE8" : "#1E2D5A",
                    boxShadow: selectedRight === frag ? "0 0 10px #3B6DE860" : "none"
                  }}
                >
                  {frag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outcome & Glossary Display */}
        {gameStatus !== "playing" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A]/80 rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
            {gameStatus === "won" ? (
              <div className="space-y-4">
                <span className="text-emerald-400 font-bold text-sm block">✓ ¡Pares Conectados!</span>
                
                {/* Glossary list */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  <span className="text-[10px] font-bold text-[#8896B3] uppercase tracking-wider block">Glosario de la partida:</span>
                  {glossary.map((g, idx) => (
                    <div key={idx} className="border-b border-[#1E2D5A] pb-2 last:border-none">
                      <span className="text-xs font-bold text-white block">{g.left} ↔ {g.right}</span>
                      <span className="text-[10px] text-[#3B6DE8] font-bold block">Carrera: {g.career}</span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{g.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white border-none"
                >
                  Jugar de Nuevo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-amber-400 font-bold text-sm block">⏱ ¡Tiempo Agotado!</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No lograste conectar todos los pares a tiempo. ¡Inténtalo de nuevo!
                </p>
                <button
                  onClick={handleReset}
                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="size-3.5" /> Reintentar
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </>
  );
}
