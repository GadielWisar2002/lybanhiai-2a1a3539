import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { rewardGameCoins } from "@/lib/games.functions";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Check, Rocket, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import streakCap from "@/assets/streak-cap.png";

export const Route = createFileRoute("/_authenticated/games/space-rush")({
  head: () => ({ meta: [{ title: "Space Rush — Lybanhi" }] }),
  component: SpaceRushGame,
});

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
}

const SPACE_QUESTIONS: Question[] = [
  { q: "Which planet has a giant storm called the Great Red Spot?", options: ["Saturn", "Jupiter", "Neptune", "Mars"], correctIndex: 1 },
  { q: "What is the primary gas found in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 1 },
  { q: "What is the speed of light approximately?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correctIndex: 0 },
  { q: "Which galaxy is the closest major neighbor to the Milky Way?", options: ["Andromeda", "Triangulum", "Large Magellanic Cloud", "Sombrero"], correctIndex: 0 },
  { q: "How long does it take for light from the Sun to reach Earth?", options: ["8 seconds", "8 minutes", "8 hours", "1 day"], correctIndex: 1 },
  { q: "Who was the first human to travel into outer space?", options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"], correctIndex: 1 },
  { q: "What is the name of Saturn's largest moon?", options: ["Titan", "Europa", "Ganymede", "Phobos"], correctIndex: 0 },
  { q: "What causes tides on Earth?", options: ["The Earth's magnetic field", "The gravitational pull of the Moon & Sun", "Ocean currents", "Solar winds"], correctIndex: 1 },
  { q: "What is the hottest planet in our solar system?", options: ["Mercury", "Venus", "Mars", "Jupiter"], correctIndex: 1 },
  { q: "What type of celestial body is Pluto classified as?", options: ["Asteroid", "Dwarf Planet", "Comet", "Meteorite"], correctIndex: 1 },
];

function SpaceRushGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const claimRewards = useServerFn(rewardGameCoins);

  const [gameState, setGameState] = useState<"lobby" | "quiz" | "ended">("lobby");
  const [qIndex, setQIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [streak, setStreak] = useState(0);
  const [playerDistance, setPlayerDistance] = useState(0);
  const [competitors, setCompetitors] = useState([
    { name: "NovaCruiser 🚀", distance: 0, isPlayer: false },
    { name: "NebulaFast 🛸", distance: 0, isPlayer: false },
    { name: "CometRider ☄️", distance: 0, isPlayer: false },
  ]);

  const rewardMut = useMutation({
    mutationFn: (coins: number) => claimRewards({ data: { coins } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(t("games.goldQuest.claimed", { defaultValue: "Rewards claimed successfully!" }));
    },
    onError: () => toast.error(t("common.error")),
  });

  // Track Game Progress Loop
  useEffect(() => {
    if (gameState !== "quiz") return;

    // Check if anyone won
    const checkWin = () => {
      if (playerDistance >= 100) {
        endRace(1);
        return true;
      }
      const winner = competitors.find(c => c.distance >= 100);
      if (winner) {
        const playerRank = competitors.filter(c => c.distance > playerDistance).length + 2;
        endRace(playerRank);
        return true;
      }
      return false;
    };

    if (checkWin()) return;

    const timer = setTimeout(() => {
      // Move AI ships
      setCompetitors(prev => {
        return prev.map(c => {
          const step = Math.floor(Math.random() * 8) + 4; // 4 to 12 meters per loop
          return { ...c, distance: Math.min(100, c.distance + step) };
        });
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [playerDistance, competitors, gameState]);

  const startRace = () => {
    setPlayerDistance(0);
    setStreak(0);
    setCompetitors([
      { name: "NovaCruiser 🚀", distance: 0, isPlayer: false },
      { name: "NebulaFast 🛸", distance: 0, isPlayer: false },
      { name: "CometRider ☄️", distance: 0, isPlayer: false },
    ]);
    setQIndex(Math.floor(Math.random() * SPACE_QUESTIONS.length));
    setGameState("quiz");
  };

  const endRace = (rank: number) => {
    setGameState("ended");
    let wonCoins = 2;
    if (rank === 1) wonCoins = 10;
    else if (rank === 2) wonCoins = 5;

    rewardMut.mutate(wonCoins);
  };

  const handleAnswer = (index: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(index);
    const correct = index === SPACE_QUESTIONS[qIndex].correctIndex;
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        
        // Multiplier: +15 base, +5 per streak level (max 30 total)
        const boost = Math.min(30, 15 + (nextStreak - 1) * 5);
        setPlayerDistance(d => Math.min(100, d + boost));
        toast.success(t("games.spaceRush.boost", { count: boost, defaultValue: `Power Boost! +${boost}m` }));
      } else {
        setStreak(0);
        toast.error(t("games.spaceRush.stall", { defaultValue: "Engine Stall! 0m" }));
      }

      setSelectedAns(null);
      setIsCorrect(null);
      setQIndex(p => (p + 1) % SPACE_QUESTIONS.length);
    }, 1500);
  };

  // Compile final leaderboard standings
  const finalStandings = [
    { name: "Debanhi (You)", distance: playerDistance, isPlayer: true },
    ...competitors
  ].sort((a, b) => b.distance - a.distance);

  const playerRank = finalStandings.findIndex(x => x.isPlayer) + 1;
  const currentQ = SPACE_QUESTIONS[qIndex];

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-12 flex flex-col min-h-[85vh]">
        {/* Header navigation back */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/games" })} className="rounded-full p-1.5 hover:bg-muted cursor-pointer">
            <ArrowLeft className="size-5" />
          </button>
          <span className="font-display font-bold text-lg">{t("games.spaceRush.title", { defaultValue: "Space Rush" })}</span>
        </div>

        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-12 animate-in fade-in duration-300">
            <div className="size-24 grid place-items-center rounded-3xl bg-success/15 text-5xl mb-6 shadow-md select-none animate-bounce">
              🚀
            </div>
            <h2 className="font-display text-2xl font-extrabold">{t("games.spaceRush.welcome", { defaultValue: "Space Rush Rocket Race!" })}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              {t("games.spaceRush.welcomeDesc", { defaultValue: "Answer the astronomy questions correctly to fire your rocket boosters and streak ahead of simulated AI pilots. Reach 100 meters to win!" })}
            </p>
            <button
              onClick={startRace}
              className="mt-8 w-full h-12 bg-success text-success-foreground font-semibold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
            >
              {t("games.spaceRush.startRace", { defaultValue: "Start Race" })}
            </button>
          </div>
        )}

        {/* ACTIVE GAME STATE */}
        {gameState === "quiz" && (
          <div className="flex-1 flex flex-col justify-between mt-6">
            {/* Visual Space Race Track Dashboard */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t("games.spaceRush.track", { defaultValue: "Race Track (100m)" })}
              </h4>
              
              {/* Player Rocket Row */}
              <div className="space-y-1 animate-in slide-in-from-left-2 duration-300">
                <div className="flex justify-between text-[10px] font-bold text-primary">
                  <span>Debanhi {t("games.spaceRush.you", { defaultValue: "(You)" })}</span>
                  <span>{playerDistance}m</span>
                </div>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500 relative"
                    style={{ width: `${playerDistance}%` }}
                  >
                    <Rocket className="absolute right-1 top-0.5 size-3 text-primary-foreground select-none animate-pulse" />
                  </div>
                </div>
              </div>

              {/* AI Competitors Rows */}
              {competitors.map(c => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>{c.name}</span>
                    <span>{c.distance}m</span>
                  </div>
                  <div className="h-2 w-full bg-muted/65 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000"
                      style={{ width: `${c.distance}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Streak Indicator */}
            {streak > 0 && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                  {t("games.spaceRush.streakIndicator", { count: streak, defaultValue: `🔥 ${streak} Correct Streak! (Engine Boost)` })}
                </span>
              </div>
            )}

            {/* Quiz Board */}
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
          </div>
        )}

        {/* ENDED GAME STATE */}
        {gameState === "ended" && (
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-8 animate-in zoom-in-95 duration-300">
            <div className="size-20 grid place-items-center rounded-3xl bg-success/15 text-4xl mb-4 select-none">
              🏆
            </div>
            <h2 className="font-display text-3xl font-black">{t("games.spaceRush.finished", { defaultValue: "Race Finished!" })}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("games.spaceRush.rankDesc", { rank: playerRank, defaultValue: `You finished in Rank #${playerRank}!` })}
            </p>

            <div className="mt-6 w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-elegant">
              <h3 className="font-display font-extrabold text-sm uppercase tracking-widest text-muted-foreground">
                {t("games.spaceRush.finalStandings", { defaultValue: "Final Standings" })}
              </h3>
              <ul className="mt-4 space-y-2">
                {finalStandings.map((item, idx) => (
                  <li
                    key={item.name}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-2xl font-bold ${
                      item.isPlayer ? "bg-success text-success-foreground scale-105" : "bg-muted/40"
                    }`}
                  >
                    <span>{idx + 1}. {formatName(item.name)}</span>
                    <span>{item.distance}m</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reward claims */}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-sm items-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 border border-gold/40 px-4 py-2 font-display text-sm font-bold text-gold-foreground">
                <img src={streakCap} alt="" className="size-4 shrink-0 select-none animate-pulse" />
                <span>
                  {t("games.spaceRush.coinsClaimed", {
                    count: playerRank === 1 ? 10 : playerRank === 2 ? 5 : 2,
                    defaultValue: `+ ${playerRank === 1 ? "10" : playerRank === 2 ? "5" : "2"} Sombreritos Reclamados!`
                  })}
                </span>
              </div>
              <button
                onClick={() => navigate({ to: "/games" })}
                className="mt-4 w-full h-12 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
              >
                {t("games.spaceRush.backHub", { defaultValue: "Back to Arcade Hub" })}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
