import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAA_OFFICIAL_QUESTIONS } from "./paa-official-bank";

const GenSchema = z.object({
  category: z.enum(["career", "toefl", "cambridge", "logic", "math", "language", "chemistry", "paa", "exani"]),
  topic: z.string().max(500),
  language: z.enum(["es", "en", "fr"]).default("es"),
  level: z.string().max(60).optional(),
  count: z.number().int().min(3).max(10).default(8),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Check for authentic pre-verified PAA questions with multi-topic support
    if (data.category === "paa") {
      const topicLower = data.topic.toLowerCase();
      const selectedQuestions = PAA_OFFICIAL_QUESTIONS.filter((q) => {
        if (topicLower.includes("simulador") || topicLower.includes("completo")) return true;
        const subLower = q.subtopic.toLowerCase();
        const secLower = q.section.toLowerCase();

        if (topicLower.includes("vocabulario") || topicLower.includes("inferencia")) {
          if (secLower === "lectura" && (subLower.includes("vocabulario") || subLower.includes("inferencia") || subLower.includes("tema"))) return true;
        }
        if (topicLower.includes("literario") || topicLower.includes("figuras") || topicLower.includes("retórica") || topicLower.includes("retorica")) {
          if (secLower === "lectura" && (subLower.includes("figuras") || subLower.includes("géneros") || subLower.includes("generos"))) return true;
        }
        if (topicLower.includes("redacción") || topicLower.includes("redaccion") || topicLower.includes("operaciones") || topicLower.includes("generalizar") || topicLower.includes("omitir")) {
          if (secLower === "redaccion") return true;
        }
        if (topicLower.includes("descuentos") || topicLower.includes("desigualdades") || topicLower.includes("aritmética") || topicLower.includes("aritmetica")) {
          if (secLower === "matematicas" && (subLower.includes("porcentajes") || subLower.includes("desigualdades") || subLower.includes("velocidad"))) return true;
        }
        if (topicLower.includes("álgebra") || topicLower.includes("algebra") || topicLower.includes("geometría") || topicLower.includes("geometria") || topicLower.includes("rectas")) {
          if (secLower === "matematicas" && (subLower.includes("geometría") || subLower.includes("geometria") || subLower.includes("pendiente"))) return true;
        }
        if (topicLower.includes("probabilidad") || topicLower.includes("estadística") || topicLower.includes("estadistica")) {
          if (secLower === "matematicas" && (subLower.includes("estadística") || subLower.includes("estadistica") || subLower.includes("probabilidad"))) return true;
        }
        if (topicLower.includes("inglés") || topicLower.includes("ingles") || topicLower.includes("grammar") || topicLower.includes("english")) {
          if (secLower === "ingles") return true;
        }
        return false;
      });

      const pool = selectedQuestions.length >= 3 ? selectedQuestions : PAA_OFFICIAL_QUESTIONS;
      if (pool.length >= 3) {
        const shuffledQuestions = pool
          .sort(() => 0.5 - Math.random())
          .slice(0, data.count)
          .map((item) => {
            const correctOpt = item.options[item.correctIndex];
            const opts = [...item.options].sort(() => 0.5 - Math.random());
            return {
              q: item.q,
              options: opts,
              correctIndex: opts.indexOf(correctOpt),
              explanation: item.explanation,
            };
          });

        const { data: row, error } = await supabase
          .from("quizzes")
          .insert({
            user_id: userId,
            category: data.category,
            topic: data.topic,
            language: data.language,
            questions: shuffledQuestions as never,
          })
          .select("id")
          .single();

        if (!error && row) return { quizId: row.id };
      }
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const langLabel = data.language === "es" ? "Spanish" : data.language === "fr" ? "French" : "English";
    const levelClause = data.level ? ` Target school level: ${data.level}.` : "";
    let examClause = "";
    if (data.category === "paa") {
      examClause = ` This is strictly for the College Board PAA (Prueba de Aptitud Académica) university admission exam.
Model the questions strictly on authentic College Board PAA exercise styles:
- LECTURA: Short reading passages with bolded words for vocabulary in context ("la palabra 'X' se usa en el sentido de..."), implicit meaning / inferences ("la expresión 'Y' sugiere que..."), and literary analysis (personificación, símil, cuento vs ensayo).
- REDACCIÓN: Numbered sentence segments (1) ... (2) ... (3) ... with questions identifying operations: generalización, omisión sin pérdida de información, or adición de lenguaje figurado.
- MATEMÁTICAS: Percentage discounts with final price, linear inequalities (e.g. 2x - 3 < 7), opposing speed/travel problems, perimeter with algebraic expressions, line slopes m = (y2-y1)/(x2-x1), missing terms for an average, and classic card/dice probability.
- INGLÉS: Subject-verb agreement (goes), proper negation (doesn't like), short schedule texts with detail & inference questions, and combining sentences concisely.`;
    } else if (data.category === "exani") {
      examClause = " This is for the Ceneval EXANI-II university entrance exam. Questions must follow official Ceneval EXANI-II standards and modules.";
    }
    const sys = `Generate a ${data.count}-question multiple-choice quiz in ${langLabel}.${levelClause}${examClause} Each question has 4 options, exactly one correct. Randomize the position of the correct answer among options (A, B, C, D).`;
    const userMsg = `Category: ${data.category}. Topic: ${data.topic}. Make it educational and appropriate for high school students preparing for university entrance.`;

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
      supabase.from("profiles").select("full_name, language, active_blook_id").eq("id", userId).maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("recommendations").select("id, career_name, match_score, tags, language").eq("user_id", userId).order("match_score", { ascending: false }).limit(3),
    ]);

    let profile = profileRes.data;
    let email = "";
    let isDeveloper = false;

    try {
      email = (context.claims as any)?.email ?? "";
      const emailLower = email.toLowerCase();
      isDeveloper = emailLower === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                    emailLower.includes("debanhivillanueva@colegiomaranatha") ||
                    emailLower.includes("debanhivillanuevacolegiomaranatha");
    } catch (err) {
      console.error("Error checking developer role in getDashboard:", err);
    }

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
      "quiz-clash": 1200,
      "mundo-constructor": 1500,
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
      profile: profile,
      email: email,
      isDeveloper,
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

export const listBooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("books")
      .select("id, content, created_at, grade, subject")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(b => ({
      id: b.id as string,
      content: b.content as string,
      created_at: b.created_at as string,
      grade: b.grade as string | null,
      subject: b.subject as string | null,
    }));
  });

