import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRESET_STUDY_TOPICS } from "./preset-study-materials";

export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "match_concepts" | "order_steps";

export interface StudyQuestion {
  id: string;
  type: QuestionType;
  concept: string;
  question: string;
  options: string[];
  correctAnswer: string | number;
  correctIndex?: number;
  explanation: string;
}

export interface StudyAnalysisResult {
  title: string;
  detectedTopics: string[];
  summaryExplanation: string;
  keyPoints: string[];
  sourceText: string;
  isPreset?: boolean;
  presetId?: string;
}

// Smart local fallback parser when Gemini API key is missing or invalid
function smartLocalAnalysis(text: string, titleHint?: string): StudyAnalysisResult {
  const clean = text.trim();
  const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 15);
  const firstPara = paragraphs[0] || clean.slice(0, 300);

  // Extract lines starting with "-" or "•" as keypoints
  const lines = clean.split("\n");
  const extractedBullets = lines
    .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().startsWith("*"))
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 10);

  const keyPoints =
    extractedBullets.length >= 3
      ? extractedBullets.slice(0, 5)
      : [
          firstPara.slice(0, 120) + "...",
          "Repasa las definiciones principales y conceptos clave de tu apunte.",
          "Identifica las características fundamentales mencionadas en el texto.",
          "Asegúrate de recordar los términos y sus funciones.",
        ];

  // Extract potential topics from headings or first sentences
  const topics = lines
    .filter((l) => l.length > 5 && l.length < 60 && !l.includes("."))
    .slice(0, 4);

  return {
    title: titleHint || "Mis Apuntes de Estudio",
    detectedTopics: topics.length > 0 ? topics : ["Conceptos Clave", "Definiciones Generales", "Funciones Principales"],
    summaryExplanation: firstPara.length > 400 ? firstPara.slice(0, 400) + "..." : firstPara,
    keyPoints,
    sourceText: text,
  };
}

// Smart local question generator from raw notes
function generateLocalFallbackQuestions(text: string, count: number): StudyQuestion[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 180);

  const questions: StudyQuestion[] = [];

  sentences.slice(0, count).forEach((sentence, idx) => {
    const words = sentence.split(/\s+/).filter((w) => w.length > 4 && !w.includes(","));
    if (words.length > 0 && idx % 2 === 0) {
      // Fill-in-the-blank question
      const targetWord = words[Math.min(2, words.length - 1)];
      const questionText = sentence.replace(new RegExp(`\\b${targetWord}\\b`, "i"), "________");
      const distractors = ["invariable", "secundario", "artificial", "opcional"].filter(
        (d) => d.toLowerCase() !== targetWord.toLowerCase()
      );

      const options = [targetWord, ...distractors.slice(0, 3)].sort(() => 0.5 - Math.random());
      questions.push({
        id: `local_q_${idx + 1}`,
        type: "fill_blank",
        concept: `Concepto ${idx + 1}`,
        question: `Completa la afirmación del apunte: "${questionText}"`,
        options,
        correctAnswer: targetWord,
        correctIndex: options.indexOf(targetWord),
        explanation: `¿Por qué? Como se explica en el apunte: "${sentence}".`,
      });
    } else {
      // True/False question
      questions.push({
        id: `local_q_${idx + 1}`,
        type: "true_false",
        concept: `Afirmación ${idx + 1}`,
        question: `De acuerdo a tu apunte: "${sentence}"`,
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: `¿Por qué? Esta afirmación coincide exactamente con el texto de tus notas.`,
      });
    }
  });

  if (questions.length === 0) {
    questions.push({
      id: "fallback_1",
      type: "multiple_choice",
      concept: "Comprensión General",
      question: "¿Cuál es el objetivo principal del material de estudio cargado?",
      options: [
        "Comprender y repasar los conceptos fundamentales del tema",
        "Aprender un tema no relacionado",
        "Memorizar fechas sin contexto",
        "Ninguna de las anteriores",
      ],
      correctAnswer: "Comprender y repasar los conceptos fundamentales del tema",
      correctIndex: 0,
      explanation: "¿Por qué? El objetivo del material es fijar los conceptos clave.",
    });
  }

  return questions;
}

