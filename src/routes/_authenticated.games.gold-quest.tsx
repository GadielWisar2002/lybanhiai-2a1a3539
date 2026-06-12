import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Check, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";


export const Route = createFileRoute("/_authenticated/games/gold-quest")({
  head: () => ({ meta: [{ title: "Gold Quest — Lybanhi" }] }),
  component: GoldQuestGame,
});

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
}

const SAMPLE_QUESTIONS: Question[] = [
  { q: "What is the value of Pi rounded to two decimal places?", options: ["3.14", "3.16", "3.12", "3.00"], correctIndex: 0 },
  { q: "Which subject studies living organisms?", options: ["Physics", "Chemistry", "Biology", "Geology"], correctIndex: 2 },
  { q: "Solve for x: 2x + 5 = 15", options: ["x = 5", "x = 10", "x = 4", "x = 6"], correctIndex: 0 },
  { q: "What is the synonym of 'Generous'?", options: ["Selfish", "Kind / Altruistic", "Stingy", "Greedy"], correctIndex: 1 },
  { q: "Who wrote 'Romeo and Juliet'?", options: ["Shakespeare", "Cervantes", "Chaucer", "Hemingway"], correctIndex: 0 },
  { q: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctIndex: 2 },
  { q: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mars", "Mercury"], correctIndex: 3 },
  { q: "What is the capital city of France?", options: ["London", "Paris", "Berlin", "Rome"], correctIndex: 1 },
  { q: "Which element has the chemical symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Carbon"], correctIndex: 1 },
  { q: "How many bones are in an adult human body?", options: ["206", "300", "150", "250"], correctIndex: 0 },
  { q: "Which of these is a prime number?", options: ["4", "9", "11", "15"], correctIndex: 2 },
  { q: "What is the opposite of 'Synthesize'?", options: ["Combine", "Analyze / Break down", "Build", "Create"], correctIndex: 1 },
  { q: "In logic, what is a syllogism?", options: ["A mathematical theorem", "A form of deductive reasoning", "A punctuation error", "A visual pattern"], correctIndex: 1 },
  { q: "Which language has the most native speakers?", options: ["English", "Spanish", "Mandarin", "Hindi"], correctIndex: 2 },
  { q: "What is 15% of 200?", options: ["20", "30", "40", "15"], correctIndex: 1 },
];