const BookGenSchema = z.object({
  bookId: z.string().uuid(),
  count: z.number().int().min(3).max(10).default(5),
  level: z.string().max(60).optional(),
  language: z.enum(["es", "en", "fr"]).default("es"),
});

export const generateBookQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookGenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Google AI Studio API Key (GEMINI_API_KEY) no está configurada en las variables de entorno.");

    // Fetch the book content
    const { data: book, error: be } = await supabase
      .from("books")
      .select("title, chapter_name, content, grade, subject")
      .eq("id", data.bookId)
      .single();
    if (be || !book) throw new Error("Libro o capítulo no encontrado.");

    const langLabel = data.language === "es" ? "Spanish" : data.language === "fr" ? "French" : "English";
    const levelClause = data.level ? ` Target school level: ${data.level}.` : "";
    const gradeClause = book.grade ? ` Target school grade: ${book.grade}.` : "";
    const subjectClause = book.subject ? ` Academic subject field: ${book.subject}.` : "";
    
    const systemInstruction = `Eres un creador de exámenes académicos profesional. Genera un examen estructurado de opción múltiple de ${data.count} preguntas en el idioma ${langLabel}.${levelClause}${gradeClause}${subjectClause} Cada pregunta debe tener 4 opciones, y exactamente una de ellas debe ser correcta.`;
    const userPrompt = `Basándote únicamente en el siguiente texto académico, genera el examen:\n\n${book.content}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemInstruction}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    },
                    correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" }
                  },
                  required: ["q", "options", "correctIndex", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        }
      })
    });

    if (res.status === 429) throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("Gemini API error", res.status, t);
      throw new Error(`Error en la API de Gemini (${res.status})`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini API returned no content", JSON.stringify(json));
      throw new Error("La IA no devolvió un quiz válido. Intenta de nuevo.");
    }

    let parsed: { questions: unknown[] } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini", text, e);
      throw new Error("La respuesta de la IA no pudo ser analizada como un examen válido.");
    }

    if (!parsed?.questions?.length) {
      throw new Error("El examen devuelto por la IA no tiene preguntas válidas.");
    }

    const sub = book.subject || "Libro";
    const grd = book.grade || "General";
    const quizTopic = `${sub.toUpperCase()} (${grd})`;
    const { data: row, error } = await supabase.from("quizzes").insert({
      user_id: userId,
      category: "language",
      topic: quizTopic,
      language: data.language,
      questions: parsed.questions as never,
    }).select("id").single();

    if (error) throw new Error(error.message);
    return { quizId: row.id };
  });

const CreateBookSchema = z.object({
  content: z.string().min(1),
  grade: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
});

export const createBookChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateBookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const email = (context.claims as any)?.email ?? "";
    const emailLower = email.toLowerCase();
    const isDeveloper = emailLower === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                        emailLower.includes("debanhivillanueva@colegiomaranatha") ||
                        emailLower.includes("debanhivillanuevacolegiomaranatha");
    if (!isDeveloper) throw new Error("Acceso denegado. Solo desarrolladores pueden realizar esta acción.");

    const { data: row, error } = await supabase
      .from("books")
      .insert({
        title: "",
        chapter_name: "",
        content: data.content,
        grade: data.grade,
        subject: data.subject,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const UpdateBookSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  grade: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
});

export const updateBookChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateBookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const email = (context.claims as any)?.email ?? "";
    const emailLower = email.toLowerCase();
    const isDeveloper = emailLower === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                        emailLower.includes("debanhivillanueva@colegiomaranatha") ||
                        emailLower.includes("debanhivillanuevacolegiomaranatha");
    if (!isDeveloper) throw new Error("Acceso denegado. Solo desarrolladores pueden realizar esta acción.");

    const { error } = await supabase
      .from("books")
      .update({
        content: data.content,
        grade: data.grade,
        subject: data.subject,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

const DeleteBookSchema = z.object({
  id: z.string().uuid(),
});

export const deleteBookChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteBookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const email = (context.claims as any)?.email ?? "";
    const emailLower = email.toLowerCase();
    const isDeveloper = emailLower === "debanhivillanueva@colegiomaranatha.edu.mx" ||
                        emailLower.includes("debanhivillanueva@colegiomaranatha") ||
                        emailLower.includes("debanhivillanuevacolegiomaranatha");
    if (!isDeveloper) throw new Error("Acceso denegado. Solo desarrolladores pueden realizar esta acción.");

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

const ExtractSchema = z.object({
  base64Data: z.string(),
  mimeType: z.string(),
});

export const extractTextFromMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExtractSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API de Gemini no configurada en el servidor");

    // Gemini API endpoint for 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = "Extrae todo el texto de esta imagen o documento de manera exacta. No agregues comentarios, explicaciones, introducciones, firmas ni formato markdown. Solo devuelve el texto plano tal como aparece en el archivo. Si está vacío o no contiene texto legible, responde únicamente con un espacio en blanco.";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: data.mimeType,
                  data: data.base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error de la API de Gemini: ${res.statusText} - ${errText}`);
    }

    const json = await res.json() as any;
    const extracted = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text: extracted.trim() };
  });