// -------------------------------------------------------------
// 1. ANALYZE STUDY MATERIAL
// -------------------------------------------------------------
const AnalyzeMaterialSchema = z.object({
  content: z.string().min(1),
  sourceName: z.string().optional(),
});

export const analyzeStudyMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeMaterialSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Check if it matches any Preset Topic for instant zero-latency loading
    const matchedPreset = PRESET_STUDY_TOPICS.find(
      (p) =>
        p.title.toLowerCase() === data.sourceName?.toLowerCase() ||
        p.content.trim() === data.content.trim() ||
        p.id === data.sourceName
    );

    if (matchedPreset) {
      return {
        ...matchedPreset.preAnalyzed,
        sourceText: matchedPreset.content,
        isPreset: true,
        presetId: matchedPreset.id,
      } as StudyAnalysisResult;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyInvalid = !apiKey || apiKey.includes("YourKeyHere") || apiKey.length < 15;

    // If API key is missing or dummy placeholder, use smart local analyzer
    if (isApiKeyInvalid) {
      return smartLocalAnalysis(data.content, data.sourceName);
    }

    // Call Gemini 1.5 Flash API
    try {
      const systemInstruction = `Eres un tutor pedagógico experto para estudiantes. 
Analiza el material provisto y genera:
1. Un título claro del tema.
2. 3 a 5 subtemas clave.
3. Una explicación clara, corta y sencilla (máximo 2 párrafos).
4. 4 a 6 viñetas con "Lo más importante".

Reglas: Basa todo estrictamente en el texto del apunte.`;

      const userPrompt = `Material de estudio:\n\n${data.content}`;

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
                title: { type: "STRING" },
                detectedTopics: { type: "ARRAY", items: { type: "STRING" } },
                summaryExplanation: { type: "STRING" },
                keyPoints: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["title", "detectedTopics", "summaryExplanation", "keyPoints"],
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      });

      if (!res.ok) {
        // Graceful fallback to smart local analysis without crashing the UI
        return smartLocalAnalysis(data.content, data.sourceName);
      }

      const json = (await res.json()) as any;
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return smartLocalAnalysis(data.content, data.sourceName);

      const parsed = JSON.parse(rawText);
      return {
        title: parsed.title || data.sourceName || "Tema de Estudio",
        detectedTopics: parsed.detectedTopics?.length ? parsed.detectedTopics : ["Conceptos Clave"],
        summaryExplanation: parsed.summaryExplanation || "Resumen del material de estudio.",
        keyPoints: parsed.keyPoints?.length ? parsed.keyPoints : ["Repasa los conceptos clave."],
        sourceText: data.content,
      } as StudyAnalysisResult;
    } catch {
      return smartLocalAnalysis(data.content, data.sourceName);
    }
  });

// -------------------------------------------------------------
// 2. GENERATE STUDY GAME QUESTIONS
// -------------------------------------------------------------
const GenerateQuestionsSchema = z.object({
  materialText: z.string().min(1),
  topicName: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  count: z.number().int().min(3).max(15).default(10),
});

