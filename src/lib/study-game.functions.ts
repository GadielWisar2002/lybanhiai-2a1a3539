import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "match_concepts" | "order_steps";

export interface StudyQuestion {
  id: string;
  type: QuestionType;
  concept: string; // The core concept tested (e.g. "La mitocondria", "Definición de célula")
  question: string;
  options: string[]; // Options or choices
  correctAnswer: string | number; // index or text
  correctIndex?: number;
  explanation: string;
  // Specific payload for match_concepts or order_steps if applicable
  matchingPairs?: { term: string; definition: string }[];
  stepsToOrder?: string[];
}

export interface StudyAnalysisResult {
  title: string;
  detectedTopics: string[];
  summaryExplanation: string;
  keyPoints: string[];
  sourceText: string;
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API de Gemini no configurada en el servidor");

    const systemInstruction = `Eres un tutor pedagógico experto para estudiantes de secundaria y preparatoria. 
Tu tarea es analizar el material de estudio provisto por el estudiante y generar:
1. Un título claro y atractivo del tema.
2. Una lista de 3 a 5 subtemas clave detectados en el texto.
3. Una explicación clara, corta, sencilla y pedagógica del tema (máximo 2 párrafos breves, sin lenguaje universitario rebuscado).
4. Una lista de 4 a 6 puntos clave esenciales ("Lo más importante") en viñetas directas.

Reglas estrictas:
- Basa todo estrictamente en la información provista en el texto.
- No inventes conceptos ajenos ni agregues información no verificable en el texto.
- Usa un tono motivador, educativo y juvenil.`;

    const userPrompt = `Material de estudio del estudiante:\n\n${data.content}`;

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
      const errText = await res.text();
      throw new Error(`Error al analizar el material con IA: ${res.statusText} - ${errText}`);
    }

    const json = (await res.json()) as any;
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("La IA no devolvió ningún análisis.");

    let parsed: {
      title: string;
      detectedTopics: string[];
      summaryExplanation: string;
      keyPoints: string[];
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("El formato devuelto por la IA no pudo ser procesado.");
    }

    return {
      title: parsed.title || data.sourceName || "Tema de Estudio",
      detectedTopics: parsed.detectedTopics?.length ? parsed.detectedTopics : ["Conceptos Generales"],
      summaryExplanation: parsed.summaryExplanation || "Resumen del material de estudio.",
      keyPoints: parsed.keyPoints?.length ? parsed.keyPoints : ["Repasa los conceptos clave del apunte."],
      sourceText: data.content,
    } as StudyAnalysisResult;
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API de Gemini no configurada en el servidor");

    const difficultyPrompt =
      data.difficulty === "easy"
        ? "Nivel FÁCIL: Preguntas directas sobre hechos, definiciones y conceptos textuales presentes en el apunte."
        : data.difficulty === "medium"
        ? "Nivel MEDIO: Preguntas que requieran comprender relaciones, funciones y diferencias entre conceptos del apunte."
        : "Nivel DIFÍCIL: Preguntas que requieran analizar escenarios, aplicar las ideas del apunte o deducir conclusiones lógicas basadas estrictamente en él.";

    const systemInstruction = `Eres un diseñador de juegos educativos interactivos. 
Tu objetivo es crear exactamente ${data.count} preguntas didácticas, divertidas y claras basadas ÚNICAMENTE en el material provisto.

REGLAS CRUCIALES:
1. NO INVENTES información que no aparezca o no se pueda deducir directamente del material.
2. Dificultad: ${difficultyPrompt}.
3. Tipos de preguntas variadas y dinámicas:
   - "multiple_choice": Pregunta clásica con 4 opciones claras y una sola correcta.
   - "true_false": Afirmación clara donde las opciones son exactamente ["Verdadero", "Falso"].
   - "fill_blank": Frase con espacio en blanco (ej. "La _____ es la unidad básica...") con 4 palabras posibles como opciones.
   - "match_concepts": (Opcional si aplica) 3 parejas de conceptos y definiciones cortas.
   - "order_steps": (Opcional si aplica un proceso secuencial) 3 o 4 pasos ordenados.
4. Para cada pregunta proporciona:
   - concept: El concepto específico evaluado (ej. "Función del núcleo", "Definición de velocidad", "Tratado de Versalles").
   - explanation: Una explicación corta, amable y directa que inicie con "¿Por qué? " aclarando el concepto para que el estudiante aprenda si se equivoca.`;

    const userPrompt = `Tema: ${data.topicName || "General"}\n\nMaterial de estudio:\n${data.materialText}`;

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
                      enum: ["multiple_choice", "true_false", "fill_blank", "match_concepts", "order_steps"],
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
      const errText = await res.text();
      throw new Error(`Error al generar preguntas con IA: ${res.statusText} - ${errText}`);
    }

    const json = (await res.json()) as any;
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("La IA no devolvió preguntas.");

    let parsed: { questions: StudyQuestion[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("El formato devuelto por la IA no pudo ser procesado.");
    }

    if (!parsed.questions || parsed.questions.length === 0) {
      throw new Error("No se pudieron generar preguntas válidas a partir del material provisto.");
    }

    return {
      questions: parsed.questions.map((q, idx) => ({
        ...q,
        id: q.id || `gen_q_${idx + 1}`,
        correctAnswer: q.options[q.correctIndex ?? 0] ?? "",
      })),
    };
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
    if (!apiKey) throw new Error("API de Gemini no configurada en el servidor");

    const failedContext = data.failedQuestionsSummary
      .map(
        (f, i) =>
          `${i + 1}. Concepto: ${f.concept} | Pregunta fallada: "${f.question}" | Respuesta del alumno: "${f.userAnswer}" | Respuesta correcta: "${f.correctAnswer}"`
      )
      .join("\n");

    const systemInstruction = `Eres un tutor pedagógico especializado en refuerzo de errores. 
El estudiante falló preguntas en los siguientes conceptos específicos:
${failedContext}

Tu tarea es generar exactamente ${data.count} preguntas NUEVAS Y DIDÁCTICAS diseñadas específicamente para ayudar al estudiante a comprender y dominar estos conceptos que falló.

Reglas estrictas:
1. Diseña preguntas claras, explicativas y orientadas al aprendizaje (opción múltiple o verdadero/falso).
2. Cada explicación debe ser clarísima y enseñar el concepto exacto.
3. Basa todo estrictamente en el material provisto.`;

    const userPrompt = `Material de estudio original:\n${data.materialText}\n\nConceptos a reforzar:\n${data.failedConcepts.join(", ")}`;

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
      const errText = await res.text();
      throw new Error(`Error al generar preguntas de repaso: ${res.statusText} - ${errText}`);
    }

    const json = (await res.json()) as any;
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("La IA no devolvió preguntas de repaso.");

    let parsed: { questions: StudyQuestion[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("Error en el formato de preguntas de repaso.");
    }

    return {
      questions: parsed.questions.map((q, idx) => ({
        ...q,
        id: q.id || `rev_q_${idx + 1}`,
        correctAnswer: q.options[q.correctIndex ?? 0] ?? "",
      })),
    };
  });