async function fetchUrlContent(urlStr: string): Promise<string> {
  try {
    const response = await fetch(urlStr);
    if (!response.ok) throw new Error("No se pudo obtener el contenido de la página.");
    const html = await response.text();
    // Simple text extraction from HTML
    const cleanText = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleanText) throw new Error("La página no tiene texto legible.");
    return cleanText.slice(0, 12000); // Limit to 12k characters
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Error al descargar el contenido del enlace. Asegúrate de que la URL sea pública.");
  }
}

const CustomQuizSchema = z.object({
  content: z.string().min(1),
  count: z.number().int().min(3).max(10).default(5),
  level: z.string().max(60).optional(),
  subject: z.string().max(60).optional(),
  sourceType: z.enum(["text", "file", "link"]),
  sourceName: z.string().optional(),
});

export const generateCustomQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CustomQuizSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API de Gemini no configurada en el servidor");

    let finalContent = data.content;
    if (data.sourceType === "link") {
      finalContent = await fetchUrlContent(data.content);
    }

    const langLabel = "Spanish";
    const levelClause = data.level ? ` Target school level: ${data.level}.` : "";
    const subjectClause = data.subject ? ` Academic subject field: ${data.subject}.` : "";
    
    const systemInstruction = `Eres un creador de exámenes académicos profesional. Genera un examen estructurado de opción múltiple de ${data.count} preguntas en el idioma ${langLabel}.${levelClause}${subjectClause} Cada pregunta debe tener 4 opciones, y exactamente una de ellas debe ser correcta.`;
    const userPrompt = `Basándote únicamente en el siguiente material académico provisto por el estudiante, genera el examen:\n\n${finalContent}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              questions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    q: { type: "STRING" },
                    options: { type: "ARRAY", items: { type: "STRING" } },
                    correctIndex: { type: "INTEGER" },
                    explanation: { type: "STRING" }
                  },
                  required: ["q", "options", "correctIndex", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        },
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error de Gemini: ${res.statusText} - ${errText}`);
    }

    const json = await res.json() as any;
    const questionsText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!questionsText) throw new Error("La IA no generó ninguna respuesta.");

    let parsed;
    try {
      parsed = JSON.parse(questionsText);
    } catch (e) {
      throw new Error("La IA devolvió un formato no válido.");
    }

    if (!parsed.questions || parsed.questions.length === 0) {
      throw new Error("El examen devuelto por la IA no tiene preguntas válidas.");
    }

    const quizTopic = data.sourceName || "Material Personalizado (Pro)";
    const { data: row, error } = await supabase.from("quizzes").insert({
      user_id: userId,
      category: "language",
      topic: quizTopic,
      questions: parsed.questions,
      language: "es"
    }).select("id").single();

    if (error) throw new Error(error.message);
    return { quizId: row.id };
  });