export const generateStudyGameQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateQuestionsSchema.parse(input))
  .handler(async ({ data }) => {
    // Check preset question banks
    const matchedPreset = PRESET_STUDY_TOPICS.find(
      (p) =>
        p.content.trim() === data.materialText.trim() ||
        (data.topicName && data.topicName.toLowerCase().includes(p.title.toLowerCase()))
    );

    if (matchedPreset && matchedPreset.presetQuestions.length > 0) {
      const qPool = [...matchedPreset.presetQuestions].sort(() => 0.5 - Math.random());
      return {
        questions: qPool.slice(0, data.count),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyInvalid = !apiKey || apiKey.includes("YourKeyHere") || apiKey.length < 15;

    if (isApiKeyInvalid) {
      return {
        questions: generateLocalFallbackQuestions(data.materialText, data.count),
      };
    }

    try {
      const difficultyPrompt =
        data.difficulty === "easy"
          ? "Nivel FÁCIL: Preguntas directas sobre definiciones y hechos del apunte."
          : data.difficulty === "medium"
          ? "Nivel MEDIO: Preguntas que requieran comprender relaciones y diferencias."
          : "Nivel DIFÍCIL: Preguntas que requieran aplicar o analizar la información del apunte.";

      const systemInstruction = `Crea exactamente ${data.count} preguntas educativas y dinámicas basadas 100% en el material provisto.
Dificultad: ${difficultyPrompt}
Tipos de preguntas:
- "multiple_choice" (4 opciones)
- "true_false" (exactamente ["Verdadero", "Falso"])
- "fill_blank" (frase con espacio en blanco)
Cada pregunta debe incluir: concept, question, options, correctIndex, explanation (iniciando con "¿Por qué? ").`;

      const userPrompt = `Material:\n${data.materialText}`;

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
                      id: { type: "STRING" },
                      type: {
                        type: "STRING",
                        enum: ["multiple_choice", "true_false", "fill_blank"],
                      },
                      concept: { type: "STRING" },
                      question: { type: "STRING" },
                      options: { type: "ARRAY", items: { type: "STRING" } },
                      correctIndex: { type: "INTEGER" },
                      explanation: { type: "STRING" },
                    },
                    required: ["id", "type", "concept", "question", "options", "correctIndex", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      });

      if (!res.ok) {
        return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };
      }

      const json = (await res.json()) as any;
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };
      }

      const parsed = JSON.parse(rawText);
      return {
        questions: parsed.questions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `gen_q_${idx + 1}`,
          correctAnswer: q.options[q.correctIndex ?? 0] ?? "",
        })),
      };
    } catch {
      return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };
    }
  });

// -------------------------------------------------------------
// 3. GENERATE REVIEW QUESTIONS (PRACTICAR LO QUE FALLÉ)
// -------------------------------------------------------------
const GenerateReviewSchema = z.object({
  materialText: z.string().min(1),
  failedConcepts: z.array(z.string()).min(1),
  failedQuestionsSummary: z.array(
    z.object({
      question: z.string(),
      concept: z.string(),
      userAnswer: z.string(),
      correctAnswer: z.string(),
    })
  ),
  count: z.number().int().min(2).max(10).default(5),
});

export const generateReviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyInvalid = !apiKey || apiKey.includes("YourKeyHere") || apiKey.length < 15;

    if (isApiKeyInvalid) {
      return {
        questions: generateLocalFallbackQuestions(data.materialText, data.count),
      };
    }

    try {
      const failedContext = data.failedQuestionsSummary
        .map(
          (f, i) =>
            `${i + 1}. Concepto: ${f.concept} | Pregunta: "${f.question}" | Respuesta correcta: "${f.correctAnswer}"`
        )
        .join("\n");

      const systemInstruction = `Crea exactamente ${data.count} preguntas de repaso didácticas enfocadas exclusivamente en estos conceptos que el estudiante falló:
${failedContext}
Basa todo en el material provisto.`;

      const userPrompt = `Material:\n${data.materialText}`;

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
                      id: { type: "STRING" },
                      type: {
                        type: "STRING",
                        enum: ["multiple_choice", "true_false", "fill_blank"],
                      },
                      concept: { type: "STRING" },
                      question: { type: "STRING" },
                      options: { type: "ARRAY", items: { type: "STRING" } },
                      correctIndex: { type: "INTEGER" },
                      explanation: { type: "STRING" },
                    },
                    required: ["id", "type", "concept", "question", "options", "correctIndex", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      });

      if (!res.ok) {
        return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };
      }

      const json = (await res.json()) as any;
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };

      const parsed = JSON.parse(rawText);
      return {
        questions: parsed.questions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `rev_q_${idx + 1}`,
          correctAnswer: q.options[q.correctIndex ?? 0] ?? "",
        })),
      };
    } catch {
      return { questions: generateLocalFallbackQuestions(data.materialText, data.count) };
    }
  });