function GoldQuestGame() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const claimRewards = useServerFn(rewardGameCoins);

  const [gameState, setGameState] = useState<"lobby" | "quiz" | "chests" | "ended">("lobby");
  const [qIndex, setQIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [gold, setGold] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const [chestContents, setChestContents] = useState<{ label: string; action: () => void }[]>([]);

  // Simulated AI competitors
  const [leaderboard, setLeaderboard] = useState([
    { name: "Debanhi (You)", gold: 0, isPlayer: true },
    { name: "SmartyBlook 🦊", gold: 150, isPlayer: false },
    { name: "QuizBot 🤖", gold: 100, isPlayer: false },
    { name: "StudyMonster 👾", gold: 50, isPlayer: false },
  ]);

  const rewardMut = useMutation({
    mutationFn: (coins: number) => claimRewards({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("games.goldQuest.claimed", { defaultValue: "Rewards claimed successfully!" }));
    },
    onError: () => toast.error(t("common.error")),
  });

  // Game Loop Timer
  useEffect(() => {
    if (gameState !== "quiz" && gameState !== "chests") return;
    if (timeLeft <= 0) {
      setGameState("ended");
      // Calculate reward coins based on rank
      const sorted = [...leaderboard].sort((a, b) => b.gold - a.gold);
      const playerRank = sorted.findIndex(item => item.isPlayer) + 1;
      let wonCoins = 2;
      if (playerRank === 1) wonCoins = 10;
      else if (playerRank === 2) wonCoins = 5;

      rewardMut.mutate(wonCoins);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(p => p - 1);
      
      // Simulate AI opponents gaining gold in real-time!
      setLeaderboard(prev => {
        const next = prev.map(item => {
          if (item.isPlayer) return item;
          const gain = Math.random() > 0.4 ? Math.floor(Math.random() * 50) + 10 : 0;
          return { ...item, gold: item.gold + gain };
        });
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  // Handle Leaderboard order updates
  useEffect(() => {
    setLeaderboard(prev => {
      const next = prev.map(item => item.isPlayer ? { ...item, gold } : item);
      return next.sort((a, b) => b.gold - a.gold);
    });
  }, [gold]);

  const startGame = () => {
    setGold(0);
    setTimeLeft(60);
    setQIndex(Math.floor(Math.random() * SAMPLE_QUESTIONS.length));
    setGameState("quiz");
  };

  const handleAnswer = (index: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(index);
    const correct = index === SAMPLE_QUESTIONS[qIndex].correctIndex;
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        // Roll Chest actions
        const chests = Array.from({ length: 3 }).map(() => rollChestAction());
        setChestContents(chests);
        setGameState("chests");
      } else {
        // Next Question
        setSelectedAns(null);
        setIsCorrect(null);
        setQIndex(p => (p + 1) % SAMPLE_QUESTIONS.length);
      }
    }, 1500);
  };

  const rollChestAction = () => {
    const roll = Math.random();
    if (roll < 0.15 && gold > 100) {
      // Steal 25% from top AI
      return {
        label: "⚔️ " + t("games.goldQuest.steal", { defaultValue: "Steal 25%" }),
        action: () => {
          const leader = leaderboard.find(x => !x.isPlayer);
          if (leader && leader.gold > 50) {
            const stolen = Math.floor(leader.gold * 0.25);
            setGold(g => g + stolen);
            toast.success(t("games.goldQuest.stolenSuccess", { stolen, name: leader.name, defaultValue: `Stole ${stolen} gold from ${leader.name}!` }));
          } else {
            setGold(g => g + 50);
            toast.success(t("games.goldQuest.plusGold", { count: 50, defaultValue: "+50 Gold!" }));
          }
        }
      };
    } else if (roll < 0.3) {
      return {
        label: "✨ " + t("games.goldQuest.double", { defaultValue: "Double Gold" }),
        action: () => {
          setGold(g => g * 2 || 100);
          toast.success(t("games.goldQuest.doubled", { defaultValue: "Gold Doubled!" }));
        }
      };
    } else if (roll < 0.65) {
      return {
        label: "🪙 +200 " + t("games.goldQuest.gold", { defaultValue: "Gold" }),
        action: () => {
          setGold(g => g + 200);
          toast.success(t("games.goldQuest.plusGold", { count: 200, defaultValue: "+200 Gold!" }));
        }
      };
    } else {
      return {
        label: "🪙 +50 " + t("games.goldQuest.gold", { defaultValue: "Gold" }),
        action: () => {
          setGold(g => g + 50);
          toast.success(t("games.goldQuest.plusGold", { count: 50, defaultValue: "+50 Gold!" }));
        }
      };
    }
  };

  const chooseChest = (chestIdx: number) => {
    const action = chestContents[chestIdx];
    action.action();
    
    // Resume Quiz
    setTimeout(() => {
      setSelectedAns(null);
      setIsCorrect(null);
      setGameState("quiz");
      setQIndex(p => (p + 1) % SAMPLE_QUESTIONS.length);
    }, 1200);
  };

  const currentQ = SAMPLE_QUESTIONS[qIndex];

  // Helper to format player name
  const formatName = (name: string) => {
    if (name.includes("(You)")) {
      return name.replace("(You)", t("games.spaceRush.you", { defaultValue: "(You)" }));
    }
    return name;
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-12 flex flex-col min-h-[85vh]">
        {/* Header navigation back */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/games" })} className="rounded-full p-1.5 hover:bg-muted cursor-pointer">
            <ArrowLeft className="size-5" />
          </button>
          <span className="font-display font-bold text-lg">{t("games.goldQuest.title", { defaultValue: "Gold Quest" })} Arcade</span>
        </div>

        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-12 animate-in fade-in duration-300">
            <div className="size-24 grid place-items-center rounded-3xl bg-amber-400/20 text-5xl mb-6 shadow-md select-none animate-bounce">
              👑
            </div>
            <h2 className="font-display text-2xl font-extrabold">{t("games.goldQuest.welcome", { context: user?.user_metadata?.gender || "other", defaultValue: "Welcome to Gold Quest!" })}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              {t("games.goldQuest.welcomeDesc", { defaultValue: "Answer the questions as fast as possible, open chest cards to multiply your gold, and steal from AI bots to win!" })}
            </p>
            <button
              onClick={startGame}
              className="mt-8 w-full h-12 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
            >
              {t("games.goldQuest.startGame", { defaultValue: "Start Game (60s)" })}
            </button>
          </div>
        )}

        {/* ACTIVE GAME STATES (QUIZ & CHESTS) */}
        {(gameState === "quiz" || gameState === "chests") && (
          <div className="flex-1 flex flex-col justify-between mt-6">
            {/* Top Scorebar */}
            <div className="flex justify-between items-center gap-4">
              <div className="rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 font-display text-sm font-bold text-amber-500 flex items-center gap-1">
                👑 <span>{t("games.goldQuest.goldCount", { count: gold, defaultValue: `${gold} Gold` })}</span>
              </div>
              <div className="rounded-full bg-destructive/10 border border-destructive/25 px-3 py-1 text-sm font-semibold text-destructive">
                ⏱️ {t("games.goldQuest.timeLeft", { count: timeLeft, defaultValue: `${timeLeft}s left` })}
              </div>
            </div>

            {/* Simulated Live Leaderboard Panel */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-card">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t("games.goldQuest.liveRankings", { defaultValue: "Live Rankings" })}
              </h4>
              <ul className="space-y-1.5">
                {leaderboard.map((item, idx) => (
                  <li
                    key={item.name}
                    className={`flex justify-between items-center px-3 py-1 rounded-xl text-xs font-semibold ${
                      item.isPlayer ? "bg-primary/10 text-primary border border-primary/20" : ""
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{idx + 1}. {formatName(item.name)}</span>
                    <span>🪙 {item.gold}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Game Screen Quiz/Chests */}
            {gameState === "quiz" ? (
              <div className="my-auto py-6 animate-in fade-in duration-200">
                <h3 className="text-center font-display text-lg font-bold leading-snug min-h-[60px] flex items-center justify-center">
                  {currentQ.q}
                </h3>
                <ul className="mt-6 space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isAnswerSelected = selectedAns !== null;
                    const isCorrectOption = idx === currentQ.correctIndex;
                    const isUserSelected = selectedAns === idx;

                    let bgCls = "border-border bg-card hover:bg-muted/10";
                    if (isAnswerSelected) {
                      if (isCorrectOption) bgCls = "border-emerald-500/60 bg-emerald-500/10 text-emerald-700";
                      else if (isUserSelected) bgCls = "border-destructive/60 bg-destructive/10 text-destructive";
                      else bgCls = "border-border opacity-50";
                    }

                    return (
                      <li key={idx}>
                        <button
                          disabled={isAnswerSelected}
                          onClick={() => handleAnswer(idx)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left text-sm font-semibold transition active:scale-98 cursor-pointer disabled:cursor-not-allowed ${bgCls}`}
                        >
                          <span>{opt}</span>
                          {isAnswerSelected && isCorrectOption && <Check className="size-4 shrink-0" />}
                          {isAnswerSelected && isUserSelected && !isCorrectOption && <X className="size-4 shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="my-auto py-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
                <h3 className="font-display text-xl font-black text-amber-500 animate-pulse">
                  {t("games.goldQuest.correctChest", { defaultValue: "CORRECT! CHOOSE A CHEST:" })}
                </h3>
                <div className="mt-8 flex gap-4 justify-center w-full max-w-sm">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => chooseChest(idx)}
                      className="flex-1 aspect-[2/3] max-h-40 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 shadow-md flex flex-col items-center justify-center transition active:scale-95 duration-200 cursor-pointer"
                    >
                      <span className="text-4xl select-none animate-bounce">🎁</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENDED GAME STATE */}
        {gameState === "ended" && (
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-8 animate-in zoom-in-95 duration-300">
            <div className="size-20 grid place-items-center rounded-3xl bg-amber-400/20 text-4xl mb-4 select-none">
              🏆
            </div>
            <h2 className="font-display text-3xl font-black">{t("games.goldQuest.finished", { defaultValue: "Quest Finished!" })}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("games.goldQuest.collectedGold", { count: gold, defaultValue: `You collected 🪙 ${gold} Gold!` })}
            </p>

            <div className="mt-6 w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-elegant">
              <h3 className="font-display font-extrabold text-sm uppercase tracking-widest text-muted-foreground">
                {t("games.goldQuest.finalRanks", { defaultValue: "Final Ranks" })}
              </h3>
              <ul className="mt-4 space-y-2">
                {leaderboard.map((item, idx) => (
                  <li
                    key={item.name}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-2xl font-bold ${
                      item.isPlayer ? "bg-primary text-primary-foreground scale-105" : "bg-muted/40"
                    }`}
                  >
                    <span>{idx + 1}. {formatName(item.name)}</span>
                    <span>🪙 {item.gold}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reward Claims */}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-sm items-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 border border-gold/40 px-4 py-2 font-display text-sm font-bold text-gold-foreground">
                <img src={streakCap} alt="" className="size-4 shrink-0 select-none animate-pulse" />
                <span>
                  {t("games.goldQuest.coinsClaimed", {
                    count: leaderboard.findIndex(x => x.isPlayer) === 0 ? 10 : leaderboard.findIndex(x => x.isPlayer) === 1 ? 5 : 2,
                    defaultValue: `+ ${leaderboard.findIndex(x => x.isPlayer) === 0 ? "10" : leaderboard.findIndex(x => x.isPlayer) === 1 ? "5" : "2"} Arcade Coins Claimed!`
                  })}
                </span>
              </div>
              <button
                onClick={() => navigate({ to: "/games" })}
                className="mt-4 w-full h-12 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
              >
                {t("games.goldQuest.backHub", { defaultValue: "Back to Arcade Hub" })}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
