export type Cat = "career" | "toefl" | "cambridge" | "logic" | "math" | "language";
export type Lang = "es" | "en" | "fr";

export const LEVELS: Record<Lang, { value: string; label: string }[]> = {
  es: [
    { value: "3º secundaria", label: "3º Secundaria" },
    { value: "1º preparatoria", label: "1º Preparatoria" },
    { value: "2º preparatoria", label: "2º Preparatoria" },
    { value: "3º preparatoria", label: "3º Preparatoria" },
  ],
  en: [
    { value: "9th grade", label: "9th Grade" },
    { value: "10th grade", label: "10th Grade" },
    { value: "11th grade", label: "11th Grade" },
    { value: "12th grade", label: "12th Grade" },
  ],
  fr: [
    { value: "3e", label: "3e (collège)" },
    { value: "2nde", label: "Seconde" },
    { value: "1ère", label: "Première" },
    { value: "Terminale", label: "Terminale" },
  ],
};

export const TOPICS: Record<Cat, Record<Lang, string[]>> = {
  math: {
    es: ["Números reales", "Polinomios", "Factorización", "Ecuaciones cuadráticas", "Funciones lineales", "Razones y proporciones", "Trigonometría básica", "Probabilidad"],
    en: ["Real numbers", "Polynomials", "Factoring", "Quadratic equations", "Linear functions", "Ratios and proportions", "Basic trigonometry", "Probability"],
    fr: ["Nombres réels", "Polynômes", "Factorisation", "Équations quadratiques", "Fonctions linéaires", "Ratios et proportions", "Trigonométrie de base", "Probabilité"],
  },
  logic: {
    es: ["Series numéricas", "Analogías", "Deducción", "Acertijos", "Patrones visuales", "Silogismos"],
    en: ["Number series", "Analogies", "Deduction", "Riddles", "Visual patterns", "Syllogisms"],
    fr: ["Séries numériques", "Analogies", "Déduction", "Énigmes", "Motifs visuels", "Syllogismes"],
  },
  language: {
    es: ["Comprensión lectora", "Sinónimos y antónimos", "Gramática", "Ortografía", "Vocabulario"],
    en: ["Reading comprehension", "Synonyms and antonyms", "Grammar", "Spelling", "Vocabulary"],
    fr: ["Compréhension écrite", "Synonymes et antonymes", "Grammaire", "Orthographe", "Vocabulaire"],
  },
  toefl: {
    es: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
    en: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
    fr: ["Reading", "Listening", "Grammar", "Vocabulary", "Idioms"],
  },
  cambridge: {
    es: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
    en: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
    fr: ["B2 Reading", "B2 Use of English", "C1 Reading", "C1 Writing", "Phrasal verbs"],
  },
  career: {
    es: ["Aptitud general", "Intereses vocacionales", "Habilidades blandas", "Razonamiento abstracto"],
    en: ["General aptitude", "Vocational interests", "Soft skills", "Abstract reasoning"],
    fr: ["Aptitude générale", "Intérêts professionnels", "Compétences interpersonnelles", "Raisonnement abstrait"],
  },
};
