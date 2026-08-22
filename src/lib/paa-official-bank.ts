export interface PAAQuestion {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  section: "lectura" | "redaccion" | "matematicas" | "ingles";
  subtopic: string;
}

export const PAA_OFFICIAL_QUESTIONS: PAAQuestion[] = [
  // ==========================================
  // 1. LECTURA — Vocabulario en contexto e inferencias
  // ==========================================
  {
    q: 'Texto breve: "Cuando Marta llegó al taller, notó que su bicicleta vieja aún **guardaba** el mismo color azul desvaído de su niñez. No la había tocado en años, pero al verla sintió que el tiempo se **plegaba** sobre sí mismo."\n\nEn el texto, la palabra "guardaba" se usa en el sentido de:',
    options: [
      "proteger de un peligro",
      "conservar o mantener",
      "reservar para más tarde",
      "esconder algo",
    ],
    correctIndex: 1,
    explanation: 'La palabra "guardaba" en este contexto se refiere a que la bicicleta aún conservaba o mantenía el color original de su niñez.',
    section: "lectura",
    subtopic: "Vocabulario en Contexto",
  },
  {
    q: 'Texto breve: "Cuando Marta llegó al taller, notó que su bicicleta vieja aún **guardaba** el mismo color azul desvaído de su niñez. No la había tocado en años, pero al verla sintió que el tiempo se **plegaba** sobre sí mismo."\n\nLa expresión "el tiempo se plegaba sobre sí mismo" sugiere que Marta sintió:',
    options: [
      "miedo de envejecer",
      "que el pasado y el presente se mezclaban en su mente",
      "que había perdido la noción del tiempo por cansancio",
      "curiosidad por el mecanismo de la bicicleta",
    ],
    correctIndex: 1,
    explanation: 'La metáfora del tiempo que se pliega sugiere que la distancia temporal desaparece, haciendo que los recuerdos del pasado y el momento presente se unan.',
    section: "lectura",
    subtopic: "Ideas Implícitas e Inferencias",
  },
  {
    q: 'Texto breve: "Cuando Marta llegó al taller, notó que su bicicleta vieja aún **guardaba** el mismo color azul desvaído de su niñez. No la había tocado en años, pero al verla sintió que el tiempo se **plegaba** sobre sí mismo."\n\n¿Cuál sería el MEJOR tema para este fragmento?',
    options: [
      "La nostalgia",
      "El ciclismo",
      "La mecánica de bicicletas",
      "El color azul",
    ],
    correctIndex: 0,
    explanation: 'El fragmento evoca recuerdos de la infancia y sentimientos del paso del tiempo, lo cual define esencialmente a la nostalgia.',
    section: "lectura",
    subtopic: "Idea Central y Tema",
  },

  // ==========================================
  // 2. LECTURA — Análisis literario
  // ==========================================
  {
    q: 'En la oración: "las olas mordían la orilla con furia", la figura literaria presente es:',
    options: [
      "símil",
      "personificación",
      "hipérbole",
      "onomatopeya",
    ],
    correctIndex: 1,
    explanation: 'Personificación (o prosopopeya): se le atribuye una acción propiamente humana o animal (morder con furia) a un elemento inanimado como las olas.',
    section: "lectura",
    subtopic: "Figuras Retóricas",
  },
  {
    q: "Un texto que narra hechos con personajes, ambiente y conflicto, escrito en prosa breve, pertenece MEJOR al género de:",
    options: [
      "ensayo",
      "cuento",
      "crónica",
      "epístola",
    ],
    correctIndex: 1,
    explanation: "El cuento es una narración breve de ficción o hechos estructurados con personajes, ambiente y un conflicto central en prosa.",
    section: "lectura",
    subtopic: "Géneros Literarios",
  },

  // ==========================================
  // 3. REDACCIÓN — Identifica la operación
  // ==========================================
  {
    q: 'Usa este segmento:\n(1) Caminé por el parque.\n(2) El parque estaba lleno de árboles altos y flores de colores.\n(3) Los árboles eran robles centenarios.\n(4) Las flores eran rosas, margaritas y tulipanes.\n(5) Todo el parque olía a primavera.\n\n¿Cuál enunciado GENERALIZA mejor la información de las oraciones 3 y 4?',
    options: [
      '"Caminé por el parque." (1)',
      '"El parque estaba lleno de árboles altos y flores de colores." (2)',
      '"Todo el parque olía a primavera." (5)',
      "Ninguna, porque las oraciones 3 y 4 ya son generales",
    ],
    correctIndex: 1,
    explanation: 'La oración 2 engloba de forma general los detalles específicos que se desglosan luego en 3 (árboles = robles) y 4 (flores = rosas, margaritas, tulipanes).',
    section: "redaccion",
    subtopic: "Generalización",
  },
  {
    q: 'Usa este segmento:\n(1) Caminé por el parque.\n(2) El parque estaba lleno de árboles altos y flores de colores.\n(3) Los árboles eran robles centenarios.\n(4) Las flores eran rosas, margaritas y tulipanes.\n(5) Todo el parque olía a primavera.\n\n¿Cuál de las siguientes oraciones podría OMITIRSE (elidirse) sin perder información necesaria, si ya se dijo antes que el parque tenía árboles altos?',
    options: [
      '"Los árboles eran robles centenarios." (3)',
      '"Las flores eran rosas, margaritas y tulipanes." (4)',
      '"Todo el parque olía a primavera." (5)',
      "Ninguna puede omitirse",
    ],
    correctIndex: 3,
    explanation: "Ninguna puede omitirse porque cada una aporta información nueva y particular: tipo de árbol (robles centenarios), tipos de flores y sensación olfativa.",
    section: "redaccion",
    subtopic: "Omisión y Elisión",
  },
  {
    q: 'Usa este segmento:\n(1) Caminé por el parque.\n(2) El parque estaba lleno de árboles altos y flores de colores.\n(3) Los árboles eran robles centenarios.\n(4) Las flores eran rosas, margaritas y tulipanes.\n(5) Todo el parque olía a primavera.\n\n¿Cuál enunciado sería un ejemplo de ADICIÓN (lenguaje figurado) si se insertara en el segmento?',
    options: [
      '"El parque medía dos kilómetros."',
      '"Las flores parecían un arcoíris caído del cielo."',
      '"Había un letrero en la entrada."',
      '"El parque cerraba a las seis."',
    ],
    correctIndex: 1,
    explanation: 'La opción "Las flores parecían un arcoíris caído del cielo" añade una comparación poética / símil figurado que enriquece descriptivamente el texto.',
    section: "redaccion",
    subtopic: "Adición de Lenguaje Figurado",
  },

  // ==========================================
  // 4. MATEMÁTICAS — Práctica mixta PAA
  // ==========================================
  {
    q: "Si un artículo cuesta $60 y tiene 25% de descuento, ¿cuánto se paga finalmente por él?",
    options: [
      "$15",
      "$35",
      "$45",
      "$50",
    ],
    correctIndex: 2,
    explanation: "El 25% de $60 es $15 ($60 × 0.25 = $15). Por tanto, el precio final a pagar es $60 - $15 = $45 (o directamente $60 × 0.75 = $45).",
    section: "matematicas",
    subtopic: "Porcentajes y Descuentos",
  },
  {
    q: "Resuelve la desigualdad lineal: 2x − 3 < 7",
    options: [
      "x < 5",
      "x < 2",
      "x > 5",
      "x < 10",
    ],
    correctIndex: 0,
    explanation: "Sumando 3 a ambos lados: 2x < 10. Dividiendo entre 2: x < 5.",
    section: "matematicas",
    subtopic: "Desigualdades",
  },
  {
    q: "Un tren viaja a 80 km/h y otro sale del mismo punto en dirección opuesta a 100 km/h. ¿Cuántas horas tardan en estar separados exactamente 540 km?",
    options: [
      "2 horas",
      "3 horas",
      "4 horas",
      "5 horas",
    ],
    correctIndex: 1,
    explanation: "Al viajar en direcciones opuestas, sus velocidades se suman: 80 km/h + 100 km/h = 180 km/h de velocidad relativa de separación. Tiempo = 540 km / 180 km/h = 3 horas.",
    section: "matematicas",
    subtopic: "Velocidad y Móviles",
  },
  {
    q: "Un rectángulo tiene un perímetro de 40 cm. Su ancho mide x y su largo mide (x + 4) cm. ¿Cuánto mide el ancho del rectángulo?",
    options: [
      "6 cm",
      "8 cm",
      "10 cm",
      "12 cm",
    ],
    correctIndex: 1,
    explanation: "El perímetro es 2(ancho + largo) = 2(x + x + 4) = 2(2x + 4) = 4x + 8 = 40. Despejando: 4x = 32 → x = 8 cm.",
    section: "matematicas",
    subtopic: "Geometría y Ecuaciones",
  },
  {
    q: "Calcula la pendiente de la recta que pasa por los puntos (2, 3) y (6, 11):",
    options: [
      "1",
      "2",
      "3",
      "4",
    ],
    correctIndex: 1,
    explanation: "La fórmula de la pendiente es m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.",
    section: "matematicas",
    subtopic: "Geometría Analítica (Pendiente)",
  },
  {
    q: "Si el promedio de 4 números es 15, y tres de ellos son 10, 12 y 18, ¿cuál es el cuarto número?",
    options: [
      "15",
      "18",
      "20",
      "22",
    ],
    correctIndex: 2,
    explanation: "La suma total de los 4 números es 4 × 15 = 60. La suma de los tres conocidos es 10 + 12 + 18 = 40. El cuarto número es 60 - 40 = 20.",
    section: "matematicas",
    subtopic: "Estadística y Promedios",
  },
  {
    q: "¿Cuál es la probabilidad teórica de sacar un as al extraer una carta al azar de una baraja estándar de 52 cartas?",
    options: [
      "1/52",
      "1/13",
      "4/13",
      "1/4",
    ],
    correctIndex: 1,
    explanation: "Una baraja estándar tiene 4 ases en 52 cartas. Probabilidad = 4 / 52 = 1 / 13.",
    section: "matematicas",
    subtopic: "Probabilidad Clásica",
  },

  // ==========================================
  // 5. INGLÉS — Uso del lenguaje y comprensión
  // ==========================================
  {
    q: "Choose the correct word to complete the sentence:\n\nMy brother ________ to the gym every morning.",
    options: [
      "go",
      "goes",
      "going",
      "gone",
    ],
    correctIndex: 1,
    explanation: 'In present simple tense with third-person singular subjects ("My brother" = he), the verb adds -es: "goes".',
    section: "ingles",
    subtopic: "Subject-Verb Agreement",
  },
  {
    q: "Which sentence is grammatically correct in standard English?",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
    ],
    correctIndex: 2,
    explanation: 'In third-person singular negative statements in present simple, use auxiliary "doesn\'t" followed by the base form of the main verb ("like"): "She doesn\'t like coffee."',
    section: "ingles",
    subtopic: "Grammar & Negation",
  },
  {
    q: 'Short text: "Our library is open Monday through Friday, from 9 a.m. to 6 p.m. On Saturdays, it closes early, at 2 p.m. The library is closed on Sundays and holidays."\n\nAccording to the text, on which day does the library close earliest?',
    options: [
      "Monday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    correctIndex: 2,
    explanation: 'The text states that on Saturdays the library closes early at 2 p.m., which is earlier than the weekday closing time of 6 p.m. (Sunday is not a closing hour because it is completely closed all day).',
    section: "ingles",
    subtopic: "Reading Comprehension (Details)",
  },
  {
    q: 'Short text: "Our library is open Monday through Friday, from 9 a.m. to 6 p.m. On Saturdays, it closes early, at 2 p.m. The library is closed on Sundays and holidays."\n\nWhat can be inferred about the library\'s schedule?',
    options: [
      "It is open every day of the week.",
      "It has reduced hours on weekends.",
      "It never closes.",
      "It is closed on Fridays.",
    ],
    correctIndex: 1,
    explanation: "Because the library is only open until 2 p.m. on Saturday and closed on Sunday, it has significantly reduced operating hours on weekends.",
    section: "ingles",
    subtopic: "Reading Comprehension (Inference)",
  },
  {
    q: 'Choose the option that BEST combines these three sentences clearly and concisely:\n- "The coffee was hot."\n- "The coffee was strong."\n- "I drank it quickly."',
    options: [
      "The coffee was hot and strong I drank it quickly.",
      "I drank the hot, strong coffee quickly.",
      "Hot the coffee was strong and quickly I drank it.",
      "The coffee, quickly, was hot and I drank it strong.",
    ],
    correctIndex: 1,
    explanation: '"I drank the hot, strong coffee quickly" combines all three pieces of information smoothly, grammatically, and without awkward fragments.',
    section: "ingles",
    subtopic: "Sentence Combining",
  },
];
