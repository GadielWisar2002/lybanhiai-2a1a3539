import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, HelpCircle, Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/hangman")({
  head: () => ({ meta: [{ title: "Ahorcado Universitario — Lybanhi" }] }),
  component: HangmanGamePage,
});

interface HangmanWord {
  word: string;
  category: string;
  clue1: string;
  clue2: string;
  definition: string;
  career: string;
}

const HANGMAN_DB: Record<string, HangmanWord[]> = {
  es: [
    {
      word: "TERMOMETRO",
      category: "Medicina / Ciencias de la Salud",
      clue1: "Instrumento usado para medir la temperatura corporal.",
      clue2: "Tiene un bulbo sensor y una escala graduada.",
      definition: "Dispositivo médico para evaluar estados febriles en pacientes.",
      career: "Medicina / Enfermería",
    },
    {
      word: "ALGORITMO",
      category: "Ingeniería / Tecnología",
      clue1: "Conjunto secuencial de operaciones para resolver un problema.",
      clue2: "Se escribe en lenguajes como Python o C++.",
      definition: "Lógica estructurada fundamental para el desarrollo de software y computación.",
      career: "Ingeniería de Sistemas",
    },
    {
      word: "JURISPRUDENCIA",
      category: "Derecho / Ciencias Sociales",
      clue1: "Conjunto de sentencias y resoluciones judiciales emitidas por tribunales.",
      clue2: "Sirve de base para interpretar y aplicar las leyes.",
      definition: "Interpretación jurídica obligatoria creada por órganos judiciales.",
      career: "Derecho / Abogacía",
    },
    {
      word: "ESTRUCTURA",
      category: "Arquitectura / Construcción",
      clue1: "Distribución y orden de las partes que componen un edificio o edificación.",
      clue2: "Soporta el peso total y las fuerzas ambientales.",
      definition: "Esqueleto de soporte diseñado con vigas y columnas.",
      career: "Ingeniería Civil / Arquitectura",
    },
  ],
  en: [
    {
      word: "ALGORITHM",
      category: "Engineering / Tech",
      clue1: "A step-by-step set of operations to solve a problem.",
      clue2: "Written in languages like Python or JS.",
      definition: "Structured logic fundamental to software development and computer science.",
      career: "Computer Science",
    }
  ]
};

function HangmanGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (HANGMAN_DB[i18n.language] ? i18n.language : "es") as keyof typeof HANGMAN_DB;
  const wordList = HANGMAN_DB[lang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [score, setScore] = useState(0);

  const currentItem = wordList[currentIndex % wordList.length];

  useEffect(() => {
    setTargetWord(currentItem.word.toUpperCase());
    setGuessedLetters([]);
    setErrors(0);
    setGameStatus("playing");
  }, [currentIndex, lang]);

  const maxErrors = 6;

  // Mood determination based on error count
  // 0-1 errors: Confiado 😊
  // 2-3 errors: Nervioso 😟
  // 4-5 errors: Preocupado 😰
  // 6 errors: Derrotado 😵
  const getMoodEmoji = () => {
    if (errors <= 1) return { emoji: "😊", text: "Confiado", color: "text-emerald-400" };
    if (errors <= 3) return { emoji: "😟", text: "Nervioso", color: "text-amber-400 animate-pulse" };
    if (errors <= 5) return { emoji: "😰", text: "Preocupado", color: "text-rose-400 animate-bounce" };
    return { emoji: "😵", text: "Derrotado", color: "text-slate-500" };
  };

  const currentMood = getMoodEmoji();

  const handleLetterClick = (letter: string) => {
    if (gameStatus !== "playing" || guessedLetters.includes(letter)) return;

    const newGuesses = [...guessedLetters, letter];
    setGuessedLetters(newGuesses);

    if (!targetWord.includes(letter)) {
      const newErrors = errors + 1;
      setErrors(newErrors);
      if (newErrors >= maxErrors) {
        setGameStatus("lost");
        toast.error("¡Oh no! El personaje ha caído. Intenta de nuevo.");
      }
    } else {
      // Check if all letters guessed
      const isWon = targetWord.split("").every(char => newGuesses.includes(char) || char === " ");
      if (isWon) {
        setGameStatus("won");
        setScore(s => s + 15);
        toast.success("¡Excelente trabajo! Adivinaste la palabra 🎉");
        if (currentIndex === wordList.length - 1) {
          claimReward();
        }
      }
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

  const handleReset = () => {
    setCurrentIndex(0);
    setScore(0);
    setRewardClaimed(false);
    setTargetWord(wordList[0].word.toUpperCase());
    setGuessedLetters([]);
    setErrors(0);
    setGameStatus("playing");
  };

  const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Ahorcado Universitario</h1>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-yellow-400" />
          <span>{score} pts</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        
        {/* Top Info Area */}
        <div className="flex items-center justify-between text-xs font-bold text-[#8896B3] mb-4">
          <span className="uppercase tracking-wider">Categoría: {currentItem.category}</span>
          <div className="flex gap-1 items-center text-rose-500">
            {Array.from({ length: maxErrors }).map((_, idx) => (
              <Heart key={idx} className={`size-4 ${idx < maxErrors - errors ? "fill-rose-500 stroke-none" : "stroke-slate-600 fill-none"}`} />
            ))}
          </div>
        </div>

        {/* Mascot / Mood Visualizer */}
        <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-5 mb-6 flex items-center justify-between text-left relative">
          <div className="flex items-center gap-3">
            <span className={`text-4xl ${currentMood.color}`}>{currentMood.emoji}</span>
            <div>
              <h4 className="text-sm font-bold text-slate-200">Estado de Ánimo</h4>
              <p className={`text-xs font-bold ${currentMood.color}`}>{currentMood.text}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Palabra</p>
            <p className="text-xs font-bold text-white font-mono leading-none">{currentIndex + 1} / {wordList.length}</p>
          </div>
        </div>

        {/* Draggable/Visual Dashed Word Slots */}
        <div className="flex flex-wrap justify-center gap-1.5 my-6">
          {targetWord.split("").map((char, index) => {
            const isGuessed = guessedLetters.includes(char) || char === " ";
            return (
              <div
                key={index}
                className="w-8 h-10 border-b-4 border-slate-600 flex items-end justify-center text-xl font-bold font-mono pb-1"
                style={{
                  borderBottomColor: isGuessed ? "#3B6DE8" : "#2F3C64",
                  color: isGuessed ? "#FFFFFF" : "transparent"
                }}
              >
                {isGuessed ? char : "?"}
              </div>
            );
          })}
        </div>

        {/* Clues Dashboard */}
        <div className="bg-[#111827]/60 border border-[#1E2D5A] rounded-xl p-3 text-left mb-6">
          <p className="text-[10px] font-bold text-[#8896B3] uppercase tracking-wider mb-1 flex items-center gap-1">
            <HelpCircle className="size-3 text-cyan-400" /> Pistas
          </p>
          <p className="text-xs text-slate-300">1. {currentItem.clue1}</p>
          {errors >= 3 && (
            <p className="text-xs text-[#3B6DE8] font-bold mt-1.5 animate-in fade-in duration-300">
              2. {currentItem.clue2}
            </p>
          )}
        </div>

        {/* Letter Selection Grid */}
        {gameStatus === "playing" && (
          <div className="grid grid-cols-7 gap-1.5 mb-6">
            {ALPHABET.map((letter) => {
              const isUsed = guessedLetters.includes(letter);
              const isCorrect = isUsed && targetWord.includes(letter);
              const bg = isCorrect
                ? "bg-emerald-600 text-white cursor-not-allowed"
                : isUsed
                ? "bg-slate-900 text-slate-600 cursor-not-allowed opacity-50"
                : "bg-slate-800 text-white hover:bg-slate-700 cursor-pointer";

              return (
                <button
                  key={letter}
                  disabled={isUsed}
                  onClick={() => handleLetterClick(letter)}
                  className={`h-9 text-[11px] font-bold rounded-lg border-none transition flex items-center justify-center ${bg}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Outcome Career Card */}
        {gameStatus !== "playing" && (
          <div className="bg-[#0D1535] border border-[#1E2D5A]/80 rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
            {gameStatus === "won" ? (
              <div className="space-y-3">
                <span className="text-emerald-400 font-bold text-sm block">✓ ¡Palabra Encontrada!</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Definición: <span className="text-slate-400">{currentItem.definition}</span>
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  Carrera Vinculada: <span className="text-[#3B6DE8] font-bold">{currentItem.career}</span>
                </p>
                <button
                  onClick={handleNext}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer text-white border-none"
                >
                  Siguiente Palabra
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-rose-400 font-bold text-sm block">✗ Fin del Juego</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La palabra correcta era: <strong className="text-white">{targetWord}</strong>
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
