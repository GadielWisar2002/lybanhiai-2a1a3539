export type InteractionType =
  | "multiple-choice"
  | "drag-drop"
  | "match-concepts"
  | "fill-blanks"
  | "order-process"
  | "step-by-step"
  | "reading"
  | "listening";

export type Level = "secundaria" | "preparatoria" | "admision" | "toefl" | "cambridge" | "universidad";

export type Subject =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "spanish"
  | "english"
  | "logic"
  | "programming";

export interface BaseQuestion {
  id: string;
  type: InteractionType;
  level: Level;
  subject: Subject;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
  correctIndex: number;
}

export interface DragDropQuestion extends BaseQuestion {
  type: "drag-drop";
  dragItems: string[];
  dropZones: { id: string; label: string; expectedItem: string }[];
}

export interface MatchConceptsQuestion extends BaseQuestion {
  type: "match-concepts";
  pairs: { term: string; definition: string }[];
}

export interface FillBlanksQuestion extends BaseQuestion {
  type: "fill-blanks";
  textWithBlanks: string; // e.g. "El agua está compuesta por [blank1] y [blank2]."
  correctAnswers: string[]; // e.g. ["Hidrógeno", "Oxígeno"]
}

export interface OrderProcessQuestion extends BaseQuestion {
  type: "order-process";
  steps: string[]; // steps in incorrect order
  correctOrder: string[]; // steps in correct order
}

export interface StepByStepQuestion extends BaseQuestion {
  type: "step-by-step";
  steps: { prompt: string; options: string[]; correctIndex: number }[];
}

export interface ReadingQuestion extends BaseQuestion {
  type: "reading";
  readingText: string;
  options: string[];
  correctIndex: number;
}

export interface ListeningQuestion extends BaseQuestion {
  type: "listening";
  audioText: string; // The text to read via SpeechSynthesis
  options: string[];
  correctIndex: number;
}

export type Question =
  | MultipleChoiceQuestion
  | DragDropQuestion
  | MatchConceptsQuestion
  | FillBlanksQuestion
  | OrderProcessQuestion
  | StepByStepQuestion
  | ReadingQuestion
  | ListeningQuestion;

