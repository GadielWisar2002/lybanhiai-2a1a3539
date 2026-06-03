import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Sparkles, Timer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/order-idea")({
  head: () => ({ meta: [{ title: "Ordena la Idea — Lybanhi" }] }),
  component: OrderIdeaGamePage,
});

interface IdeaItem {
  id: number;
  area: string;
  originalIdea: string;
  shuffledFragments: string[];
  career: string;
  careerDesc: string;
}

const IDEAS_DB: Record<string, IdeaItem[]> = {
  es: [
    {
      id: 1,
      area: "humanidades",
      originalIdea: "La sociología es la ciencia que estudia el comportamiento humano en sociedad",
      shuffledFragments: ["el comportamiento humano", "La sociología", "en sociedad", "es la ciencia", "que estudia"],
      career: "Sociología",
      careerDesc: "Examina cómo se organizan las sociedades, los movimientos culturales y las dinámicas de grupo.",
    },
    {
      id: 2,
      area: "tecnología",
      originalIdea: "La ciberseguridad protege los sistemas informáticos de ataques maliciosos externos",
      shuffledFragments: ["los sistemas informáticos", "de ataques maliciosos", "La ciberseguridad", "externos", "protege"],
      career: "Ingeniería en Ciberseguridad / Informática",
      careerDesc: "Asegura la confidencialidad, integridad y disponibilidad de la información digital crítica.",
    },
    {
      id: 3,
      area: "ciencias",
      originalIdea: "El método científico comprende la observación y experimentación sistemática",
      shuffledFragments: ["observación y experimentación", "El método científico", "sistemática", "comprende la"],
      career: "Ciencias Básicas / Investigación",
      careerDesc: "Diseña experimentos estructurados para comprobar hipótesis y ampliar el conocimiento humano.",
    },
  ],
  en: [
    {
      id: 1,
      area: "humanidades",
      originalIdea: "Sociology is the science that studies human behavior in society",
      shuffledFragments: ["studies human behavior", "Sociology is", "in society", "the science that"],
      career: "Sociology",
      careerDesc: "Examines how societies organize, cultural movements, and group dynamics.",
    }
  ]
};

function OrderIdeaGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (IDEAS_DB[i18n.language] ? i18n.language : "es") as keyof typeof IDEAS_DB;
  const list = IDEAS_DB[lang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fragments, setFragments] = useState<string[]>([]);
  const [orderedList, setOrderedList] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameStatus, setGameStatus] = useState<"playing" | "correct" | "timeout">("playing");
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const item = list[currentIndex % list.length];

  useEffect(() => {
    setFragments(item.shuffledFragments);
    setOrderedList([]);
    setTimeLeft(45);
    setGameStatus("playing");
  }, [currentIndex, lang]);

  // Timer loop (45s)
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

  const handleSelectFragment = (frag: string) => {
    if (gameStatus !== "playing") return;
    setOrderedList(prev => [...prev, frag]);
    setFragments(prev => prev.filter(f => f !== frag));
  };

  const handleRemoveOrdered = (frag: string) => {
    if (gameStatus !== "playing") return;
    setFragments(prev => [...prev, frag]);
    setOrderedList(prev => prev.filter(f => f !== frag));
  };

  const handleCheck = () => {
    const constructedIdea = orderedList.join(" ");
    if (constructedIdea === item.originalIdea) {
      setGameStatus("correct");
      setScore(s => s + 20);
      toast.success("¡Excelente! Has ordenado la idea correctamente 🎉");
      if (currentIndex === list.length - 1) {
        claimReward();
      }
    } else {
      toast.error("La idea armada es incorrecta. Inténtalo de nuevo.");
      // Return everything to shuffled list
      setFragments(item.shuffledFragments);
      setOrderedList([]);
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
    setGameStatus("playing");
    setTimeLeft(45);
    setCurrentIndex(prev => (prev + 1) % list.length);
  };

  const handleReset = () => {
    setGameStatus("playing");
    setTimeLeft(45);
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
        <h1 className="font-display text-lg font-bold">Ordena la Idea</h1>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>{score} pts</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        
        {/* Top Info Area */}
        <div className="w-full">
          <div className="flex justify-between text-xs font-bold text-[#8896B3] mb-2 uppercase">
            <span>Idea {currentIndex + 1} de {list.length}</span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <Timer className="size-4 animate-pulse" /> {timeLeft}s
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted/30 border border-[#1E2D5A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B6DE8] to-orange-400 transition-all duration-300"
              style={{ width: `${(timeLeft / 45) * 100}%` }}
            />
          </div>
        </div>

        {/* Scaffold Output Box */}
        <div className="my-6 bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-5 min-h-[120px] flex flex-wrap gap-2 items-center justify-center relative">
          <span className="absolute top-2 right-3 rounded-full bg-[#3B6DE8]/10 text-[#3B6DE8] border border-[#3B6DE8]/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider">
            {item.area}
          </span>
          {orderedList.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Toca o arrastra los fragmentos inferiores para armar la definición aquí...</p>
          ) : (
            orderedList.map((frag, idx) => (
              <button
                key={idx}
                onClick={() => handleRemoveOrdered(frag)}
                className="bg-[#1A2240] hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/50 rounded-xl px-3 py-1.5 text-xs text-white transition active:scale-95 cursor-pointer font-medium"
              >
                {frag}
              </button>
            ))
          )}
        </div>

        {/* Scaffold Options Box */}
        {gameStatus === "playing" && (
          <div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {fragments.map((frag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectFragment(frag)}
                  className="bg-[#1E2D5A] hover:bg-[#2D3F6B] border border-[#3B6DE8]/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 transition active:scale-95 cursor-pointer font-medium"
                >
                  {frag}
                </button>
              ))}
            </div>

            {fragments.length === 0 && (
              <button
                onClick={handleCheck}
                className="w-full h-11 bg-[#3B6DE8] hover:bg-[#2D5BE3] border-none rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white flex items-center justify-center gap-1.5"
              >
                <Sparkles className="size-4" /> Comprobar Idea
              </button>
            )}
          </div>
        )}

        {/* Outcome Career Card */}
        {gameStatus !== "playing" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A]/80 rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
            {gameStatus === "correct" ? (
              <div className="space-y-3">
                <span className="text-emerald-400 font-bold text-sm block">✓ ¡Correcto!</span>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{item.originalIdea}"
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  Disciplina Vinculada: <span className="text-[#3B6DE8] font-bold">{item.career}</span>
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.careerDesc}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white border-none"
                >
                  Siguiente Idea
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-amber-400 font-bold text-sm block">⏱ ¡Tiempo Agotado!</span>
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
