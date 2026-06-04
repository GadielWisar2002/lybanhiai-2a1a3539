import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Landmark, Library, Play, ShieldAlert, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getRandomQuestion, type Question } from "@/lib/question-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export const Route = createFileRoute("/_authenticated/games/ciudad-conocimiento")({
  head: () => ({ meta: [{ title: "Ciudad del Conocimiento — Lybanhi" }] }),
  component: CiudadConocimientoGame,
});

interface BuildItem {
  type: string;
  name: string;
  emoji: string;
  cost: number;
  intellectRate: number; // generation rate per 5s
  subject: "math" | "physics" | "chemistry" | "biology" | "programming";
}

const BUILDINGS_SHOP: BuildItem[] = [
  { type: "math_dept", name: "Departamento de Matemáticas", emoji: "📐", cost: 40, intellectRate: 5, subject: "math" },
  { type: "physics_lab", name: "Laboratorio de Física", emoji: "⚡", cost: 70, intellectRate: 12, subject: "physics" },
  { type: "bio_green", name: "Invernadero de Biología", emoji: "🧬", cost: 120, intellectRate: 25, subject: "biology" },
  { type: "comp_ctr", name: "Centro de Cómputo", emoji: "💻", cost: 180, intellectRate: 45, subject: "programming" },
];

function CiudadConocimientoGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  // Resources state
  const [intellect, setIntellect] = useState(100);
  
  // Grid layout (3x3 = 9 cells). Each cell: null or { type, level }
  const [grid, setGrid] = useState<( { type: string; name: string; emoji: string; level: number; subject: string; intellectRate: number } | null )[]>(
    new Array(9).fill(null)
  );

  const [selectedShopItem, setSelectedShopItem] = useState<BuildItem | null>(null);
  
  // Quiz upgrade state
  const [activeUpgradeCellIdx, setActiveUpgradeCellIdx] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  const rewardMutation = useMutation({
    mutationFn: (coins: number) => rewardCoins({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Resource generation ticks (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      let earned = 0;
      grid.forEach(cell => {
        if (cell) {
          earned += cell.intellectRate * cell.level;
        }
      });
      if (earned > 0) {
        setIntellect(prev => prev + earned);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [grid]);

  const handleBuildCell = (cellIdx: number) => {
    if (!selectedShopItem) {
      toast.error("Selecciona un edificio de la tienda primero.");
      return;
    }
    if (grid[cellIdx] !== null) {
      toast.error("Este solar ya está ocupado.");
      return;
    }
    if (intellect < selectedShopItem.cost) {
      toast.error("No tienes suficientes puntos de Intelecto.");
      return;
    }

    setIntellect(prev => prev - selectedShopItem.cost);
    setGrid(prev => {
      const copy = [...prev];
      copy[cellIdx] = {
        type: selectedShopItem.type,
        name: selectedShopItem.name,
        emoji: selectedShopItem.emoji,
        level: 1,
        subject: selectedShopItem.subject,
        intellectRate: selectedShopItem.intellectRate,
      };
      return copy;
    });
    setSelectedShopItem(null);
    toast.success("¡Edificio construido con éxito!");
  };

  const handleStartUpgrade = (cellIdx: number) => {
    const cell = grid[cellIdx];
    if (!cell) return;

    setActiveUpgradeCellIdx(cellIdx);
    setSelectedAns(null);
    setQuestionStartTime(Date.now());

    // Load question related to building subject
    const q = getRandomQuestion({ subject: cell.subject as any });
    setCurrentQuestion(q);
  };

  const handleSubmitAnswer = (idx: number) => {
    if (!currentQuestion || activeUpgradeCellIdx === null) return;
    setSelectedAns(idx);
    const correct = currentQuestion.type === "multiple-choice" ? currentQuestion.correctIndex === idx : false;
    const timeTaken = Date.now() - questionStartTime;

    analyticsEngine.trackAnswer(
      currentQuestion.subject,
      currentQuestion.topic,
      correct,
      timeTaken,
      currentQuestion.id
    );

    setTimeout(() => {
      if (correct) {
        setGrid(prev => {
          const copy = [...prev];
          const cell = copy[activeUpgradeCellIdx];
          if (cell) {
            copy[activeUpgradeCellIdx] = {
              ...cell,
              level: cell.level + 1,
            };
          }
          return copy;
        });
        toast.success("¡Excelente! Edificio mejorado al siguiente nivel (Producción multiplicada).");
      } else {
        toast.error("Respuesta incorrecta. La mejora del edificio falló.");
      }
      setActiveUpgradeCellIdx(null);
      setCurrentQuestion(null);
    }, 1500);
  };

  const handleStudyLibrary = () => {
    // Mini study session: answer 1 question to get +30 Intellect
    const q = getRandomQuestion({});
    if (!q) return;

    // We can simulate an instant quick quiz reward
    const solveSuccess = Math.random() > 0.3;
    if (solveSuccess) {
      setIntellect(prev => prev + 30);
      toast.success("Estudiaste en la biblioteca. ¡Ganaste +30 de Intelecto!");
    } else {
      toast.error("Te distrajiste en la biblioteca. Inténtalo más tarde.");
    }
  };

  const handleConvertIntellect = () => {
    if (intellect < 200) {
      toast.error("Necesitas al menos 200 puntos de Intelecto para canjear.");
      return;
    }
    setIntellect(prev => prev - 200);
    rewardMutation.mutate(2);
    toast.success("¡Canje exitoso! Cambiaste 200 de Intelecto por +2 Sombreritos.");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Ciudad del Conocimiento</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Trophy className="size-4" />
          <span>{intellect} Intelecto</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-24 text-white min-h-[calc(100vh-64px)] bg-[#080D24]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Builder Grid */}
          <div className="lg:col-span-2 bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-black text-lg text-primary flex items-center gap-2">
                <Landmark className="size-5" /> Plano del Campus Universitario
              </h3>
              <button
                onClick={handleConvertIntellect}
                disabled={intellect < 200}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl cursor-pointer border-none transition disabled:opacity-50"
              >
                Canjear: 200 Int. ➔ 2 🎓
              </button>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-4 aspect-square max-w-[400px] mx-auto">
              {grid.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (cell) handleStartUpgrade(idx);
                    else handleBuildCell(idx);
                  }}
                  className={`rounded-2xl border transition flex flex-col justify-center items-center text-center p-3 cursor-pointer ${
                    cell
                      ? "bg-primary/10 border-primary text-white hover:bg-primary/20"
                      : selectedShopItem
                      ? "bg-slate-800/40 border-dashed border-primary/40 hover:bg-primary/15 hover:border-primary text-slate-400"
                      : "bg-[#17224D]/40 border-dashed border-[#1E2D5A] text-slate-500 hover:bg-[#17224D]/60"
                  }`}
                >
                  {cell ? (
                    <>
                      <span className="text-3xl select-none">{cell.emoji}</span>
                      <span className="text-[10px] font-bold mt-1 truncate w-full">{cell.name}</span>
                      <span className="text-[8px] px-1 rounded-full bg-emerald-400/20 text-emerald-400 mt-1 uppercase">Lvl {cell.level}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">+</span>
                      <span className="text-[9px] mt-0.5">Vacío</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Shop & Library */}
          <div className="space-y-6">
            {/* Shop */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 space-y-4">
              <h3 className="font-display font-bold text-sm text-[#8896B3] border-b border-[#1E2D5A] pb-2">Tienda de Facultades</h3>
              <div className="space-y-3">
                {BUILDINGS_SHOP.map(item => {
                  const isSelected = selectedShopItem?.type === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setSelectedShopItem(isSelected ? null : item)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-[#17224D] border-[#3B6DE8]/10 text-white hover:border-primary/50"
                      }`}
                    >
                      <div className="flex gap-2.5 items-center">
                        <span className="text-2xl select-none">{item.emoji}</span>
                        <div>
                          <h4 className="font-bold text-xs">{item.name}</h4>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Genera: +{item.intellectRate} Int. / 5s</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[#1E2D5A] px-2 py-1 rounded-lg text-slate-300">{item.cost} Int.</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Library quick study */}
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-3xl p-5 space-y-3">
              <h4 className="font-display font-bold text-xs text-[#8896B3] flex items-center gap-1.5">
                <Library className="size-4" /> Biblioteca del Campus
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                ¿Te quedaste sin Intelecto para construir? Estudia conceptos rápidos para recargar tus puntos de Intelecto.
              </p>
              <button
                onClick={handleStudyLibrary}
                className="w-full h-10 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] text-xs font-bold rounded-xl cursor-pointer transition active:scale-95"
              >
                Estudiar en Biblioteca (+30 Int.)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Verification Quiz Modal */}
      {currentQuestion && activeUpgradeCellIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#1E2D5A] bg-[#0D1535] p-6 shadow-elegant space-y-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              Validación de Mejora: {grid[activeUpgradeCellIdx]?.name}
            </span>
            <p className="text-sm font-bold text-slate-200">{currentQuestion.prompt}</p>

            {currentQuestion.type === "multiple-choice" && (
              <div className="grid gap-3 pt-3 text-left">
                {currentQuestion.options.map((option, idx) => {
                  let btnStyle = "border-border bg-card text-foreground hover:bg-muted/40";
                  if (selectedAns !== null) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = "border-emerald-500 bg-emerald-600/20 text-emerald-400";
                    } else if (idx === selectedAns) {
                      btnStyle = "border-red-500 bg-red-600/20 text-red-400";
                    } else {
                      btnStyle = "opacity-40 border-border bg-card";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAns !== null}
                      onClick={() => handleSubmitAnswer(idx)}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold transition active:scale-98 cursor-pointer ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
