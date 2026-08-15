import { type StudyQuestion } from "./study-game.functions";

export interface PresetTopic {
  id: string;
  title: string;
  subject: string;
  category: string;
  icon: string;
  badge: string;
  summary: string;
  content: string;
  preAnalyzed: {
    title: string;
    detectedTopics: string[];
    summaryExplanation: string;
    keyPoints: string[];
  };
  presetQuestions: StudyQuestion[];
}

export const PRESET_STUDY_TOPICS: PresetTopic[] = [
  {
    id: "celula",
    title: "La Célula y sus Funciones",
    subject: "Biología / Ciencias Naturales",
    category: "Ciencias",
    icon: "🔬",
    badge: "Biología",
    summary: "Estructura, diferencias entre célula animal y vegetal, organelos y teoría celular.",
    content: `La célula es la unidad anatómica, funcional y de origen de todos los seres vivos. Todo organismo vivo está compuesto por una o más células.

Existen dos tipos principales de células según su organización nuclear:
1. Células procariotas: No poseen un núcleo delimitado por membrana; su material genético (ADN) flota disperso en el citoplasma (por ejemplo, las bacterias).
2. Células eucariotas: Poseen un núcleo bien definido envuelto por una membrana nuclear que protege el ADN. Se dividen principalmente en células animales y vegetales.

Organelos celulares y sus funciones clave:
- El núcleo: Contiene el material genético (ADN) y dirige todas las actividades celulares.
- La mitocondria: Es la central energética de la célula; realiza la respiración celular para producir ATP (energía).
- Los ribosomas: Sintetizan proteínas a partir de la información genética.
- El retículo endoplásmico y aparato de Golgi: Empaquetan, procesan y distribuyen lípidos y proteínas.
- La membrana plasmática: Regula selectivamente el paso de sustancias hacia el interior y exterior de la célula.

Diferencias entre célula animal y vegetal:
- Las células vegetales poseen una pared celular de celulosa rígida que les da soporte, y cloroplastos que contienen clorofila para realizar la fotosíntesis. También tienen una gran vacuola central.
- Las células animales carecen de pared celular y de cloroplastos, poseen membrana flexible y vacuolas más pequeñas.`,
    preAnalyzed: {
      title: "La Célula y sus Funciones",
      detectedTopics: [
        "Definición y Teoría Celular",
        "Células Procariotas y Eucariotas",
        "Organelos Celulares (Núcleo y Mitocondria)",
        "Diferencias entre Célula Animal y Vegetal",
      ],
      summaryExplanation:
        "La célula es la unidad fundamental de la vida. Todos los seres vivos están formados por células. Existen células procariotas (sin núcleo definido) y eucariotas (con núcleo).\n\nDentro de la célula, diferentes organelos cumplen tareas esenciales: el núcleo resguarda el ADN y la mitocondria genera la energía necesaria para vivir.",
      keyPoints: [
        "La célula es la unidad básica, anatómica y funcional de todos los seres vivos.",
        "Las células procariotas no tienen núcleo definido (bacterias); las eucariotas sí tienen núcleo.",
        "La mitocondria produce energía (ATP) a través de la respiración celular.",
        "El núcleo dirige la actividad celular y contiene el material genético (ADN).",
        "Las células vegetales tienen pared celular y cloroplastos para fotosíntesis; las animales no.",
      ],
    },
    presetQuestions: [
      {
        id: "cel_1",
        type: "multiple_choice",
        concept: "Definición de la Célula",
        question: "¿Qué es la célula según la biología?",
        options: [
          "La unidad anatómica, funcional y de origen de todos los seres vivos",
          "Un tipo de tejido muscular del cuerpo humano",
          "Una molécula inorgánica encargada de transportar agua",
          "Un órgano especializado en la digestión",
        ],
        correctAnswer: "La unidad anatómica, funcional y de origen de todos los seres vivos",
        correctIndex: 0,
        explanation: "¿Por qué? La célula es la unidad básica y estructural de la vida; todos los organismos están formados por una o más de ellas.",
      },
      {
        id: "cel_2",
        type: "true_false",
        concept: "Células Procariotas",
        question: "Las células procariotas carecen de un núcleo delimitado por membrana.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: "¿Por qué? En las procariotas (como las bacterias), el material genético flota libremente en el citoplasma sin membrana nuclear.",
      },
      {
        id: "cel_3",
        type: "multiple_choice",
        concept: "Función de la Mitocondria",
        question: "¿Cuál es la función principal de la mitocondria en la célula?",
        options: [
          "Producir energía (ATP) mediante la respiración celular",
          "Proteger la célula contra virus externos",
          "Almacenar clorofila para realizar la fotosíntesis",
          "Fabricar la pared celular rígida",
        ],
        correctAnswer: "Producir energía (ATP) mediante la respiración celular",
        correctIndex: 0,
        explanation: "¿Por qué? La mitocondria es la central energética encargada de sintetizar moléculas de ATP a través de la respiración celular.",
      },
      {
        id: "cel_4",
        type: "fill_blank",
        concept: "Diferencia Vegetal",
        question: "Las células vegetales poseen ________ que contienen clorofila para realizar la fotosíntesis.",
        options: ["cloroplastos", "ribosomas", "centriolos", "lisosomas"],
        correctAnswer: "cloroplastos",
        correctIndex: 0,
        explanation: "¿Por qué? Los cloroplastos son organelos exclusivos de las células vegetales donde ocurre la fotosíntesis captando luz solar.",
      },
      {
        id: "cel_5",
        type: "true_false",
        concept: "Células Animales",
        question: "Las células animales poseen una pared celular rígida de celulosa.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Falso",
        correctIndex: 1,
        explanation: "¿Por qué? Las células animales solo tienen membrana plasmática flexible; la pared celular de celulosa es exclusiva de las plantas y vegetales.",
      },
      {
        id: "cel_6",
        type: "multiple_choice",
        concept: "Función del Núcleo",
        question: "¿Qué estructura celular contiene el ADN y coordina las funciones de la célula?",
        options: ["El núcleo", "El citoplasma", "El aparato de Golgi", "La vacuola"],
        correctAnswer: "El núcleo",
        correctIndex: 0,
        explanation: "¿Por qué? El núcleo resguarda el material genético hereditario (ADN) y actúa como el centro de control celular.",
      },
      {
        id: "cel_7",
        type: "fill_blank",
        concept: "Síntesis de Proteínas",
        question: "Los ________ son los organelos celulares encargados de sintetizar proteínas.",
        options: ["ribosomas", "cloroplastos", "vacuolas", "flagelos"],
        correctAnswer: "ribosomas",
        correctIndex: 0,
        explanation: "¿Por qué? Los ribosomas traducen el ARN mensajero para ensamblar cadenas de aminoácidos y formar proteínas.",
      },
      {
        id: "cel_8",
        type: "multiple_choice",
        concept: "Membrana Plasmática",
        question: "¿Cuál es la función de la membrana plasmática?",
        options: [
          "Regular selectivamente el paso de sustancias hacia adentro y afuera",
          "Destruir la célula cuando envejece",
          "Generar impulsos eléctricos únicamente",
          "Almacenar el 100% de la energía corporal",
        ],
        correctAnswer: "Regular selectivamente el paso de sustancias hacia adentro y afuera",
        correctIndex: 0,
        explanation: "¿Por qué? La membrana celular es semipermeable y controla el intercambio de nutrientes, agua y desechos.",
      },
      {
        id: "cel_9",
        type: "true_false",
        concept: "Teoría Celular",
        question: "Todos los seres vivos están formados por una o más células.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: "¿Por qué? Este es uno de los postulados fundamentales de la Teoría Celular formulada en el siglo XIX.",
      },
      {
        id: "cel_10",
        type: "multiple_choice",
        concept: "Vacuolas",
        question: "¿Qué característica tienen las vacuolas en las células vegetales comparadas con las animales?",
        options: [
          "Tienen una gran vacuola central para almacenar agua y dar turgencia",
          "No poseen ninguna vacuola",
          "Son más pequeñas y numerosas",
          "Se encuentran únicamente fuera de la célula",
        ],
        correctAnswer: "Tienen una gran vacuola central para almacenar agua y dar turgencia",
        correctIndex: 0,
        explanation: "¿Por qué? Las plantas tienen una enorme vacuola central que almacena fluidos y mantiene firme la estructura de la planta.",
      },
    ],
  },
  {
    id: "newton",
    title: "Leyes del Movimiento de Newton",
    subject: "Física",
    category: "Ciencias",
    icon: "🍎",
    badge: "Física",
    summary: "Inercia, fuerza y masa (F = m·a), y principio de acción y reacción.",
    content: `Las Leyes del Movimiento fueron formuladas por Sir Isaac Newton en 1687 y describen la relación entre las fuerzas que actúan sobre un cuerpo y el movimiento de este.

Primera Ley (Ley de la Inercia):
Todo cuerpo permanece en su estado de reposo o de movimiento rectilíneo uniforme a menos que una fuerza externa neta actúe sobre él. La inercia es la resistencia que opone la materia a modificar su estado de movimiento.

Segunda Ley (Ley Fundamental de la Dinámica):
La aceleración de un objeto es directamente proporcional a la fuerza neta que actúa sobre él e inversamente proporcional a su masa. La fórmula fundamental es:
Fuerza = masa × aceleración (F = m · a). La fuerza se mide en Newtons (N), la masa en kilogramos (kg) y la aceleración en m/s².

Tercera Ley (Principio de Acción y Reacción):
A toda fuerza de acción le corresponde una fuerza de reacción de igual magnitud y en la misma dirección, pero en sentido opuesto. Cuando un objeto ejerce una fuerza sobre otro, el segundo ejerce simultáneamente una fuerza idéntica en sentido contrario sobre el primero.`,
    preAnalyzed: {
      title: "Leyes del Movimiento de Newton",
      detectedTopics: [
        "Primera Ley: Inercia",
        "Segunda Ley: Fuerza, Masa y Aceleración (F = m·a)",
        "Tercera Ley: Acción y Reacción",
      ],
      summaryExplanation:
        "Isaac Newton descubrió tres leyes fundamentales que explican cómo y por qué se mueven las cosas en el universo.\n\nLa 1ª Ley explica la inercia, la 2ª Ley relaciona la fuerza con la masa y la aceleración (F = m·a), y la 3ª Ley establece que a toda acción le corresponde una reacción igual y contraria.",
      keyPoints: [
        "1ª Ley (Inercia): Los objetos conservan su estado de reposo o movimiento a menos que intervenga una fuerza.",
        "2ª Ley (Dinámica): Fuerza = masa × aceleración (F = m · a).",
        "La unidad de fuerza en el Sistema Internacional es el Newton (N).",
        "3ª Ley (Acción y Reacción): Toda fuerza aplicada genera una fuerza opuesta de igual magnitud.",
      ],
    },
    presetQuestions: [
      {
        id: "new_1",
        type: "multiple_choice",
        concept: "Primera Ley de Newton",
        question: "¿Qué establece la Primera Ley de Newton (Ley de la Inercia)?",
        options: [
          "Un cuerpo conserva su estado de reposo o movimiento rectilíneo a menos que una fuerza externa actúe sobre él",
          "La masa de los objetos se duplica cuando están en movimiento",
          "La gravedad empuja todos los objetos hacia arriba en el vacío",
          "La fuerza es igual a la velocidad al cuadrado",
        ],
        correctAnswer: "Un cuerpo conserva su estado de reposo o movimiento rectilíneo a menos que una fuerza externa actúe sobre él",
        correctIndex: 0,
        explanation: "¿Por qué? La inercia es la propiedad de los cuerpos de resistirse a cambiar su estado de reposo o velocidad uniforme.",
      },
      {
        id: "new_2",
        type: "multiple_choice",
        concept: "Fórmula de la Segunda Ley",
        question: "¿Cuál es la fórmula matemática fundamental de la Segunda Ley de Newton?",
        options: ["F = m · a", "E = m · c²", "v = d / t", "P = m · g²"],
        correctAnswer: "F = m · a",
        correctIndex: 0,
        explanation: "¿Por qué? La fuerza neta aplicada a un objeto es igual al producto de su masa por la aceleración que adquiere (F = m · a).",
      },
      {
        id: "new_3",
        type: "fill_blank",
        concept: "Unidades de Medida",
        question: "En el Sistema Internacional, la fuerza se mide en ________.",
        options: ["Newtons (N)", "Joules (J)", "Watts (W)", "Kelvin (K)"],
        correctAnswer: "Newtons (N)",
        correctIndex: 0,
        explanation: "¿Por qué? 1 Newton equivale a la fuerza necesaria para acelerar 1 kg de masa a razón de 1 m/s².",
      },
      {
        id: "new_4",
        type: "true_false",
        concept: "Tercera Ley de Newton",
        question: "La Tercera Ley establece que a toda acción le corresponde una reacción de igual magnitud pero en sentido opuesto.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: "¿Por qué? Cuando empujas una pared, la pared ejerce sobre ti una fuerza idéntica en sentido opuesto.",
      },
      {
        id: "new_5",
        type: "multiple_choice",
        concept: "Aplicación de la Dinámica",
        question: "Si aplicas la misma fuerza a un objeto ligero y a uno muy pesado, ¿cuál tendrá mayor aceleración?",
        options: [
          "El objeto ligero, porque tiene menor masa",
          "El objeto pesado, porque tiene mayor volumen",
          "Ambos tendrán exactamente la misma aceleración",
          "Ninguno se moverá bajo ninguna circunstancia",
        ],
        correctAnswer: "El objeto ligero, porque tiene menor masa",
        correctIndex: 0,
        explanation: "¿Por qué? Según F = m·a, a menor masa mayor aceleración para una misma cantidad de fuerza aplicada.",
      },
    ],
  },
  {
    id: "fracciones",
    title: "Fracciones y Jerarquía de Operaciones",
    subject: "Matemáticas",
    category: "Matemáticas",
    icon: "➗",
    badge: "Aritmética y Álgebra",
    summary: "Operaciones con fracciones, regla de signos y orden de evaluación (PEMDAS).",
    content: `Una fracción representa una parte de un todo dividido en partes iguales. Se compone de un numerador (partes que tomamos) y un denominador (total de partes).

Operaciones fundamentales con fracciones:
1. Suma y Resta con mismo denominador: Se suman o restan los numeradores y se conserva el denominador (ej. 2/5 + 1/5 = 3/5).
2. Multiplicación de fracciones: Se multiplican numeradores entre sí y denominadores entre sí en línea recta (ej. (2/3) × (4/5) = 8/15).
3. División de fracciones: Se multiplica de forma cruzada (producto en cruz) o se multiplica por el inverso de la segunda fracción (ej. (2/3) ÷ (4/5) = (2×5)/(3×4) = 10/12 = 5/6).

Jerarquía de Operaciones (PEMDAS):
Cuando una expresión contiene varias operaciones, se debe resolver estrictamente en el siguiente orden:
1. Paréntesis y signos de agrupación: () [] {}
2. Exponentes y raíces cuadradas.
3. Multiplicaciones y Divisiones: De izquierda a derecha.
4. Sumas y Restas: De izquierda a derecha.

Regla de los signos en multiplicación y división:
- Más por más da más (+ × + = +)
- Menos por menos da más (- × - = +)
- Signos contrarios dan menos (+ × - = - ; - × + = -).`,
    preAnalyzed: {
      title: "Fracciones y Jerarquía de Operaciones",
      detectedTopics: [
        "Numerador y Denominador",
        "Suma, Multiplicación y División de Fracciones",
        "Jerarquía de Operaciones (PEMDAS)",
        "Leyes de los Signos",
      ],
      summaryExplanation:
        "Las fracciones nos permiten representar porciones de un entero. Se multiplican en línea recta y se dividen multiplicando en cruz.\n\nAl resolver operaciones combinadas, debemos seguir el orden PEMDAS: primero paréntesis, luego potencias/raíces, después multiplicaciones/divisiones y al final sumas y restas.",
      keyPoints: [
        "El numerador indica cuántas partes tomamos; el denominador en cuántas partes se divide el entero.",
        "Multiplicación de fracciones: numerador por numerador y denominador por denominador.",
        "Jerarquía PEMDAS: 1) Paréntesis, 2) Potencias, 3) Multiplicaciones y Divisiones, 4) Sumas y Restas.",
        "Signos iguales multiplicados dan positivo (+); signos contrarios dan negativo (-).",
      ],
    },
    presetQuestions: [
      {
        id: "frac_1",
        type: "multiple_choice",
        concept: "Multiplicación de Fracciones",
        question: "¿Cómo se multiplican dos fracciones como (2/3) × (4/5)?",
        options: [
          "Multiplicando numeradores entre sí y denominadores entre sí (en línea recta: 8/15)",
          "Sumando los numeradores y multiplicando los denominadores",
          "Multiplicando en cruz de forma obligatoria",
          "Invirtiendo ambas fracciones antes de sumar",
        ],
        correctAnswer: "Multiplicando numeradores entre sí y denominadores entre sí (en línea recta: 8/15)",
        correctIndex: 0,
        explanation: "¿Por qué? En la multiplicación de fracciones se calcula directo: (2 × 4) / (3 × 5) = 8/15.",
      },
      {
        id: "frac_2",
        type: "multiple_choice",
        concept: "Jerarquía de Operaciones",
        question: "En la expresión 4 + 3 × 2, ¿qué operación se debe resolver primero?",
        options: [
          "La multiplicación (3 × 2)",
          "La suma (4 + 3)",
          "Cualquiera de las dos da el mismo resultado",
          "Ninguna, no se puede resolver",
        ],
        correctAnswer: "La multiplicación (3 × 2)",
        correctIndex: 0,
        explanation: "¿Por qué? Por jerarquía de operaciones, las multiplicaciones tienen mayor prioridad que las sumas: 3 × 2 = 6, luego 4 + 6 = 10.",
      },
      {
        id: "frac_3",
        type: "true_false",
        concept: "Regla de Signos",
        question: "Al multiplicar dos números negativos, el resultado siempre es positivo ( - × - = + ).",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: "¿Por qué? La regla de los signos establece que el producto de signos iguales siempre da como resultado un número positivo.",
      },
      {
        id: "frac_4",
        type: "fill_blank",
        concept: "Partes de la Fracción",
        question: "En una fracción, el número de arriba se llama ________.",
        options: ["numerador", "denominador", "exponente", "radicando"],
        correctAnswer: "numerador",
        correctIndex: 0,
        explanation: "¿Por qué? El numerador indica las partes que se toman o consideran del entero.",
      },
      {
        id: "frac_5",
        type: "multiple_choice",
        concept: "Suma con Mismo Denominador",
        question: "¿Cuál es el resultado de sumar 2/7 + 3/7?",
        options: ["5/7", "5/14", "6/7", "6/14"],
        correctAnswer: "5/7",
        correctIndex: 0,
        explanation: "¿Por qué? Al tener el mismo denominador, se suman directamente los numeradores (2 + 3 = 5) y se conserva el denominador (7).",
      },
    ],
  },
  {
    id: "revolucion-mexicana",
    title: "La Revolución Mexicana (1910 - 1917)",
    subject: "Historia",
    category: "Historia",
    icon: "📜",
    badge: "Historia de México",
    summary: "Causas, Francisco I. Madero, Emiliano Zapata, Pancho Villa y la Constitución de 1917.",
    content: `La Revolución Mexicana fue un conflicto armado y social que inició el 20 de noviembre de 1910, convocado por Francisco I. Madero mediante el Plan de San Luis, con el lema 'Sufragio efectivo, no reelección'.

Causas principales del conflicto:
- Dictadura de Porfirio Díaz (el Porfiriato) que duró más de 30 años en el poder.
- Gran desigualdad social, concentración de la tierra en latifundios y explotación de campesinos y obreros.
- Falta de libertades democráticas y represión a huelgas laborales (Cananea y Río Blanco).

Líderes y caudillos revolucionarios destacados:
- Francisco I. Madero: Promovió la vía democrática y la no reelección presidencial.
- Emiliano Zapata: Líder del Ejército Libertador del Sur, promulgó el Plan de Ayala exigiendo 'Tierra y Libertad' y restitución de tierras comunales.
- Francisco 'Pancho' Villa: Comandante de la División del Norte, encabezó ejércitos populares en el norte del país.
- Venustiano Carranza: Líder del Ejército Constitucionalista que promulgó la Constitución Política de los Estados Unidos Mexicanos el 5 de febrero de 1917 en Querétaro.

Logros y consecuencias de la Revolución:
- Redacción de la Constitución de 1917, pionera en derechos sociales: Artículo 3° (educación laica y gratuita), Artículo 27° (propiedad de tierras y recursos de la nación) y Artículo 123° (derechos laborales y jornada máxima de 8 horas).`,
    preAnalyzed: {
      title: "La Revolución Mexicana (1910 - 1917)",
      detectedTopics: [
        "Inicio y Causas: El Porfiriato y Plan de San Luis",
        "Caudillos: Madero, Zapata, Villa y Carranza",
        "Logros: La Constitución Política de 1917",
      ],
      summaryExplanation:
        "La Revolución Mexicana inició el 20 de noviembre de 1910 bajo el lema 'Sufragio efectivo, no reelección' para poner fin a más de 30 años de dictadura porfirista y lograr justicia para campesinos y obreros.\n\nEl movimiento concluyó con la promulgación de la Constitución de 1917, estableciendo derechos pioneros como la educación laica y gratuita (Art. 3°) y jornadas laborales justas (Art. 123°).",
      keyPoints: [
        "Inicio: 20 de noviembre de 1910 convocado por Francisco I. Madero con el Plan de San Luis.",
        "Emiliano Zapata encabezó el sur con el Plan de Ayala y el lema 'Tierra y Libertad'.",
        "Pancho Villa comandó la célebre División del Norte.",
        "Venustiano Carranza promulgó la Constitución de 1917 el 5 de febrero en Querétaro.",
        "Artículos clave: 3° (educación), 27° (tierras de la nación) y 123° (derechos laborales).",
      ],
    },
    presetQuestions: [
      {
        id: "rev_1",
        type: "multiple_choice",
        concept: "Inicio de la Revolución",
        question: "¿En qué fecha dio inicio formalmente la Revolución Mexicana?",
        options: [
          "20 de noviembre de 1910",
          "16 de septiembre de 1810",
          "5 de febrero de 1917",
          "5 de mayo de 1862",
        ],
        correctAnswer: "20 de noviembre de 1910",
        correctIndex: 0,
        explanation: "¿Por qué? Francisco I. Madero convocó a levantarse en armas el 20 de noviembre de 1910 mediante el Plan de San Luis.",
      },
      {
        id: "rev_2",
        type: "fill_blank",
        concept: "Lema de Emiliano Zapata",
        question: "Emiliano Zapata abanderó la lucha agraria del sur con el célebre lema '________ y Libertad'.",
        options: ["Tierra", "Paz", "Orden", "Comercio"],
        correctAnswer: "Tierra",
        correctIndex: 0,
        explanation: "¿Por qué? El lema 'Tierra y Libertad' representaba la demanda de restituir los campos a los campesinos e indígenas.",
      },
      {
        id: "rev_3",
        type: "true_false",
        concept: "Constitución de 1917",
        question: "El Artículo 3° de la Constitución de 1917 garantiza una educación laica y gratuita.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        correctIndex: 0,
        explanation: "¿Por qué? El Artículo 3° constitucional fue pionero al consagrar el derecho universal a la educación impartida por el Estado.",
      },
      {
        id: "rev_4",
        type: "multiple_choice",
        concept: "Líder Constitucionalista",
        question: "¿Quién lideró el Ejército Constitucionalista y promulgó la Constitución de 1917?",
        options: [
          "Venustiano Carranza",
          "Porfirio Díaz",
          "Victoriano Huerta",
          "Agustín de Iturbide",
        ],
        correctAnswer: "Venustiano Carranza",
        correctIndex: 0,
        explanation: "¿Por qué? Carranza convocó al Congreso Constituyente en Querétaro para promulgar la Carta Magna el 5 de febrero de 1917.",
      },
      {
        id: "rev_5",
        type: "multiple_choice",
        concept: "Causas de la Revolución",
        question: "¿Cuál fue una de las principales causas sociales de la Revolución Mexicana?",
        options: [
          "La concentración de tierras en latifundios y la desigualdad durante el Porfiriato",
          "La invasión del ejército francés en el norte del país",
          "La independencia de las colonias españolas en América",
          "El descubrimiento de yacimientos de oro en California",
        ],
        correctAnswer: "La concentración de tierras en latifundios y la desigualdad durante el Porfiriato",
        correctIndex: 0,
        explanation: "¿Por qué? La dictadura de Porfirio Díaz generó gran marginación para peones y campesinos que carecían de tierras y derechos laborales.",
      },
    ],
  },
];
