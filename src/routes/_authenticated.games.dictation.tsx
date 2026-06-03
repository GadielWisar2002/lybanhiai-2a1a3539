import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Volume2, HelpCircle, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/dictation")({
  head: () => ({ meta: [{ title: "Dictado Académico con IA — Lybanhi" }] }),
  component: DictationGamePage,
});

interface DictationWord {
  word: string;
  langCode: string;
  category: string;
  rule: string; // Spelling rule explanation
}

const DICTATION_DB: Record<string, DictationWord[]> = {
  es: [
    { word: "BIOLOGÍA", langCode: "es-ES", category: "Ciencias de la Salud", rule: "Se escribe con 'B' (prefijo bio- que significa vida) y lleva tilde en la 'í' por hiato de vocal abierta/cerrada." },
    { word: "PSICOLOGÍA", langCode: "es-ES", category: "Humanidades / Ciencias Sociales", rule: "Comienza con la secuencia clásica 'PS-' (del griego psykhé). La 'P' inicial es muda en la pronunciación corriente pero obligatoria en la escritura estándar." },
    { word: "GENÉTICA", langCode: "es-ES", category: "Ciencias", rule: "Se escribe con 'G' porque los derivados de 'gene' o 'gen' mantienen la raíz. Lleva tilde en la 'é' por ser esdrújula." },
    { word: "SOFTWARE", langCode: "es-ES", category: "Tecnología", rule: "Es un extranjerismo adaptado del inglés. Se escribe con 'S' y doble 'V' ('W')." },
  ],
  en: [
    { word: "PSYCHOLOGY", langCode: "en-US", category: "Humanities", rule: "Starts with a silent 'P'. The suffix is spelled '-ology'." }
  ],
  fr: [
    { word: "PSYCHOLOGIE", langCode: "fr-FR", category: "Humanités", rule: "Commence par 'PS' avec un 'P' muet. S'écrit avec 'ch' pour le son classique." }
  ]
};

function DictationGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (DICTATION_DB[i18n.language] ? i18n.language : "es") as keyof typeof DICTATION_DB;
  const wordList = DICTATION_DB[lang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [listenCount, setListenCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [history, setHistory] = useState<Record<string, number>>({}); // Word -> stars (0-5)
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const currentWordData = wordList[currentIndex % wordList.length];

  useEffect(() => {
    setInputText("");
    setListenCount(0);
    setGameStatus("playing");
  }, [currentIndex, lang]);

  // Audio speech synthesis utilizing Web API
  const handlePlayAudio = () => {
    if (listenCount >= 3) {
      toast.error("Has alcanzado el límite de 3 reproducciones de audio para esta palabra");
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel previous utterances
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentWordData.word.toLowerCase());
      utterance.lang = currentWordData.langCode;
      utterance.rate = 0.82; // Slightly slower for clear dictation
      
      window.speechSynthesis.speak(utterance);
      setListenCount(p => p + 1);
    } else {
      toast.error("Tu navegador no soporta síntesis de voz");
    }
  };

  const handleCheck = () => {
    if (gameStatus !== "playing") return;
    if (!inputText.trim()) {
      toast.error("Por favor escribe la palabra dictada");
      return;
    }

    const cleanInput = inputText.trim().toUpperCase();
    const isCorrect = cleanInput === currentWordData.word.toUpperCase();

    if (isCorrect) {
      setGameStatus("correct");
      setScore(s => s + 20);
      toast.success("¡Excelente! Ortografía perfecta 🎉");
      
      // Increase word mastery rating (stars)
      setHistory(prev => ({
        ...prev,
        [currentWordData.word]: Math.min(5, (prev[currentWordData.word] || 0) + 1)
      }));

      if (currentIndex === wordList.length - 1) {
        claimReward();
      }
    } else {
      setGameStatus("wrong");
      toast.error("Error ortográfico detectado.");
      
      // Decrease word mastery rating (stars)
      setHistory(prev => ({
        ...prev,
        [currentWordData.word]: Math.max(0, (prev[currentWordData.word] || 0) - 1)
      }));
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
    setCurrentIndex(prev => (prev + 1) % wordList.length);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Dictado con IA</h1>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>{score} pts</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        
        {/* Top Progress info */}
        <div className="flex items-center justify-between text-xs font-bold text-[#8896B3] mb-4">
          <span className="uppercase tracking-wider">Área: {currentWordData.category}</span>
          <span className="font-mono">{currentIndex + 1} de {wordList.length}</span>
        </div>

        {/* Audio Player Panel */}
        <div className="my-6 bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-6 flex flex-col items-center justify-center relative">
          <button
            onClick={handlePlayAudio}
            disabled={listenCount >= 3}
            className="w-20 h-20 bg-[#3B6DE8]/10 hover:bg-[#3B6DE8]/20 text-[#3B6DE8] border-2 border-[#3B6DE8] rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mb-3"
          >
            <Volume2 className="w-10 h-10" />
          </button>
          
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Escuchas: {listenCount} / 3
          </span>
        </div>

        {/* Answer Input Box */}
        {gameStatus === "playing" && (
          <div className="space-y-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe la palabra que escuchaste..."
              className="w-full h-12 bg-[#0D1535] border border-[#1E2D5A] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#3B6DE8] text-center"
            />
            <button
              onClick={handleCheck}
              className="w-full h-11 bg-[#3B6DE8] hover:bg-[#2D5BE3] border-none rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white flex items-center justify-center gap-1.5"
            >
              <Sparkles className="size-4" /> Comprobar Ortografía
            </button>
          </div>
        )}

        {/* Orthography AI Feedback */}
        {gameStatus !== "playing" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A]/80 rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
            {gameStatus === "correct" ? (
              <div className="space-y-3">
                <span className="text-emerald-400 font-bold text-sm block">✓ ¡Correcto!</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dominas la ortografía de esta palabra académica. ¡Sigue así!
                </p>
                <button
                  onClick={handleNext}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white border-none"
                >
                  Siguiente Dictado
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <span className="text-rose-400 font-bold text-sm block">✗ Error de Ortografía</span>
                <p className="text-xs text-slate-300">
                  La palabra correcta es: <strong className="text-white">{currentWordData.word}</strong>
                </p>
                
                {/* AI direct rule feedback */}
                <div className="bg-[#111827]/80 border border-[#1E2D5A] p-3 rounded-xl">
                  <span className="text-[9px] text-[#8896B3] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <HelpCircle className="size-3 text-rose-400" /> Explicación de la Regla:
                  </span>
                  <p className="text-xs text-[#B0BEDD] leading-relaxed">
                    {currentWordData.rule}
                  </p>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spaced repetition history list with 5-star ratings */}
        <div className="mt-8 border-t border-[#1E2D5A] pt-4 text-left">
          <span className="text-[10px] text-[#8896B3] font-bold uppercase tracking-wider block mb-3">Historial de Dominio Ortográfico:</span>
          {Object.keys(history).length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">Resuelve dictados para ver tu historial de dominio aquí...</p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {Object.entries(history).map(([w, stars]) => (
                <div key={w} className="flex justify-between items-center bg-[#0D1535] p-2.5 rounded-xl border border-[#1E2D5A]/40">
                  <span className="text-xs font-bold text-slate-200">{w}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`size-3.5 ${idx < stars ? "fill-yellow-400 stroke-none" : "stroke-slate-600 fill-none"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </>
  );
}
