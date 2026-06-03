import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Sparkles, Timer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/complete-concept")({
  head: () => ({ meta: [{ title: "Completa el Concepto — Lybanhi" }] }),
  component: CompleteConceptGamePage,
});

interface ConceptItem {
  id: number;
  area: string;
  preText: string;
  postText: string;
  correctWord: string;
  options: string[];
  career: string;
  careerDesc: string;
}

const CONCEPTS_DB: Record<string, ConceptItem[]> = {
  es: [
    {
      id: 1,
      area: "ciencias",
      preText: "La",
      postText: "estudia la estructura y función de los genes a nivel molecular y su herencia.",
      correctWord: "genética",
      options: ["genética", "lingüística", "econometría", "robótica"],
      career: "Biología / Biotecnología",
      careerDesc: "Estudia los seres vivos a nivel genético para crear soluciones en salud, agricultura y alimentación.",
    },
    {
      id: 2,
      area: "tecnología",
      preText: "Un",
      postText: "es un conjunto de instrucciones ordenadas para resolver un problema o realizar una tarea.",
      correctWord: "algoritmo",
      options: ["algoritmo", "esquema", "contrato", "compilado"],
      career: "Ingeniería de Software / Computación",
      careerDesc: "Diseña lógica de computadoras y aplicaciones que procesan millones de datos por segundo.",
    },
    {
      id: 3,
      area: "humanidades",
      preText: "La",
      postText: "analiza las relaciones de producción, intercambio y distribución de la riqueza en la sociedad.",
      correctWord: "economía",
      options: ["economía", "psicología", "arquitectura", "biología"],
      career: "Economía / Finanzas",
      careerDesc: "Toma decisiones estratégicas para optimizar recursos en empresas, gobiernos y la vida diaria.",
    },
    {
      id: 4,
      area: "artes",
      preText: "La",
      postText: "es la disciplina que estudia la técnica de proyectar y construir espacios habitables.",
      correctWord: "arquitectura",
      options: ["arquitectura", "escultura", "pedagogía", "geología"],
      career: "Arquitectura / Urbanismo",
      careerDesc: "Diseña casas, edificios y ciudades equilibrando estética, funcionalidad y sustentabilidad.",
    },
  ],
  en: [
    {
      id: 1,
      area: "ciencias",
      preText: "The",
      postText: "studies the molecular structure, function, and inheritance of genes.",
      correctWord: "genetics",
      options: ["genetics", "linguistics", "econometrics", "robotics"],
      career: "Biology / Biotechnology",
      careerDesc: "Studies biological systems to develop healthcare and agricultural products.",
    }
  ]
};

function CompleteConceptGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (CONCEPTS_DB[i18n.language] ? i18n.language : "es") as keyof typeof CONCEPTS_DB;
  const list = CONCEPTS_DB[lang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState<"playing" | "correct" | "wrong" | "timeout">("playing");
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const item = list[currentIndex % list.length];

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

  const handleSelectOption = (word: string) => {
    if (gameStatus !== "playing") return;
    setSelectedWord(word);

    if (word === item.correctWord) {
      setGameStatus("correct");
      setScore(s => s + 10);
      toast.success("¡Excelente! Concepto completado correctamente 🎉");
      if (currentIndex === list.length - 1) {
        claimReward();
      }
    } else {
      setGameStatus("wrong");
      toast.error("Incorrecto. Intenta con otro concepto");
    }
  };

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

  const handleNext = () => {
    setSelectedWord(null);
    setGameStatus("playing");
    setTimeLeft(60);
    setCurrentIndex(prev => (prev + 1) % list.length);
  };

  const handleReset = () => {
    setSelectedWord(null);
    setGameStatus("playing");
    setTimeLeft(60);
    setCurrentIndex(0);
    setScore(0);
    setRewardClaimed(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Completa el Concepto</h1>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>{score} pts</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        
        {/* Top Progress bar and Timer */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-bold text-[#8896B3] mb-2 uppercase">
            <span>Concepto {currentIndex + 1} de {list.length}</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Timer className="size-4 animate-pulse" /> {timeLeft}s
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted/30 border border-[#1E2D5A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B6DE8] to-cyan-400 transition-all duration-300"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* Central Definition Card */}
        <div className="my-8 bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-6 relative">
          <span className="absolute top-3 right-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            {item.area}
          </span>

          <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-200">
            {item.preText}{" "}
            <span className={`inline-block border-b-2 px-6 py-0.5 mx-1 font-bold ${
              gameStatus === "correct" ? "border-emerald-400 text-emerald-400" :
              gameStatus === "wrong" ? "border-rose-400 text-rose-400" :
              "border-[#3B6DE8] text-slate-500"
            }`}>
              {selectedWord || "_________"}
            </span>{" "}
            {item.postText}
          </p>
        </div>

        {/* Options List */}
        {gameStatus === "playing" && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {item.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt)}
                className="h-14 bg-[#1A2240] hover:bg-[#243060] border border-[#2D3F6B] rounded-2xl font-semibold text-sm transition cursor-pointer flex items-center justify-center active:scale-95 text-white"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Result/Career Info Display */}
        {gameStatus !== "playing" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A]/80 rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
            {gameStatus === "correct" ? (
              <div className="space-y-3">
                <span className="text-emerald-400 font-bold text-sm block">✓ ¡Correcto!</span>
                <p className="text-sm font-semibold text-slate-300">
                  Carrera Vinculada: <span className="text-[#3B6DE8] font-bold">{item.career}</span>
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.careerDesc}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white border-none"
                >
                  Siguiente Concepto
                </button>
              </div>
            ) : gameStatus === "wrong" ? (
              <div className="space-y-3">
                <span className="text-rose-400 font-bold text-sm block">✗ Incorrecto</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esa palabra no pertenece a este concepto. ¡Inténtalo de nuevo!
                </p>
                <button
                  onClick={handleReset}
                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="size-3.5" /> Recomenzar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-amber-400 font-bold text-sm block">⏱ ¡Se agotó el tiempo!</span>
                <button
                  onClick={handleReset}
                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="size-3.5" /> Volver a Intentar
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
