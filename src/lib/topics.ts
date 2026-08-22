export type Cat = "career" | "toefl" | "cambridge" | "logic" | "math" | "language" | "chemistry" | "paa" | "exani";
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
  paa: {
    es: [
      "Lectura: Vocabulario en Contexto e Inferencias",
      "Lectura: Análisis Literario y Figuras Retóricas",
      "Redacción: Operaciones (Generalizar, Omitir, Adición)",
      "Matemáticas: Aritmética, Descuentos y Desigualdades",
      "Matemáticas: Álgebra, Geometría y Rectas",
      "Matemáticas: Estadística y Probabilidad",
      "Inglés: Gramática y Comprensión de Textos Breves",
      "Simulador Completo PAA (College Board)",
    ],
    en: [
      "Reading: Vocabulary in Context & Inferences",
      "Reading: Literary Analysis & Rhetoric",
      "Writing: Text Operations (Generalize, Delete, Add)",
      "Math: Arithmetic, Discounts & Inequalities",
      "Math: Algebra, Geometry & Lines",
      "Math: Statistics & Probability",
      "English: Grammar & Short Passage Comprehension",
      "Full PAA Simulator (College Board)",
    ],
    fr: [
      "Lecture : Vocabulaire en contexte et inférences",
      "Lecture : Analyse littéraire et figures",
      "Rédaction : Opérations sur le texte",
      "Maths : Arithmétique, réductions et inégalités",
      "Maths : Algèbre, géométrie et droites",
      "Maths : Statistiques et probabilités",
      "Anglais : Grammaire et compréhension",
      "Simulateur complet PAA (College Board)",
    ],
  },
  exani: {
    es: [
      "Comprensión Lectora",
      "Redacción Indirecta",
      "Pensamiento Matemático",
      "Inglés (Diagnóstico)",
      "Módulo: Ciencias de la Salud (Biología y Química)",
      "Módulo: Ingenierías (Física y Matemáticas)",
      "Módulo: Administración y Economía",
      "Simulador General EXANI-II (Ceneval)",
    ],
    en: [
      "Reading Comprehension",
      "Indirect Writing",
      "Mathematical Thinking",
      "English (Diagnostic)",
      "Module: Health Sciences (Biology & Chemistry)",
      "Module: Engineering (Physics & Math)",
      "Module: Business & Economics",
      "EXANI-II General Simulator (Ceneval)",
    ],
    fr: [
      "Compréhension de lecture",
      "Rédaction indirecte",
      "Pensée mathématique",
      "Anglais (Diagnostique)",
      "Module : Sciences de la santé",
      "Module : Ingénierie (Physique et Maths)",
      "Module : Administration et Économie",
      "Simulateur général EXANI-II",
    ],
  },
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
  chemistry: {
    es: ["Estructura atómica", "Tabla periódica", "Enlaces químicos", "Reacciones químicas", "Estequiometría", "Estados de la materia", "Ácidos y bases", "Química orgánica básica"],
    en: ["Atomic structure", "Periodic table", "Chemical bonds", "Chemical reactions", "Stoichiometry", "States of matter", "Acids and bases", "Basic organic chemistry"],
    fr: ["Structure atomique", "Tableau périodique", "Liaisons chimiques", "Réactions chimiques", "Stoechiométrie", "États de la matière", "Acides et bases", "Chimie organique de base"],
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
