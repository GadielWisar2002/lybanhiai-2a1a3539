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

    await supabase.from("streaks").upsert({
      user_id: userId, current_streak: current, longest_streak: longest,
      last_active_date: today, total_xp: totalXp, updated_at: new Date().toISOString(),
    });

    return { xp, current_streak: current, total_xp: totalXp };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, streakRes, recsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, language").eq("id", userId).maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("recommendations").select("id, career_name, match_score, tags").eq("user_id", userId).order("match_score", { ascending: false }).limit(3),
    ]);
    return {
      profile: profileRes.data,
      streak: streakRes.data ?? { current_streak: 0, longest_streak: 0, total_xp: 0, last_active_date: null },
      recommendations: recsRes.data ?? [],
    };
  });
