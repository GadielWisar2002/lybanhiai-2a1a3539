import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SCHOOL_SUBJECTS } from "./school-subjects-data";

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

  const lines = clean.split("\n");
  const extractedBullets = lines
    .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().startsWith("*"))
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 10);

  const keyPoints =
    extractedBullets.length >= 3
      ? extractedBullets.slice(0, 5)
      : [
          firstPara.slice(0, 140) + "...",
          "Lee atentamente los conceptos principales del apunte para responder las preguntas.",
          "Cada pregunta está basada al 100% en las frases y definiciones de este texto.",
        ];

  const topics = lines
    .filter((l) => l.length > 5 && l.length < 60 && !l.includes("."))
    .slice(0, 4);

  return {
    title: titleHint || "Mis Apuntes de Estudio",
    detectedTopics: topics.length > 0 ? topics : ["Conceptos principales", "Definiciones del texto"],
    summaryExplanation: firstPara.length > 400 ? firstPara.slice(0, 400) + "..." : firstPara,
    keyPoints,
    sourceText: text,
  };
}

// Smart local question generator from raw notes (strictly from sentences of the text)
function generateLocalFallbackQuestions(text: string, count: number): StudyQuestion[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 180);

  const questions: StudyQuestion[] = [];

  sentences.slice(0, count).forEach((sentence, idx) => {
    const words = sentence.split(/\s+/).filter((w) => w.length > 4 && !w.includes(","));
    if (words.length > 0 && idx % 2 === 0) {
      // Fill-in-the-blank question strictly from sentence
      const targetWord = words[Math.min(2, words.length - 1)];
      const questionText = sentence.replace(new RegExp(`\\b${targetWord}\\b`, "i"), "________");
      const distractors = ["invariable", "secundario", "artificial", "opcional"].filter(
        (d) => d.toLowerCase() !== targetWord.toLowerCase()
      );

      const options = [targetWord, ...distractors.slice(0, 3)].sort(() => 0.5 - Math.random());
      questions.push({
        id: `local_q_${idx + 1}`,
        type: "fill_blank",
        concept: `Concepto del apunte (${targetWord})`,
        question: `De acuerdo a tu apunte: "${questionText}"`,
        options,
        correctAnswer: targetWord,
        correctIndex: options.indexOf(targetWord),
        explanation: `¿Por qué? Como se explica directamente en el apunte: "${sentence}".`,
      });
    } else {
      // True/False question directly from sentence
      questions.push({
        id: `local_q_${idx + 1}`,
        type: "true_false",
        concept: `Afirmación del texto`,
        question: `Según la explicación: "${sentence}"`,
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: `¿Por qué? Esta afirmación aparece textualmente en la explicación de tu material de estudio.`,
      });
    }
  });

  if (questions.length === 0) {
    questions.push({
      id: "fallback_1",
      type: "multiple_choice",
      concept: "Comprensión del Texto",
      question: "¿Cuál es el propósito del material de estudio leído?",
      options: [
        "Comprender y practicar los conceptos explicados en el texto",
        "Aprender datos externos no mencionados",
        "Memorizar información no explicada",
        "Ninguna de las anteriores",
      ],
      correctAnswer: "Comprender y practicar los conceptos explicados en el texto",
      correctIndex: 0,
      explanation: "¿Por qué? El material está diseñado para fijar los conceptos explicados.",
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
    // 1. Check if it matches any School Subject topic
    for (const sub of SCHOOL_SUBJECTS) {
      for (const top of sub.topics) {
        if (
          top.explanation.trim() === data.content.trim() ||
          top.name.toLowerCase() === data.sourceName?.toLowerCase()
        ) {
          return {
            title: `${sub.name}: ${top.name}`,
            detectedTopics: [top.name, "Conceptos clave", "Fórmulas y Ejemplos"],
            summaryExplanation: top.explanation,
            keyPoints: top.keyPoints,
            sourceText: top.explanation,
            isPreset: true,
            presetId: top.id,
          } as StudyAnalysisResult;
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyInvalid = !apiKey || apiKey.includes("YourKeyHere") || apiKey.length < 15;

    if (isApiKeyInvalid) {
      return smartLocalAnalysis(data.content, data.sourceName);
    }

    try {
      const systemInstruction = `Eres un tutor pedagógico experto para estudiantes. 
Analiza el material de estudio provisto y genera:
1. Un título claro del tema.
2. 3 a 5 subtemas clave detectados en el texto.
3. Una explicación clara, corta y sencilla (máximo 2 párrafos).
4. 4 a 6 viñetas con "Lo más importante".

🚨 REGLA ESTRICTA: Basa todo única y estrictamente en la información que aparece en el texto provisto. No agregues datos ajenos.`;

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

      if (!res.ok) return smartLocalAnalysis(data.content, data.sourceName);

      const json = (await res.json()) as any;
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return smartLocalAnalysis(data.content, data.sourceName);

      const parsed = JSON.parse(rawText);
      return {
        title: parsed.title || data.sourceName || "Tema de Estudio",
        detectedTopics: parsed.detectedTopics?.length ? parsed.detectedTopics : ["Conceptos Clave"],
        summaryExplanation: parsed.summaryExplanation || "Resumen del material.",
        keyPoints: parsed.keyPoints?.length ? parsed.keyPoints : ["Repasa los conceptos del texto."],
        sourceText: data.content,
      } as StudyAnalysisResult;
    } catch {
      return smartLocalAnalysis(data.content, data.sourceName);
    }
  });

// -------------------------------------------------------------
// 2. GENERATE STUDY GAME QUESTIONS (REGLA: NO PREGUNTES LO QUE NO EXPLICASTE)
// -------------------------------------------------------------
const GenerateQuestionsSchema = z.object({
  materialText: z.string().min(1),
  topicName: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  count: z.number().int().min(3).max(20).default(5),
});

export const generateStudyGameQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateQuestionsSchema.parse(input))
  .handler(async ({ data }) => {
    // 1. Check in SCHOOL_SUBJECTS database for instant zero-latency match
    for (const sub of SCHOOL_SUBJECTS) {
      for (const top of sub.topics) {
        if (
          top.explanation.trim() === data.materialText.trim() ||
          (data.topicName && (data.topicName.toLowerCase().includes(top.name.toLowerCase()) || top.name.toLowerCase().includes(data.topicName.toLowerCase())))
        ) {
          const qPool = [...top.presetQuestions].sort(() => 0.5 - Math.random());
          return {
            questions: qPool.slice(0, data.count),
          };
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyInvalid = !apiKey || apiKey.includes("YourKeyHere") || apiKey.length < 15;

    if (isApiKeyInvalid) {
      return {
        questions: generateLocalFallbackQuestions(data.materialText, data.count),
      };
    }

    try {
      const systemInstruction = `Eres un creador pedagógico de preguntas de estudio para estudiantes.

🚨 REGLA PRINCIPAL DE ORO: "NO PREGUNTES LO QUE NO EXPLICASTE"
1. NUNCA hagas una pregunta sobre información, personajes, fechas, fórmulas o hechos que NO aparezcan explícitamente en el texto del material provisto.
2. Todas las respuestas correctas DEBEN poder encontrarse directamente leyendo la explicación del apunte.
3. ESTÁ PROHIBIDO usar conocimientos generales de Internet, datos externos o cultura general que no esté escrita en el texto.
4. Si la explicación no menciona un dato específico, NO lo preguntes bajo ninguna circunstancia.
5. Cada pregunta debe incluir una explicación didáctica que inicie con "¿Por qué? " citando la parte exacta del apunte donde se explica la respuesta.
6. Tipos de preguntas:
   - "multiple_choice" (4 opciones claras, exactamente una correcta según el texto)
   - "true_false" (evaluando directamente una frase o hecho del texto)
   - "fill_blank" (completar una frase textual del apunte con ________)`;

      const userPrompt = `Material de estudio del estudiante (SOLO puedes preguntar cosas que aparezcan aquí):\n\n${data.materialText}`;

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
// 3. GENERATE REVIEW QUESTIONS (PRACTICAR MIS ERRORES)
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
            `${i + 1}. Concepto: ${f.concept} | Pregunta: "${f.question}" | Respuesta correcta en el texto: "${f.correctAnswer}"`
        )
        .join("\n");

      const systemInstruction = `Eres un tutor de repaso para estudiantes.
El estudiante falló en estos conceptos:
${failedContext}

🚨 REGLA ESTRICTA: Genera exactamente ${data.count} preguntas de refuerzo basadas ÚNICA Y EXCLUSIVAMENTE en el texto del material provisto.
No inventes datos externos. Todas las respuestas deben estar explicadas en el texto.`;

      const userPrompt = `Material de estudio original:\n${data.materialText}`;

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
