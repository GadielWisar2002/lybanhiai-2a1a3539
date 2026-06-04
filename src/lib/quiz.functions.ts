import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenSchema = z.object({
  category: z.enum(["career", "toefl", "cambridge", "logic", "math", "language"]),
  topic: z.string().max(120),
  language: z.enum(["es", "en", "fr"]).default("es"),
  level: z.string().max(60).optional(),
  count: z.number().int().min(3).max(10).default(8),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const langLabel = data.language === "es" ? "Spanish" : data.language === "fr" ? "French" : "English";
    const levelClause = data.level ? ` Target school level: ${data.level}.` : "";
    const sys = `Generate a ${data.count}-question multiple-choice quiz in ${langLabel}.${levelClause} Each question has 4 options, exactly one correct.`;
    const userMsg = `Category: ${data.category}. Topic: ${data.topic}. Make it educational and appropriate for teenagers preparing for university.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "submit_quiz",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      q: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                      explanation: { type: "string" },
                    },
                    required: ["q", "options", "correctIndex", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_quiz" } },
      }),
    });

    if (res.status === 429) throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
    if (res.status === 402) throw new Error("Créditos de IA agotados.");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, t);
      throw new Error(`Error de IA (${res.status})`);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    let parsed: { questions: unknown[] } | null = null;
    const args = msg?.tool_calls?.[0]?.function?.arguments;
    if (args) {
      try { parsed = JSON.parse(args); } catch { /* ignore */ }
    }
    if (!parsed && typeof msg?.content === "string") {
      const m = msg.content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }
    if (!parsed?.questions?.length) {
      console.error("AI returned no quiz", JSON.stringify(json).slice(0, 500));
      throw new Error("La IA no devolvió un quiz válido. Intenta de nuevo.");
    }

    const { data: row, error } = await supabase.from("quizzes").insert({
      user_id: userId, category: data.category, topic: data.topic,
      language: data.language, questions: parsed.questions as never,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { quizId: row.id };
  });

const RegenSchema = z.object({
  quizId: z.string().uuid(),
  wrongIndexes: z.array(z.number().int().min(0).max(49)).min(1).max(50),
});

export const regenerateFromWrong = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const { data: orig, error: oe } = await supabase
      .from("quizzes")
      .select("category, topic, language, questions")
      .eq("id", data.quizId)
      .single();
    if (oe || !orig) throw new Error(oe?.message ?? "Quiz no encontrado");

    const allQs = orig.questions as unknown as { q: string; options: string[]; correctIndex: number; explanation: string }[];
    const wrong = data.wrongIndexes.map((i) => allQs[i]).filter(Boolean);
    if (!wrong.length) throw new Error("No hay preguntas para repasar");

    const lang = orig.language as string;
    const langLabel = lang === "es" ? "Spanish" : lang === "fr" ? "French" : "English";
    const sys = `Generate ${wrong.length} multiple-choice review questions in ${langLabel}. For each provided original question, create a NEW equivalent question testing the SAME concept and same difficulty but with DIFFERENT numbers, names, words, or context so the student can't just memorize. 4 options, exactly one correct. Keep the same order as input.`;
    const userMsg = `Category: ${orig.category}. Topic: ${orig.topic}.\nOriginal questions to re-create (same concept, different surface):\n${wrong
      .map((w, i) => `${i + 1}. ${w.q}\n   Correct: ${w.options[w.correctIndex]}`)
      .join("\n")}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "submit_quiz",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      q: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                      explanation: { type: "string" },
                    },
                    required: ["q", "options", "correctIndex", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_quiz" } },
      }),
    });

    if (res.status === 429) throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
    if (res.status === 402) throw new Error("Créditos de IA agotados.");
    if (!res.ok) throw new Error(`Error de IA (${res.status})`);

    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    let parsed: { questions: unknown[] } | null = null;
    const args = msg?.tool_calls?.[0]?.function?.arguments;
    if (args) { try { parsed = JSON.parse(args); } catch { /* ignore */ } }
    if (!parsed?.questions?.length) throw new Error("La IA no devolvió un quiz válido. Intenta de nuevo.");

    const reviewTopic = lang === "fr" ? `Révision : ${orig.topic}` : lang === "en" ? `Review: ${orig.topic}` : `Repaso: ${orig.topic}`;
    const { data: row, error } = await supabase.from("quizzes").insert({
      user_id: userId, category: orig.category, topic: reviewTopic,
      language: lang, questions: parsed.questions as never,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { quizId: row.id as string };
  });

export const getQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: quiz, error } = await supabase.from("quizzes").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return quiz;
  });

export const listMyQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, category, topic, language, questions, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((q) => ({
      id: q.id as string,
      category: q.category as string,
      topic: q.topic as string,
      language: q.language as string,
      created_at: q.created_at as string,
      questions_count: Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0,
    }));
  });

const SubmitSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3)).max(50),
  score: z.number().int().min(0),
  total: z.number().int().min(1).max(50),
});

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const xp = data.score * 10;

    await supabase.from("quiz_attempts").insert({
      user_id: userId, quiz_id: data.quiz_id, score: data.score,
      total: data.total, answers: data.answers, xp_earned: xp,
    });

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const { data: s } = await supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle();
    let current = 1;
    let longest = s?.longest_streak ?? 0;
    if (s?.last_active_date) {
      const last = new Date(s.last_active_date);
      const diff = Math.floor((new Date(today).getTime() - last.getTime()) / 86400000);
      if (diff === 0) current = s.current_streak;
      else if (diff === 1) current = s.current_streak + 1;
      else current = 1;
    }
    longest = Math.max(longest, current);
    const totalXp = (s?.total_xp ?? 0) + xp;
    const newCoins = s?.coins ?? 0;

    await supabase.from("streaks").upsert({
      user_id: userId, current_streak: current, longest_streak: longest,
      last_active_date: today, total_xp: totalXp, coins: newCoins, updated_at: new Date().toISOString(),
    });

    return { xp, current_streak: current, total_xp: totalXp, coins: newCoins };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, streakRes, recsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, language, active_blook_id, avatar_config, unlocked_avatar_items, role").eq("id", userId).maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("recommendations").select("id, career_name, match_score, tags, language").eq("user_id", userId).order("match_score", { ascending: false }).limit(3),
    ]);

    // Fetch all user's quiz attempts to calculate actual real XP
    const { data: attempts } = await supabase.from("quiz_attempts").select("xp_earned").eq("user_id", userId);
    const calculatedXp = (attempts ?? []).reduce((acc, curr) => acc + (curr.xp_earned ?? 0), 0);

    const GAME_COSTS: Record<string, number> = {
      "gold-quest": 500,
      "space-rush": 1000,
      "wordle": 100,
      "complete-concept": 200,
      "hangman": 300,
      "order-idea": 400,
      "connect-area": 500,
      "dictation": 600,
      "criaturas-conocimiento": 100,
      "rpg-academico": 200,
      "centro-investigacion": 300,
      "torre-infinita": 400,
      "escape-room": 500,
      "runner-conocimiento": 600,
      "battle-royale": 700,
      "laboratorio-inventores": 800,
      "ciudad-conocimiento": 900,
      "ligas-campeones": 1000,
      "simulador-examenes": 150,
    };

    let s = streakRes.data;
    let totalXp = s?.total_xp ?? 0;
    let coins = s?.coins ?? 0;
    let unlockedGames = s?.unlocked_games ?? [];

    // Calculate spent XP from unlocked games
    const spentXp = unlockedGames.reduce((acc, gameId) => acc + (GAME_COSTS[gameId] ?? 0), 0);
    const netXp = Math.max(0, calculatedXp - spentXp);

    // If database total_xp is lower than calculated net XP, sync it!
    if (netXp > totalXp) {
      totalXp = netXp;
    }

    const today = new Date().toISOString().slice(0, 10);
    let current = s?.current_streak ?? 0;
    let isActiveToday = false;

    if (s?.last_active_date) {
      const last = new Date(s.last_active_date);
      const diff = Math.floor((new Date(today).getTime() - last.getTime()) / 86400000);
      if (diff === 0) {
        isActiveToday = true;
      } else if (diff === 1) {
        isActiveToday = false;
      } else {
        current = 0;
        isActiveToday = false;
      }
    }

    // If we updated the values or if the streak row doesn't exist, upsert it in the database
    if (!s || s.total_xp !== totalXp || s.coins !== coins || s.current_streak !== current) {
      const { data: updatedStreak } = await supabase.from("streaks").upsert({
        user_id: userId,
        current_streak: current,
        longest_streak: s?.longest_streak ?? 0,
        last_active_date: s?.last_active_date ?? today,
        total_xp: totalXp,
        coins: coins,
        unlocked_games: unlockedGames,
        updated_at: new Date().toISOString(),
      }).select().maybeSingle();
      if (updatedStreak) {
        s = updatedStreak;
      }
    }

    return {
      profile: profileRes.data,
      streak: {
        current_streak: current,
        longest_streak: s?.longest_streak ?? 0,
        total_xp: totalXp,
        coins: coins,
        unlocked_games: unlockedGames,
        last_active_date: s?.last_active_date ?? null,
        is_active_today: isActiveToday,
      },
      recommendations: recsRes.data ?? [],
    };
  });