export const QUESTIONS_DB: Question[] = [
  // 1. OPCION MULTIPLE (Math / Preparatoria)
  {
    id: "m_mc_1",
    type: "multiple-choice",
    level: "preparatoria",
    subject: "math",
    topic: "Álgebra",
    subtopic: "Ecuaciones de segundo grado",
    difficulty: "medium",
    prompt: "¿Cuál es el valor de x en la ecuación x² - 5x + 6 = 0?",
    options: ["x = 2, x = 3", "x = -2, x = -3", "x = 1, x = 5", "x = 0, x = 6"],
    correctIndex: 0,
    explanation: "Factorizando la ecuación tenemos (x - 2)(x - 3) = 0. Por lo tanto, las soluciones son x = 2 y x = 3.",
  },
  // 2. DRAG AND DROP (Chemistry / Secundaria)
  {
    id: "c_dd_1",
    type: "drag-drop",
    level: "secundaria",
    subject: "chemistry",
    topic: "Tabla Periódica",
    subtopic: "Clasificación de elementos",
    difficulty: "easy",
    prompt: "Arrastra cada elemento químico a su categoría correspondiente:",
    dragItems: ["Helio", "Hierro", "Cloro"],
    dropZones: [
      { id: "z1", label: "Metal de Transición", expectedItem: "Hierro" },
      { id: "z2", label: "Gas Noble", expectedItem: "Helio" },
      { id: "z3", label: "Halógeno", expectedItem: "Cloro" },
    ],
    explanation: "El Hierro (Fe) es un metal de transición. El Helio (He) es un gas noble debido a su capa de valencia completa. El Cloro (Cl) pertenece al grupo de los halógenos.",
  },
  // 3. RELACIONAR CONCEPTOS (Biology / Admision)
  {
    id: "b_mc_1",
    type: "match-concepts",
    level: "admision",
    subject: "biology",
    topic: "Genética",
    subtopic: "Leyes Mendelianas",
    difficulty: "medium",
    prompt: "Relaciona cada concepto genético con su definición correcta:",
    pairs: [
      { term: "Genotipo", definition: "La constitución genética completa de un organismo." },
      { term: "Fenotipo", definition: "Las características físicas o fisiológicas observables de un individuo." },
      { term: "Alelo", definition: "Cada una de las formas alternativas que puede tener un mismo gen." },
      { term: "Homocigoto", definition: "Un individuo que posee dos alelos idénticos para un gen determinado." },
    ],
    explanation: "El Genotipo es la carga genética interna, el Fenotipo es la manifestación visible del genotipo en un ambiente, un Alelo es una versión del gen y Homocigoto implica poseer dos alelos iguales.",
  },
  // 4. COMPLETAR ESPACIOS (Physics / Universidad)
  {
    id: "p_fb_1",
    type: "fill-blanks",
    level: "universidad",
    subject: "physics",
    topic: "Termodinámica",
    subtopic: "Leyes de la Termodinámica",
    difficulty: "hard",
    prompt: "Completa los espacios en blanco sobre la Segunda Ley de la Termodinámica:",
    textWithBlanks: "La segunda ley establece que la [blank1] de un sistema aislado siempre tiende a [blank2] con el tiempo.",
    correctAnswers: ["entropía", "aumentar"],
    explanation: "La segunda ley de la termodinámica postula que en un sistema aislado, la entropía (grado de desorden molecular) siempre tiende a aumentar con el transcurso del tiempo.",
  },
  // 5. ORDENAR PROCESOS (Programming / Universidad)
  {
    id: "pr_op_1",
    type: "order-process",
    level: "universidad",
    subject: "programming",
    topic: "Algoritmos",
    subtopic: "Algoritmos de Ordenamiento",
    difficulty: "hard",
    prompt: "Ordena los pasos del algoritmo Quicksort para ordenar una lista:",
    steps: [
      "Llamar recursivamente al método con las sublistas izquierda y derecha.",
      "Dividir la lista colocando los menores a la izquierda del pivote y los mayores a la derecha.",
      "Seleccionar un elemento de la lista como pivote.",
      "Combinar las sublistas ordenadas y el pivote para obtener la lista final ordenada.",
    ],
    correctOrder: [
      "Seleccionar un elemento de la lista como pivote.",
      "Dividir la lista colocando los menores a la izquierda del pivote y los mayores a la derecha.",
      "Llamar recursivamente al método con las sublistas izquierda y derecha.",
      "Combinar las sublistas ordenadas y el pivote para obtener la lista final ordenada.",
    ],
    explanation: "Quicksort primero selecciona un pivote, luego particiona (divide) la lista en base a este, ordena las sublistas de manera recursiva y finalmente devuelve la lista ordenada consolidada.",
  },
  // 6. RESOLVER PASO A PASO (Math / Admision)
  {
    id: "m_sbs_1",
    type: "step-by-step",
    level: "admision",
    subject: "math",
    topic: "Geometría",
    subtopic: "Teorema de Pitágoras",
    difficulty: "medium",
    prompt: "Resuelve el siguiente ejercicio geométrico paso a paso: Encuentra la hipotenusa de un triángulo rectángulo cuyos catetos miden 3 cm y 4 cm.",
    steps: [
      {
        prompt: "Paso 1: Eleva al cuadrado la medida de ambos catetos (3² y 4²). ¿Cuáles son los resultados?",
        options: ["6 y 8", "9 y 16", "9 y 12", "12 y 16"],
        correctIndex: 1,
      },
      {
        prompt: "Paso 2: Suma ambos resultados (9 + 16). ¿Cuánto da la suma?",
        options: ["20", "25", "18", "30"],
        correctIndex: 1,
      },
      {
        prompt: "Paso 3: Obtén la raíz cuadrada de la suma (√25) para encontrar la hipotenusa. ¿Cuál es el resultado final?",
        options: ["5 cm", "6 cm", "4.5 cm", "7 cm"],
        correctIndex: 0,
      },
    ],
    explanation: "Aplicando c = √(a² + b²), elevamos catetos al cuadrado (9 y 16), los sumamos (25) y obtenemos la raíz cuadrada, resultando en una hipotenusa de 5 cm.",
  },
  // 7. COMPRENSION LECTORA (Spanish / Preparatoria)
  {
    id: "s_re_1",
    type: "reading",
    level: "preparatoria",
    subject: "spanish",
    topic: "Literatura",
    subtopic: "Análisis Literario",
    difficulty: "medium",
    readingText: "«Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo. Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos.» (Gabriel García Márquez, Cien años de soledad)",
    prompt: "Basándote en el fragmento anterior, ¿cómo se describe el estado físico de Macondo en su origen?",
    options: [
      "Una urbe industrial y moderna.",
      "Una aldea pequeña y rústica a la orilla de un río claro.",
      "Una zona árida y desértica azotada por la guerra.",
      "Un puerto comercial habitado por miles de personas.",
    ],
    correctIndex: 1,
    explanation: "El texto especifica que Macondo era una aldea de veinte casas de barro y cañabrava a la orilla de un río de aguas diáfanas, lo que denota un origen pequeño y rústico.",
  },
  // 8. LISTENING (English / TOEFL)
  {
    id: "e_li_1",
    type: "listening",
    level: "toefl",
    subject: "english",
    topic: "Listening Comprehension",
    subtopic: "Academic Lecture",
    difficulty: "hard",
    audioText: "Listen carefully: Photosynthesis is a chemical process that plants use to convert light energy, usually from the Sun, into chemical energy. This chemical energy is stored in carbohydrate molecules, such as sugars, which are synthesized from carbon dioxide and water. In most cases, oxygen is also released as a waste product.",
    prompt: "Based on the audio lecture, what is released as a waste product during photosynthesis?",
    options: ["Carbon dioxide", "Oxygen", "Water", "Sugars"],
    correctIndex: 1,
    explanation: "The lecture states: 'In most cases, oxygen is also released as a waste product.'",
  },
  // 9. OPCION MULTIPLE (Logic / Secundaria)
  {
    id: "l_mc_1",
    type: "multiple-choice",
    level: "secundaria",
    subject: "logic",
    topic: "Silogismos",
    subtopic: "Razonamiento Deductivo",
    difficulty: "easy",
    prompt: "Si todos los hombres son mortales, y Sócrates es un hombre. ¿Qué conclusión lógica se deduce?",
    options: [
      "Sócrates es inmortal",
      "Sócrates es mortal",
      "Todos los hombres son Sócrates",
      "Sócrates no es un hombre",
    ],
    correctIndex: 1,
    explanation: "Por deducción del silogismo clásico: Premisa mayor (Todos los hombres son mortales) + Premisa menor (Sócrates es hombre) = Conclusión (Sócrates es mortal).",
  },
  // 10. LISTENING (English / Cambridge)
  {
    id: "e_li_2",
    type: "listening",
    level: "cambridge",
    subject: "english",
    topic: "Listening Skills",
    subtopic: "Daily Conversations",
    difficulty: "medium",
    audioText: "Listen carefully: Hello! I'm planning to catch the train to London tomorrow at nine in the morning. However, the travel agency told me there might be a strike, so I might have to take the bus instead, which departs at nine thirty.",
    prompt: "At what time does the bus depart if the train is unavailable?",
    options: ["9:00 AM", "9:30 AM", "10:00 AM", "8:30 AM"],
    correctIndex: 1,
    explanation: "The speaker mentions that the bus departs at nine thirty (9:30 AM).",
  },
  // 11. COMPLETAR ESPACIOS (History / Secundaria)
  {
    id: "h_fb_1",
    type: "fill-blanks",
    level: "secundaria",
    subject: "history",
    topic: "Revolución Mexicana",
    subtopic: "Etapas de la Revolución",
    difficulty: "medium",
    prompt: "Completa los datos históricos de la Revolución Mexicana:",
    textWithBlanks: "La Revolución Mexicana inició el 20 de noviembre de [blank1], convocada por [blank2] bajo el Plan de San Luis.",
    correctAnswers: ["1910", "Francisco I. Madero"],
    explanation: "Francisco I. Madero promulgó el Plan de San Luis convocando a levantarse en armas el 20 de noviembre de 1910 contra el régimen de Porfirio Díaz.",
  },
  // 12. RELACIONAR CONCEPTOS (Geography / Secundaria)
  {
    id: "g_mc_1",
    type: "match-concepts",
    level: "secundaria",
    subject: "geography",
    topic: "Geografía Física",
    subtopic: "Capas de la Tierra",
    difficulty: "easy",
    prompt: "Relaciona cada capa de la Tierra con su descripción correspondiente:",
    pairs: [
      { term: "Corteza", definition: "La capa más superficial y delgada donde habitamos." },
      { term: "Manto", definition: "Capa intermedia compuesta por roca fundida y magma." },
      { term: "Núcleo", definition: "Capa más interna compuesta principalmente de hierro y níquel sólido/líquido." },
    ],
    explanation: "La Corteza es la capa exterior, el Manto está en medio con magma fluido, y el Núcleo es el centro supercaliente de metales pesados.",
  }
];

export function getQuestionsByFilters(filters: {
  level?: Level;
  subject?: Subject;
  difficulty?: "easy" | "medium" | "hard";
  type?: InteractionType;
}): Question[] {
  return QUESTIONS_DB.filter((q) => {
    if (filters.level && q.level !== filters.level) return false;
    if (filters.subject && q.subject !== filters.subject) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.type && q.type !== filters.type) return false;
    return true;
  });
}

export function getRandomQuestion(filters: {
  level?: Level;
  subject?: Subject;
  difficulty?: "easy" | "medium" | "hard";
  type?: InteractionType;
}): Question | null {
  const candidates = getQuestionsByFilters(filters);
  if (candidates.length === 0) {
    // Fallback: return any question if no candidates match filters
    return QUESTIONS_DB[Math.floor(Math.random() * QUESTIONS_DB.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}
