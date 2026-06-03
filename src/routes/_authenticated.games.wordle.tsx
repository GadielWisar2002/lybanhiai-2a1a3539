import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy, Share2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rewardGameCoins } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/games/wordle")({
  head: () => ({ meta: [{ title: "Wordle de Carreras — Lybanhi" }] }),
  component: WordleGamePage,
});

interface WordItem {
  word: string;
  career: string;
  description: string;
}

const WORDS_DB: Record<string, WordItem[]> = {
  es: [
    { word: "FISICA", career: "Física", description: "Estudia las propiedades del espacio, tiempo, materia y energía y sus interacciones." },
    { word: "DERECHO", career: "Derecho", description: "Estudia el conjunto de principios y normas que regulan la convivencia humana y la justicia." },
    { word: "DISENO", career: "Diseño Gráfico / Industrial", description: "Crea soluciones visuales y de usabilidad para comunicar ideas, productos y marcas." },
    { word: "BIOLOGIA", career: "Biología / Biotecnología", description: "Estudia la vida, los organismos y su evolución, genética y relación con el medio ambiente." },
    { word: "MEDICINA", career: "Medicina", description: "Se dedica al cuidado de la salud, prevención, diagnóstico y tratamiento de enfermedades." },
    { word: "QUIMICA", career: "Química", description: "Estudia la composición, estructura y propiedades de la materia y los cambios que experimenta." },
    { word: "HISTORIA", career: "Historia", description: "Analiza y narra los sucesos del pasado de la humanidad para comprender el presente." },
    { word: "SISTEMAS", career: "Ingeniería de Sistemas / Software", description: "Desarrolla, analiza y mantiene software y sistemas informáticos integrales." },
  ],
  en: [
    { word: "PHYSICS", career: "Physics", description: "Studies the properties of space, time, matter, and energy and their interactions." },
    { word: "LAW", career: "Law", description: "Studies the set of principles and norms regulating human cohabitation and justice." },
    { word: "DESIGN", career: "Graphic / Industrial Design", description: "Creates visual and usability solutions to communicate ideas, products, and brands." },
    { word: "BIOLOGY", career: "Biology", description: "Studies life, organisms, evolution, genetics, and relationship with the environment." },
  ],
  fr: [
    { word: "PHYSIQ", career: "Physique", description: "Étudie les propriétés de l'espace, du temps, de la matière et de l'énergie." },
    { word: "DROIT", career: "Droit", description: "Étudie l'ensemble des règles et des normes régissant la vie en société." },
    { word: "DESSIN", career: "Design Graphique", description: "Crée des solutions visuelles pour communiquer des idées ou des marques." },
    { word: "BIOLOG", career: "Biologie", description: "Étudie les organismes vivants et leurs relations avec leur environnement." },
  ]
};

function WordleGamePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const rewardCoins = useServerFn(rewardGameCoins);

  const lang = (WORDS_DB[i18n.language] ? i18n.language : "es") as keyof typeof WORDS_DB;
  const wordList = WORDS_DB[lang];

  // Pick word of the day based on date
  const [wordData, setWordData] = useState<WordItem>(wordList[0]);
  const [targetWord, setTargetWord] = useState("");

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [streak, setStreak] = useState(3); // Mock racha

  useEffect(() => {
    const day = new Date().getDate();
    const index = day % wordList.length;
    const selected = wordList[index];
    setWordData(selected);
    setTargetWord(selected.word.toUpperCase());
  }, [lang]);

  const maxAttempts = 6;

  const handleKeyPress = (key: string) => {
    if (gameStatus !== "playing") return;

    if (key === "ENTER") {
      if (currentGuess.length !== targetWord.length) {
        toast.error(`La palabra debe tener ${targetWord.length} letras`);
        return;
      }
      const newGuesses = [...guesses, currentGuess.toUpperCase()];
      setGuesses(newGuesses);
      setCurrentGuess("");

      if (currentGuess.toUpperCase() === targetWord) {
        setGameStatus("won");
        toast.success("¡Excelente! Adivinaste la palabra 🎉");
        claimReward();
      } else if (newGuesses.length >= maxAttempts) {
        setGameStatus("lost");
        toast.error(`Fin de los intentos. La palabra era: ${targetWord}`);
      }
    } else if (key === "BACK") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < targetWord.length && /^[a-zA-ZñÑ]$/.test(key)) {
      setCurrentGuess(prev => prev + key.toUpperCase());
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

  const getLetterStatus = (letter: string, index: number, word: string) => {
    const targetLetter = targetWord[index];
    if (letter === targetLetter) return "correct";
    if (targetWord.includes(letter)) return "present";
    return "absent";
  };

  const getKeyboardStatus = () => {
    const status: Record<string, "correct" | "present" | "absent"> = {};
    guesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        const targetChar = targetWord[i];
        if (char === targetChar) {
          status[char] = "correct";
        } else if (targetWord.includes(char) && status[char] !== "correct") {
          status[char] = "present";
        } else if (!targetWord.includes(char)) {
          status[char] = "absent";
        }
      }
    });
    return status;
  };

  const keyStatus = getKeyboardStatus();

  const handleShare = () => {
    const scoreStr = gameStatus === "won" ? `${guesses.length}/6` : "X/6";
    const text = `Adiviné el Wordle de Carreras en Lybanhi ${scoreStr}! 🎓\n\nPrueba tus conocimientos de áreas universitarias hoy!`;
    navigator.clipboard.writeText(text);
    toast.success("¡Resultado copiado al portapapeles! 📲");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#080D24]/90 backdrop-blur-xl border-b border-[#1E2D5A] px-6 py-4 flex items-center justify-between text-white">
        <button onClick={() => navigate({ to: "/games" })} className="text-[#8896B3] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-none">
          <ArrowLeft className="size-5" /> Atrás
        </button>
        <h1 className="font-display text-lg font-bold">Wordle de Carreras</h1>
        <div className="flex items-center gap-1.5 text-orange-400 font-bold text-sm">
          🔥 {streak} días de racha
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-6 pb-24 text-center text-white flex flex-col justify-between min-h-[calc(100vh-64px)] bg-[#080D24]">
        <div>
          {/* Grid of attempts */}
          <div className="grid gap-2 mb-6 justify-center">
            {Array.from({ length: maxAttempts }).map((_, rIdx) => {
              const guess = guesses[rIdx] || (rIdx === guesses.length ? currentGuess : "");
              return (
                <div key={rIdx} className="flex gap-2 justify-center">
                  {Array.from({ length: targetWord.length || 6 }).map((_, cIdx) => {
                    const char = guess[cIdx] || "";
                    let bgClass = "bg-[#0D1535] border-[#1E2D5A]";
                    if (rIdx < guesses.length) {
                      const status = getLetterStatus(char, cIdx, guesses[rIdx]);
                      if (status === "correct") bgClass = "bg-emerald-600 border-emerald-500 text-white font-black";
                      else if (status === "present") bgClass = "bg-amber-600 border-amber-500 text-white font-black";
                      else bgClass = "bg-slate-700 border-slate-600 text-slate-400";
                    } else if (char) {
                      bgClass = "bg-[#1A2240] border-[#3B6DE8] text-white font-bold animate-pulse";
                    }

                    return (
                      <div
                        key={cIdx}
                        className={`size-12 rounded-xl border-2 flex items-center justify-center text-lg font-display uppercase leading-none transition-all duration-300 ${bgClass}`}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Outcome Career Card */}
          {gameStatus !== "playing" && (
            <div className="bg-[#0D1535] border border-[#1E2D5A] rounded-2xl p-5 mb-6 text-left animate-in fade-in duration-300">
              <h3 className="font-display font-bold text-sm text-[#3B6DE8] flex items-center gap-1.5">
                <Trophy className="size-4 text-amber-400 animate-pulse" />
                <span>¿Sabías qué?</span>
              </h3>
              <p className="mt-2 text-lg font-black text-white leading-tight">
                La palabra era: <span className="text-emerald-400">{targetWord}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                Carrera: <span className="text-[#3B6DE8]">{wordData.career}</span>
              </p>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {wordData.description}
              </p>
              
              <button
                onClick={handleShare}
                className="mt-4 w-full h-10 bg-[#1E3A8A] hover:bg-[#2D5BE3] border border-[#3B6DE8] rounded-xl font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="size-3.5" /> Compartir Resultado
              </button>
            </div>
          )}
        </div>

        {/* Custom On-screen Keyboard */}
        <div className="w-full">
          {["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"].map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5 mb-2">
              {rIdx === 2 && (
                <button
                  onClick={() => handleKeyPress("ENTER")}
                  className="px-2 h-11 text-[10px] font-bold rounded-lg bg-slate-800 text-white flex items-center justify-center cursor-pointer hover:bg-slate-700"
                >
                  ENTER
                </button>
              )}
              {row.split("").map((key) => {
                const status = keyStatus[key];
                let bg = "bg-slate-800 text-white hover:bg-slate-700";
                if (status === "correct") bg = "bg-emerald-600 text-white";
                else if (status === "present") bg = "bg-amber-600 text-white";
                else if (status === "absent") bg = "bg-slate-900 text-slate-500 opacity-60";

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`w-9 h-11 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition ${bg}`}
                  >
                    {key}
                  </button>
                );
              })}
              {rIdx === 2 && (
                <button
                  onClick={() => handleKeyPress("BACK")}
                  className="px-2.5 h-11 text-xs font-bold rounded-lg bg-slate-800 text-white flex items-center justify-center cursor-pointer hover:bg-slate-700"
                >
                  DEL
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
