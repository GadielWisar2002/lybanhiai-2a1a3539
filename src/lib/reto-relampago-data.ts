export type RetoCategory =
  | "ciencias"
  | "matematicas"
  | "espanol"
  | "historia"
  | "ingles"
  | "tecnologia"
  | "cultura-general";

export interface RetoQuestion {
  id: string;
  category: RetoCategory;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3
  explanation: string;
}

export interface CategoryInfo {
  id: RetoCategory;
  name: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const RETO_CATEGORIES: CategoryInfo[] = [
  {
    id: "ciencias",
    name: "Ciencias",
    icon: "🔬",
    description: "Física, Química, Biología y el Universo",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/15",
    borderColor: "border-emerald-500/25",
  },
  {
    id: "matematicas",
    name: "Matemáticas",
    icon: "➗",
    description: "Álgebra, Geometría, Aritmética y Lógica",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/15",
    borderColor: "border-blue-500/25",
  },
  {
    id: "espanol",
    name: "Español",
    icon: "📖",
    description: "Gramática, Ortografía, Literatura y Redacción",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/15",
    borderColor: "border-amber-500/25",
  },
  {
    id: "historia",
    name: "Historia y Geografía",
    icon: "🌎",
    description: "Civilizaciones, Acontecimientos y el Mundo",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 hover:bg-rose-500/15",
    borderColor: "border-rose-500/25",
  },
  {
    id: "ingles",
    name: "Inglés",
    icon: "🇬🇧",
    description: "Vocabulario, Gramática y Modismos",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10 hover:bg-cyan-500/15",
    borderColor: "border-cyan-500/25",
  },
  {
    id: "tecnologia",
    name: "Tecnología",
    icon: "💻",
    description: "Computación, Algoritmos, IA e Internet",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 hover:bg-indigo-500/15",
    borderColor: "border-indigo-500/25",
  },
  {
    id: "cultura-general",
    name: "Cultura General",
    icon: "🧠",
    description: "Arte, Filosofía, Inventos y Curiosidades",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/15",
    borderColor: "border-purple-500/25",
  },
];

export const RETO_QUESTIONS_DB: RetoQuestion[] = [
  // ==========================================
  // 🔬 CIENCIAS (16 preguntas)
  // ==========================================
  {
    id: "cie-1",
    category: "ciencias",
    difficulty: "easy",
    question: "¿Cuál es el planeta más cercano al Sol en el Sistema Solar?",
    options: ["Tierra", "Marte", "Mercurio", "Venus"],
    correctIndex: 2,
    explanation: "Mercurio es el planeta más cercano al Sol y también el más pequeño del Sistema Solar, completando su órbita en solo 88 días terrestres.",
  },
  {
    id: "cie-2",
    category: "ciencias",
    difficulty: "easy",
    question: "¿Qué orgánulo celular es conocido como la 'central energética' de la célula?",
    options: ["Ribosoma", "Mitocondria", "Aparato de Golgi", "Núcleo"],
    correctIndex: 1,
    explanation: "Las mitocondrias generan la mayor parte del ATP (adenosín trifosfato), que es la principal molécula portadora de energía en las células.",
  },
  {
    id: "cie-3",
    category: "ciencias",
    difficulty: "easy",
    question: "¿Cuál es el elemento químico más abundante en el universo observable?",
    options: ["Oxígeno", "Helio", "Hidrógeno", "Carbono"],
    correctIndex: 2,
    explanation: "El hidrógeno constituye aproximadamente el 75% de la masa elemental de todo el universo.",
  },
  {
    id: "cie-4",
    category: "ciencias",
    difficulty: "easy",
    question: "¿Qué proceso realizan las plantas para convertir la luz solar en energía química?",
    options: ["Respiración celular", "Fotosíntesis", "Fermentación", "Transpiración"],
    correctIndex: 1,
    explanation: "La fotosíntesis utiliza agua, dióxido de carbono y luz solar capturada por la clorofila para producir glucosa y liberar oxígeno.",
  },
  {
    id: "cie-5",
    category: "ciencias",
    difficulty: "medium",
    question: "¿A qué velocidad viaja la luz en el vacío aproximadamente?",
    options: ["30,000 km/s", "300,000 km/s", "150,000 km/s", "3,000,000 km/s"],
    correctIndex: 1,
    explanation: "La velocidad de la luz en el vacío es de aproximadamente 299,792 km por segundo (redondeado comúnmente a 300,000 km/s).",
  },
  {
    id: "cie-6",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Qué tipo de enlace químico se forma al compartir electrones entre átomos?",
    options: ["Enlace iónico", "Enlace covalente", "Enlace metálico", "Puente de hidrógeno"],
    correctIndex: 1,
    explanation: "En un enlace covalente, dos átomos no metálicos comparten uno o más pares de electrones para alcanzar estabilidad electrónica.",
  },
  {
    id: "cie-7",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Cuál es la función principal de los glóbulos rojos (eritrocitos) en la sangre?",
    options: ["Combatir infecciones", "Coagular la sangre", "Transportar oxígeno", "Regular la temperatura corporal"],
    correctIndex: 2,
    explanation: "Los glóbulos rojos contienen hemoglobina, una proteína rica en hierro que transporta el oxígeno desde los pulmones a todo el cuerpo.",
  },
  {
    id: "cie-8",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Qué ley de Newton establece que a toda acción corresponde una reacción de igual magnitud y sentido contrario?",
    options: ["Primera Ley (Inercia)", "Segunda Ley (F = m·a)", "Tercera Ley", "Ley de Gravitación Universal"],
    correctIndex: 2,
    explanation: "La Tercera Ley de Newton (Principio de Acción y Reacción) postula que si un cuerpo A ejerce una fuerza sobre un cuerpo B, B ejerce una fuerza idéntica y opuesta sobre A.",
  },
  {
    id: "cie-9",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Qué capa de la atmósfera contiene la mayor concentración de gas ozono?",
    options: ["Troposfera", "Estratosfera", "Mesosfera", "Termosfera"],
    correctIndex: 1,
    explanation: "La capa de ozono se sitúa en la estratosfera (entre 15 y 35 km de altura) y absorbe gran parte de la dañina radiación ultravioleta del Sol.",
  },
  {
    id: "cie-10",
    category: "ciencias",
    difficulty: "hard",
    question: "¿Qué fenómeno cuántico descubrió Albert Einstein por el cual recibió el Premio Nobel de Física en 1921?",
    options: ["La Teoría de la Relatividad General", "El Efecto Fotoeléctrico", "La Radiación de Hawking", "La Fusión Nuclear"],
    correctIndex: 1,
    explanation: "Einstein demostró que la luz se propaga en paquetes discretos de energía llamados fotones, lo que sentó las bases de la física cuántica.",
  },
  {
    id: "cie-11",
    category: "ciencias",
    difficulty: "hard",
    question: "¿Cuál es el valor del pH del agua pura destilada a 25 °C?",
    options: ["5.0", "7.0", "8.5", "0.0"],
    correctIndex: 1,
    explanation: "Un pH de 7.0 representa un estado neutro, donde la concentración de iones hidrógeno [H+] es igual a la de iones hidroxilo [OH-].",
  },
  {
    id: "cie-12",
    category: "ciencias",
    difficulty: "hard",
    question: "¿Qué base nitrogenada está presente en el ARN pero NO en el ADN?",
    options: ["Timina", "Guanina", "Uracilo", "Citosina"],
    correctIndex: 2,
    explanation: "En el ARN, la base uracilo (U) sustituye a la timina (T) que se encuentra en el ADN para emparejarse con la adenina (A).",
  },
  {
    id: "cie-13",
    category: "ciencias",
    difficulty: "easy",
    question: "¿Cuál es la unidad básica del Sistema Internacional para medir la fuerza?",
    options: ["Joule", "Pascal", "Newton", "Watt"],
    correctIndex: 2,
    explanation: "El Newton (N) equivale a 1 kg·m/s² y mide la fuerza necesaria para acelerar 1 kg a 1 m/s².",
  },
  {
    id: "cie-14",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Qué nombre reciben los animales vertebrados que regulan internamente su temperatura corporal?",
    options: ["Ectotermos", "Endotermos", "Poiquilotermos", "Anfibios"],
    correctIndex: 1,
    explanation: "Los endotermos (como mamíferos y aves) mantienen una temperatura constante mediante procesos metabólicos internos.",
  },
  {
    id: "cie-15",
    category: "ciencias",
    difficulty: "hard",
    question: "¿Qué partícula elemental no tiene carga eléctrica y posee una masa diminuta casi nula?",
    options: ["Protón", "Positrón", "Neutrino", "Electrón"],
    correctIndex: 2,
    explanation: "Los neutrinos son partículas elementales extremadamente ligeras sin carga eléctrica que interactúan muy débilmente con la materia.",
  },
  {
    id: "cie-16",
    category: "ciencias",
    difficulty: "medium",
    question: "¿Cuál es el gas más abundante en la atmósfera terrestre?",
    options: ["Oxígeno (O₂)", "Nitrógeno (N₂)", "Dióxido de carbono (CO₂)", "Argón (Ar)"],
    correctIndex: 1,
    explanation: "El nitrógeno compone aproximadamente el 78% del volumen del aire que respiramos, seguido del oxígeno con cerca del 21%.",
  },

  // ==========================================
  // ➗ MATEMÁTICAS (16 preguntas)
  // ==========================================
  {
    id: "mat-1",
    category: "matematicas",
    difficulty: "easy",
    question: "¿Cuánto es el valor de x en la ecuación: 3x - 7 = 14?",
    options: ["x = 5", "x = 7", "x = 6", "x = 21"],
    correctIndex: 1,
    explanation: "Sumamos 7 a ambos lados: 3x = 21. Luego dividimos entre 3: x = 7.",
  },
  {
    id: "mat-2",
    category: "matematicas",
    difficulty: "easy",
    question: "¿Cuál es el área de un triángulo con base de 8 cm y altura de 6 cm?",
    options: ["48 cm²", "24 cm²", "14 cm²", "36 cm²"],
    correctIndex: 1,
    explanation: "El área de un triángulo se calcula como (base × altura) / 2 = (8 × 6) / 2 = 48 / 2 = 24 cm².",
  },
  {
    id: "mat-3",
    category: "matematicas",
    difficulty: "easy",
    question: "¿Cuál es el único número primo que también es un número par?",
    options: ["0", "1", "2", "4"],
    correctIndex: 2,
    explanation: "El 2 es el único número primo par, ya que cualquier otro número par mayor a 2 es divisible entre 2.",
  },
  {
    id: "mat-4",
    category: "matematicas",
    difficulty: "easy",
    question: "¿Cuánto es el 25% de 200?",
    options: ["25", "40", "50", "75"],
    correctIndex: 2,
    explanation: "El 25% equivale a una cuarta parte (1/4). 200 / 4 = 50.",
  },
  {
    id: "mat-5",
    category: "matematicas",
    difficulty: "medium",
    question: "¿Cuál es la hipotenusa de un triángulo rectángulo con catetos de 3 cm y 4 cm?",
    options: ["5 cm", "7 cm", "6 cm", "25 cm"],
    correctIndex: 0,
    explanation: "Por el Teorema de Pitágoras: c = √(3² + 4²) = √(9 + 16) = √25 = 5 cm.",
  },
  {
    id: "mat-6",
    category: "matematicas",
    difficulty: "medium",
    question: "¿Cuánto es el resultado de resolver: 20 - 4 × 3 + 2?",
    options: ["50", "10", "14", "6"],
    correctIndex: 1,
    explanation: "Por jerarquía de operaciones, resolvemos primero la multiplicación: 4 × 3 = 12. Luego sumas y restas de izquierda a derecha: 20 - 12 + 2 = 10.",
  },
  {
    id: "mat-7",
    category: "matematicas",
    difficulty: "medium",
    question: "Si lanzas un dado estándar de 6 caras, ¿cuál es la probabilidad de obtener un número primo (2, 3, 5)?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    correctIndex: 2,
    explanation: "Hay 3 números primos de 6 posibles (2, 3 y 5). La probabilidad es 3/6, que simplificado es 1/2 (50%).",
  },
  {
    id: "mat-8",
    category: "matematicas",
    difficulty: "medium",
    question: "¿Cuánto suman los ángulos interiores de cualquier triángulo en geometría euclidiana?",
    options: ["90°", "180°", "270°", "360°"],
    correctIndex: 1,
    explanation: "En la geometría euclidiana plana, la suma de los tres ángulos internos de cualquier triángulo siempre es exactamente 180°.",
  },
  {
    id: "mat-9",
    category: "matematicas",
    difficulty: "hard",
    question: "¿Cuál es el valor del logaritmo en base 2 de 64 (log₂ 64)?",
    options: ["4", "5", "6", "8"],
    correctIndex: 2,
    explanation: "log₂ 64 = 6 porque 2 elevado a la 6ª potencia es igual a 64 (2⁶ = 64).",
  },
  {
    id: "mat-10",
    category: "matematicas",
    difficulty: "hard",
    question: "¿Cuál es la derivada de la función f(x) = 3x² + 5x - 7 respecto a x?",
    options: ["6x + 5", "3x + 5", "6x² + 5", "6x - 7"],
    correctIndex: 0,
    explanation: "Aplicando la regla de la potencia: d/dx(3x²) = 6x, d/dx(5x) = 5, y la constante es 0. El resultado es 6x + 5.",
  },
  {
    id: "mat-11",
    category: "matematicas",
    difficulty: "hard",
    question: "¿Cuál es el valor de x que satisface la ecuación: 2^(x+1) = 32?",
    options: ["x = 3", "x = 4", "x = 5", "x = 6"],
    correctIndex: 1,
    explanation: "Como 32 = 2⁵, igualamos exponentes: x + 1 = 5, por lo tanto x = 4.",
  },
  {
    id: "mat-12",
    category: "matematicas",
    difficulty: "medium",
    question: "¿Cómo se llama el polígono regular que tiene exactamente 9 lados?",
    options: ["Heptágono", "Octágono", "Eneágono (o Nonágono)", "Decágono"],
    correctIndex: 2,
    explanation: "Un polígono de 9 lados se denomina eneágono o nonágono.",
  },
  {
    id: "mat-13",
    category: "matematicas",
    difficulty: "easy",
    question: "¿Qué número representa el valor de Pi (π) truncado a dos decimales?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    correctIndex: 1,
    explanation: "Pi es una constante matemática irracional cuyo valor aproximado estándar es 3.14159... (3.14 con dos decimales).",
  },
  {
    id: "mat-14",
    category: "matematicas",
    difficulty: "hard",
    question: "¿Cuántas combinaciones diferentes de 2 personas se pueden formar a partir de un grupo de 5 personas?",
    options: ["5", "10", "20", "25"],
    correctIndex: 1,
    explanation: "Calculamos combinaciones: C(5, 2) = 5! / (2! · 3!) = (5 × 4) / (2 × 1) = 10 combinaciones.",
  },
  {
    id: "mat-15",
    category: "matematicas",
    difficulty: "medium",
    question: "¿Cuál es la pendiente (m) de una recta que pasa por los puntos (1, 2) y (3, 8)?",
    options: ["2", "3", "4", "6"],
    correctIndex: 1,
    explanation: "La pendiente es m = (y₂ - y₁) / (x₂ - x₁) = (8 - 2) / (3 - 1) = 6 / 2 = 3.",
  },

  // ==========================================
  // 📖 ESPAÑOL (15 preguntas)
  // ==========================================
  {
    id: "esp-1",
    category: "espanol",
    difficulty: "easy",
    question: "¿Cuál de las siguientes palabras es una palabra esdrújula?",
    options: ["Canción", "Lámpara", "Reloj", "Papel"],
    correctIndex: 1,
    explanation: "Lámpara es esdrújula porque su sílaba tónica es la antepenúltima (LÁM-pa-ra) y todas las esdrújulas siempre llevan tilde.",
  },
  {
    id: "esp-2",
    category: "espanol",
    difficulty: "easy",
    question: "¿Qué figura retórica consiste en atribuir cualidades humanas a objetos o animales?",
    options: ["Metáfora", "Hipérbole", "Personificación (Prosopopeya)", "Aliteración"],
    correctIndex: 2,
    explanation: "La personificación o prosopopeya otorga acciones o sentimientos propios de las personas a seres inanimados (ej. 'El viento susurraba').",
  },
  {
    id: "esp-3",
    category: "espanol",
    difficulty: "easy",
    question: "¿Cuál es el antónimo directo de la palabra 'Efímero'?",
    options: ["Fugaz", "Pasajero", "Duradero", "Débil"],
    correctIndex: 2,
    explanation: "Efímero significa que dura muy poco tiempo, por lo que su antónimo directo es duradero o permanente.",
  },
  {
    id: "esp-4",
    category: "espanol",
    difficulty: "medium",
    question: "¿Cuál es el núcleo del predicado en la oración: 'Los estudiantes resolvieron el examen rápidamente'?",
    options: ["estudiantes", "resolvieron", "examen", "rápidamente"],
    correctIndex: 1,
    explanation: "El núcleo del predicado siempre es el verbo principal conjugado de la oración (en este caso, 'resolvieron').",
  },
  {
    id: "esp-5",
    category: "espanol",
    difficulty: "medium",
    question: "¿Quién escribió la célebre novela 'Cien años de soledad'?",
    options: ["Mario Vargas Llosa", "Gabriel García Márquez", "Julio Cortázar", "Octavio Paz"],
    correctIndex: 1,
    explanation: "El escritor colombiano Gabriel García Márquez publicó esta obra cumbre del realismo mágico en 1967, ganando el Premio Nobel en 1982.",
  },
  {
    id: "esp-6",
    category: "espanol",
    difficulty: "medium",
    question: "¿Qué palabra está escrita correctamente según las reglas ortográficas de la RAE?",
    options: ["Exámen", "Examen", "Examenes", "Ezamen"],
    correctIndex: 1,
    explanation: "'Examen' es una palabra llana (grave) terminada en 'n', por lo que no lleva tilde. En cambio, su plural 'exámenes' sí lleva tilde por ser esdrújula.",
  },
  {
    id: "esp-7",
    category: "espanol",
    difficulty: "medium",
    question: "¿Qué figura retórica se utiliza en la frase: 'Tengo tanta hambre que me comería una vaca entera'?",
    options: ["Hipérbole", "Ironía", "Oxímoron", "Símil"],
    correctIndex: 0,
    explanation: "La hipérbole es una exageración deliberada con fines expresivos para magnificar una idea o sentimiento.",
  },
  {
    id: "esp-8",
    category: "espanol",
    difficulty: "hard",
    question: "¿Qué tipo de nexo coordinante es la palabra 'pero' en una oración compuesta?",
    options: ["Copulativo", "Disyuntivo", "Adversativo", "Consecutivo"],
    correctIndex: 2,
    explanation: "Los nexos adversativos ('pero', 'sin embargo', 'mas', 'sino') expresan oposición o contraste entre dos proposiciones.",
  },
  {
    id: "esp-9",
    category: "espanol",
    difficulty: "hard",
    question: "¿En qué siglo se escribió la obra clásica 'Don Quijote de la Mancha' de Miguel de Cervantes?",
    options: ["Siglo XIV", "Siglo XVI", "Siglo XVII", "Siglo XIX"],
    correctIndex: 2,
    explanation: "La primera parte de Don Quijote se publicó en 1605 y la segunda en 1615, correspondientes a los inicios del Siglo XVII (Siglo de Oro español).",
  },
  {
    id: "esp-10",
    category: "espanol",
    difficulty: "easy",
    question: "¿Qué signo de puntuación se utiliza para introducir un diálogo o una enumeración anunciada?",
    options: ["Punto y coma (;)", "Dos puntos (:)", "Puntos suspensivos (...)", "Comillas (\" \")"],
    correctIndex: 1,
    explanation: "Los dos puntos (:) detienen el discurso para llamar la atención sobre lo que sigue (enumeraciones, citas textuales o diálogos).",
  },
  {
    id: "esp-11",
    category: "espanol",
    difficulty: "hard",
    question: "¿Qué relación semántica existe entre las palabras 'banco' (entidad financiera) y 'banco' (mueble para sentarse)?",
    options: ["Sinonimia", "Homonimia (homografía)", "Antonimia", "Paronimia"],
    correctIndex: 1,
    explanation: "Son palabras homógrafas (un tipo de homonimia): se escriben y pronuncian idéntico, pero tienen orígenes y significados totalmente distintos.",
  },
  {
    id: "esp-12",
    category: "espanol",
    difficulty: "medium",
    question: "¿Cuál es el modo verbal que expresa deseos, hipótesis, dudas o posibilidades?",
    options: ["Indicativo", "Subjuntivo", "Imperativo", "Infinitivo"],
    correctIndex: 1,
    explanation: "El modo subjuntivo se utiliza para manifestar acciones no reales, deseadas, hipotéticas o inciertas (ej. 'Ojalá apruebes el examen').",
  },

  // ==========================================
  // 🌎 HISTORIA Y GEOGRAFÍA (15 preguntas)
  // ==========================================
  {
    id: "his-1",
    category: "historia",
    difficulty: "easy",
    question: "¿Cuál es la capital oficial de Australia?",
    options: ["Sídney", "Melbourne", "Canberra", "Brisbane"],
    correctIndex: 2,
    explanation: "Canberra fue elegida en 1908 como solución de compromiso entre las dos ciudades más grandes, Sídney y Melbourne.",
  },
  {
    id: "his-2",
    category: "historia",
    difficulty: "easy",
    question: "¿En qué año comenzó la Primera Guerra Mundial?",
    options: ["1912", "1914", "1939", "1945"],
    correctIndex: 1,
    explanation: "La Primera Guerra Mundial inició en 1914 tras el asesinato del archiduque Francisco Fernando de Austria y finalizó en 1918.",
  },
  {
    id: "his-3",
    category: "historia",
    difficulty: "easy",
    question: "¿Cuál es el río más largo del planeta Tierra?",
    options: ["Río Nilo", "Río Amazonas", "Río Misisipi", "Río Yangtsé"],
    correctIndex: 1,
    explanation: "El río Amazonas es el más largo y caudaloso del mundo, con una longitud aproximada de 6,992 kilómetros.",
  },
  {
    id: "his-4",
    category: "historia",
    difficulty: "medium",
    question: "¿Qué civilización mesoamericana construyó la monumental ciudadela de Chichén Itzá?",
    options: ["Aztecas (Mexicas)", "Incas", "Mayas", "Olmecas"],
    correctIndex: 2,
    explanation: "Chichén Itzá fue una de las ciudades-estado más importantes de la civilización maya en la península de Yucatán.",
  },
  {
    id: "his-5",
    category: "historia",
    difficulty: "medium",
    question: "¿En qué año ocurrió la caída del Muro de Berlín?",
    options: ["1975", "1989", "1991", "1995"],
    correctIndex: 1,
    explanation: "El Muro de Berlín cayó la noche del 9 de noviembre de 1989, simbolizando el fin inminente de la Guerra Fría.",
  },
  {
    id: "his-6",
    category: "historia",
    difficulty: "medium",
    question: "¿Cuál es el océano más extenso y profundo del planeta?",
    options: ["Océano Atlántico", "Océano Índico", "Océano Pacífico", "Océano Ártico"],
    correctIndex: 2,
    explanation: "El Océano Pacífico cubre más de 165 millones de km² (más del 30% de la superficie del planeta) y alberga la Fosa de las Marianas.",
  },
  {
    id: "his-7",
    category: "historia",
    difficulty: "hard",
    question: "¿Qué tratado de 1919 puso fin formalmente a la Primera Guerra Mundial?",
    options: ["Tratado de Versalles", "Tratado de Tordesillas", "Pacto de Varsovia", "Tratado de Utrecht"],
    correctIndex: 0,
    explanation: "El Tratado de Versalles fue firmado el 28 de junio de 1919 en la Galería de los Espejos del Palacio de Versalles.",
  },
  {
    id: "his-8",
    category: "historia",
    difficulty: "medium",
    question: "¿Cuál es la cordillera montañosa más larga del mundo sobre la superficie terrestre?",
    options: ["Los Himalayas", "Los Andes", "Los Alpes", "Las Montañas Rocosas"],
    correctIndex: 1,
    explanation: "La Cordillera de los Andes se extiende por más de 7,000 km a lo largo del margen occidental de Sudamérica.",
  },
  {
    id: "his-9",
    category: "historia",
    difficulty: "hard",
    question: "¿Qué emperador romano legalizó el cristianismo mediante el Edicto de Milán en el año 313 d.C.?",
    options: ["Julio César", "Nerón", "Constantino I el Grande", "Marco Aurelio"],
    correctIndex: 2,
    explanation: "El emperador Constantino el Grande proclamó la libertad religiosa en el Imperio Romano, deteniendo las persecuciones a los cristianos.",
  },
  {
    id: "his-10",
    category: "historia",
    difficulty: "easy",
    question: "¿En qué continente se encuentra el desierto del Sahara?",
    options: ["Asia", "África", "Oceanía", "América"],
    correctIndex: 1,
    explanation: "El Sahara es el desierto cálido más grande del mundo y cubre la mayor parte del norte del continente africano.",
  },
  {
    id: "his-11",
    category: "historia",
    difficulty: "hard",
    question: "¿En qué año se fundó la Organización de las Naciones Unidas (ONU) tras la Segunda Guerra Mundial?",
    options: ["1939", "1945", "1948", "1952"],
    correctIndex: 1,
    explanation: "La ONU fue fundada el 24 de octubre de 1945 en San Francisco, California, por 51 países comprometidos con la paz mundial.",
  },
  {
    id: "his-12",
    category: "historia",
    difficulty: "medium",
    question: "¿Cuál es el país más extenso del mundo en superficie territorial?",
    options: ["Canadá", "Estados Unidos", "China", "Rusia"],
    correctIndex: 3,
    explanation: "Rusia es el país más grande del mundo con más de 17 millones de km², abarcando Europa Oriental y todo el norte de Asia.",
  },

  // ==========================================
  // 🇬🇧 INGLÉS (15 preguntas)
  // ==========================================
  {
    id: "ing-1",
    category: "ingles",
    difficulty: "easy",
    question: "Choose the correct past tense of the irregular verb 'to write':",
    options: ["Writed", "Wrote", "Written", "Writing"],
    correctIndex: 1,
    explanation: "'Write' is an irregular verb: base form 'write', past simple 'wrote', past participle 'written'.",
  },
  {
    id: "ing-2",
    category: "ingles",
    difficulty: "easy",
    question: "Complete the sentence correctly: 'She _____ to school by bus every morning.'",
    options: ["go", "goes", "gone", "going"],
    correctIndex: 1,
    explanation: "In Present Simple with third-person singular subjects (he, she, it), we add '-es' to the verb 'go' -> 'goes'.",
  },
  {
    id: "ing-3",
    category: "ingles",
    difficulty: "easy",
    question: "What is the opposite (antonym) of the adjective 'Ancient'?",
    options: ["Old", "Modern", "Historic", "Antique"],
    correctIndex: 1,
    explanation: "'Ancient' means belonging to the very distant past. Its direct opposite is 'modern' or 'contemporary'.",
  },
  {
    id: "ing-4",
    category: "ingles",
    difficulty: "medium",
    question: "What does the common English idiom 'Piece of cake' mean?",
    options: ["Something delicious", "Something very easy to do", "A birthday gift", "A dangerous task"],
    correctIndex: 1,
    explanation: "The idiom 'a piece of cake' is used informally to describe a task that is simple and effortless to accomplish.",
  },
  {
    id: "ing-5",
    category: "ingles",
    difficulty: "medium",
    question: "Choose the correct conditional form: 'If it _____ tomorrow, we will stay at home.'",
    options: ["rains", "will rain", "rained", "raining"],
    correctIndex: 0,
    explanation: "In First Conditional sentences (If + Present Simple, will + base verb), we use the Present Simple 'rains' in the if-clause.",
  },
  {
    id: "ing-6",
    category: "ingles",
    difficulty: "medium",
    question: "Which of the following words is a synonym for 'Abundant'?",
    options: ["Scarce", "Plentiful", "Tiny", "Empty"],
    correctIndex: 1,
    explanation: "'Abundant' means existing or available in large quantities; 'plentiful' is an exact synonym.",
  },
  {
    id: "ing-7",
    category: "ingles",
    difficulty: "hard",
    question: "Select the sentence written in the correct Passive Voice:",
    options: [
      "Leonardo da Vinci painted the Mona Lisa.",
      "The Mona Lisa was painted by Leonardo da Vinci.",
      "The Mona Lisa has painted Leonardo da Vinci.",
      "Leonardo da Vinci was painting the Mona Lisa."
    ],
    correctIndex: 1,
    explanation: "Passive voice structure: Subject (The Mona Lisa) + was/were + past participle (painted) + agent (by Leonardo da Vinci).",
  },
  {
    id: "ing-8",
    category: "ingles",
    difficulty: "hard",
    question: "Complete the sentence: 'By next December, they _____ in this city for ten years.'",
    options: ["will live", "will have lived", "are living", "have lived"],
    correctIndex: 1,
    explanation: "The Future Perfect tense ('will have lived') expresses an action that will be completed before a specified point in the future.",
  },
  {
    id: "ing-9",
    category: "ingles",
    difficulty: "medium",
    question: "What is the plural form of the noun 'Criterion'?",
    options: ["Criterions", "Criteria", "Criterias", "Criterium"],
    correctIndex: 1,
    explanation: "Greek-origin nouns ending in '-on' typically form their plural with '-a' (criterion -> criteria, phenomenon -> phenomena).",
  },
  {
    id: "ing-10",
    category: "ingles",
    difficulty: "hard",
    question: "What does the idiom 'To bite the bullet' mean?",
    options: ["To eat quickly", "To face a difficult situation with courage", "To start a battle", "To shoot accurately"],
    correctIndex: 1,
    explanation: "'To bite the bullet' means to force yourself to endure an unavoidable painful or difficult situation.",
  },
  {
    id: "ing-11",
    category: "ingles",
    difficulty: "easy",
    question: "Choose the correct preposition: 'I am interested _____ learning computer science.'",
    options: ["on", "in", "at", "for"],
    correctIndex: 1,
    explanation: "The adjective 'interested' is always paired with the dependent preposition 'in' ('interested in something').",
  },

  // ==========================================
  // 💻 TECNOLOGÍA (15 preguntas)
  // ==========================================
  {
    id: "tec-1",
    category: "tecnologia",
    difficulty: "easy",
    question: "¿Qué significan las siglas 'HTML' en el desarrollo de páginas web?",
    options: [
      "HyperText Markup Language",
      "High Tech Machine Learning",
      "Hyperlink Text Management List",
      "Home Tool Main Logic"
    ],
    correctIndex: 0,
    explanation: "HTML (HyperText Markup Language) es el lenguaje estándar de etiquetas utilizado para estructurar el contenido en la Web.",
  },
  {
    id: "tec-2",
    category: "tecnologia",
    difficulty: "easy",
    question: "¿Qué componente del ordenador es considerado su 'cerebro' ejecutor de instrucciones?",
    options: ["Memoria RAM", "Disco Duro (SSD)", "Procesador (CPU)", "Fuente de alimentación"],
    correctIndex: 2,
    explanation: "La Unidad Central de Procesamiento (CPU) interpreta y procesa todas las instrucciones básicas y cálculos lógicos de la computadora.",
  },
  {
    id: "tec-3",
    category: "tecnologia",
    difficulty: "easy",
    question: "¿Cuántos bits componen exactamente un Byte?",
    options: ["4 bits", "8 bits", "16 bits", "32 bits"],
    correctIndex: 1,
    explanation: "Un Byte está formado por 8 bits individuales (secuencias de ceros y unos: 00000000 a 11111111).",
  },
  {
    id: "tec-4",
    category: "tecnologia",
    difficulty: "medium",
    question: "¿Qué tipo de memoria es volátil y pierde su información al apagarse el equipo?",
    options: ["Memoria ROM", "Memoria RAM", "Memoria Flash (USB)", "Disco SSD"],
    correctIndex: 1,
    explanation: "La memoria RAM (Random Access Memory) almacena temporalmente los datos de programas en ejecución y se borra al cortar el suministro eléctrico.",
  },
  {
    id: "tec-5",
    category: "tecnologia",
    difficulty: "medium",
    question: "¿Quién es ampliamente reconocido como el creador de la World Wide Web (WWW) en 1989?",
    options: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Alan Turing"],
    correctIndex: 2,
    explanation: "El científico británico Sir Tim Berners-Lee propuso e implementó la World Wide Web en el laboratorio del CERN en 1989.",
  },
  {
    id: "tec-6",
    category: "tecnologia",
    difficulty: "medium",
    question: "¿Qué protocolo seguro se utiliza para encriptar la navegación web moderna mediante certificados SSL/TLS?",
    options: ["HTTP", "HTTPS", "FTP", "SMTP"],
    correctIndex: 1,
    explanation: "HTTPS (Hypertext Transfer Protocol Secure) cifra la comunicación entre el navegador y el servidor para evitar intercepciones de datos sensibles.",
  },
  {
    id: "tec-7",
    category: "tecnologia",
    difficulty: "hard",
    question: "¿Qué estructura de datos opera bajo el principio LIFO (Last In, First Out / Último en entrar, primero en salir)?",
    options: ["Cola (Queue)", "Pila (Stack)", "Árbol binario", "Lista enlazada"],
    correctIndex: 1,
    explanation: "Una Pila (Stack) apila elementos donde el último dato agregado es el primero que se retira, similar a una pila de platos.",
  },
  {
    id: "tec-8",
    category: "tecnologia",
    difficulty: "hard",
    question: "¿Cómo se llama la prueba propuesta en 1950 para evaluar si una máquina puede exhibir inteligencia indistinguible de la humana?",
    options: ["Test de Turing", "Hipótesis de Riemann", "Paradoja de Fermi", "Prueba de Voight-Kampff"],
    correctIndex: 0,
    explanation: "Alan Turing formuló el Test de Turing para determinar si un interlocutor humano puede distinguir si habla con otra persona o con un programa de computadora.",
  },
  {
    id: "tec-9",
    category: "tecnologia",
    difficulty: "medium",
    question: "¿Qué lenguaje de programación fue creado por Guido van Rossum y es famoso por su sintaxis clara y uso en IA?",
    options: ["Java", "C++", "Python", "Ruby"],
    correctIndex: 2,
    explanation: "Python fue lanzado en 1991 y se ha convertido en el lenguaje líder mundial para ciencia de datos, inteligencia artificial y educación.",
  },
  {
    id: "tec-10",
    category: "tecnologia",
    difficulty: "hard",
    question: "¿Qué algoritmo criptográfico asimétrico de clave pública se basa en la dificultad de factorizar números primos grandes?",
    options: ["AES", "RSA", "SHA-256", "DES"],
    correctIndex: 1,
    explanation: "El algoritmo RSA (desarrollado por Rivest, Shamir y Adleman en 1977) utiliza dos claves y fundamenta su seguridad en la factorización de números primos gigantescos.",
  },
  {
    id: "tec-11",
    category: "tecnologia",
    difficulty: "easy",
    question: "¿Qué sistema operativo de código abierto tiene como mascota al pingüino Tux?",
    options: ["Windows", "macOS", "Linux", "Solaris"],
    correctIndex: 2,
    explanation: "Linux, creado por Linus Torvalds en 1991, es el núcleo de código abierto más utilizado en servidores, supercomputadoras y dispositivos móviles (Android).",
  },

  // ==========================================
  // 🧠 CULTURA GENERAL (15 preguntas)
  // ==========================================
  {
    id: "cul-1",
    category: "cultura-general",
    difficulty: "easy",
    question: "¿Quién pintó la famosa obra renacentista de 'La Gioconda' (Mona Lisa)?",
    options: ["Miguel Ángel", "Leonardo da Vinci", "Rafael Sanzio", "Vincent van Gogh"],
    correctIndex: 1,
    explanation: "Leonardo da Vinci pintó la Mona Lisa a principios del siglo XVI; hoy en día se exhibe en el Museo del Louvre en París.",
  },
  {
    id: "cul-2",
    category: "cultura-general",
    difficulty: "easy",
    question: "¿Cuál es el instrumento musical de cuerdas frotadas más agudo de una orquesta sinfónica?",
    options: ["Violonchelo", "Viola", "Violín", "Contrabajo"],
    correctIndex: 2,
    explanation: "El violín es el instrumento más pequeño y de tesitura más aguda de la familia de cuerdas clásicas.",
  },
  {
    id: "cul-3",
    category: "cultura-general",
    difficulty: "easy",
    question: "¿En qué país se originaron los Juegos Olímpicos en la antigüedad?",
    options: ["Italia", "Grecia", "Egipto", "Persia"],
    correctIndex: 1,
    explanation: "Los Juegos Olímpicos nacieron en el año 776 a.C. en la ciudad griega de Olimpia en honor al dios Zeus.",
  },
  {
    id: "cul-4",
    category: "cultura-general",
    difficulty: "medium",
    question: "¿Qué filósofo griego fue maestro de Platón y es famoso por la frase 'Solo sé que no sé nada'?",
    options: ["Aristóteles", "Sócrates", "Pitágoras", "Epicuro"],
    correctIndex: 1,
    explanation: "Sócrates revolucionó la filosofía moral mediante el método mayéutico (el arte del cuestionamiento reflexivo).",
  },
  {
    id: "cul-5",
    category: "cultura-general",
    difficulty: "medium",
    question: "¿Cuál es el metal precioso cuyo símbolo químico en la tabla periódica es 'Au'?",
    options: ["Plata", "Oro", "Cobre", "Platino"],
    correctIndex: 1,
    explanation: "El símbolo 'Au' proviene de la palabra latina 'aurum', que significa 'brillo del amanecer'.",
  },
  {
    id: "cul-6",
    category: "cultura-general",
    difficulty: "medium",
    question: "¿Qué pintor neerlandés pintó 'La noche estrellada' en 1889?",
    options: ["Rembrandt", "Johannes Vermeer", "Vincent van Gogh", "Claude Monet"],
    correctIndex: 2,
    explanation: "Vincent van Gogh creó esta icónica obra postimpresionista mientras residía en el sanatorio de Saint-Rémy-de-Provence.",
  },
  {
    id: "cul-7",
    category: "cultura-general",
    difficulty: "hard",
    question: "¿Quién compuso la Novena Sinfonía que incluye el célebre 'Himno a la Alegría'?",
    options: ["Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Johann Sebastian Bach", "Frédéric Chopin"],
    correctIndex: 1,
    explanation: "Beethoven compuso su monumental Novena Sinfonía entre 1822 y 1824, cuando ya padecía una sordera prácticamente total.",
  },
  {
    id: "cul-8",
    category: "cultura-general",
    difficulty: "hard",
    question: "¿En qué museo se encuentra expuesta la famosa escultura helenística de la 'Venus de Milo'?",
    options: ["Museo del Prado (Madrid)", "Museo Británico (Londres)", "Museo del Louvre (París)", "Museos Vaticanos (Roma)"],
    correctIndex: 2,
    explanation: "La Venus de Milo (Afrodita de Milos) se conserva en el Museo del Louvre en París desde su descubrimiento en 1820.",
  },
  {
    id: "cul-9",
    category: "cultura-general",
    difficulty: "medium",
    question: "¿Cuál es el libro sagrado de la religión islámica?",
    options: ["La Torá", "El Corán", "Los Vedas", "El Talmud"],
    correctIndex: 1,
    explanation: "El Corán es el libro sagrado del islam, el cual contiene las revelaciones entregadas al profeta Mahoma.",
  },
  {
    id: "cul-10",
    category: "cultura-general",
    difficulty: "easy",
    question: "¿Cuál es el edificio o estructura hecha por el ser humano más alta del mundo actual?",
    options: ["Torre Eiffel", "Burj Khalifa", "Empire State Building", "Torre de Shanghái"],
    correctIndex: 1,
    explanation: "El rascacielos Burj Khalifa en Dubái, Emiratos Árabes Unidos, mide 828 metros de altura y tiene 163 pisos.",
  },
  {
    id: "cul-11",
    category: "cultura-general",
    difficulty: "hard",
    question: "¿Qué célebre inventora y actriz austriaca patentó la técnica de espectro ensanchado por salto de frecuencia (base del Wi-Fi y Bluetooth)?",
    options: ["Marie Curie", "Hedy Lamarr", "Ada Lovelace", "Rosalind Franklin"],
    correctIndex: 1,
    explanation: "Hedy Lamarr patentó en 1942 un sistema de guía de torpedos por radio con salto de frecuencia que sentó las bases de las comunicaciones inalámbricas modernas.",
  },
  {
    id: "cul-12",
    category: "cultura-general",
    difficulty: "medium",
    question: "¿Qué dios nórdico empuña el legendario martillo Mjolnir y controla los truenos?",
    options: ["Odín", "Loki", "Thor", "Freyr"],
    correctIndex: 2,
    explanation: "Thor es el dios del trueno y la fuerza en la mitología nórdica, hijo de Odín y protector de la humanidad en Midgard.",
  },
];

/**
 * Helper to select and prepare a balanced list of questions for a match
 */
export function getRetoQuestions(
  category: RetoCategory | "random",
  count: number = 10,
  progressiveDifficulty: boolean = true
): RetoQuestion[] {
  let pool = category === "random"
    ? [...RETO_QUESTIONS_DB]
    : RETO_QUESTIONS_DB.filter(q => q.category === category);

  if (pool.length === 0) {
    pool = [...RETO_QUESTIONS_DB];
  }

  // Shuffle array using Fisher-Yates
  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  if (!progressiveDifficulty) {
    return shuffle(pool).slice(0, count);
  }

  // Progressive difficulty: ~30% easy, ~40% medium, ~30% hard
  const easy = shuffle(pool.filter(q => q.difficulty === "easy"));
  const medium = shuffle(pool.filter(q => q.difficulty === "medium"));
  const hard = shuffle(pool.filter(q => q.difficulty === "hard"));

  const numEasy = Math.min(easy.length, Math.max(1, Math.round(count * 0.3)));
  const numHard = Math.min(hard.length, Math.max(1, Math.round(count * 0.3)));
  const numMedium = Math.min(medium.length, count - numEasy - numHard);

  const selectedEasy = easy.slice(0, numEasy);
  const selectedMedium = medium.slice(0, numMedium);
  const selectedHard = hard.slice(0, numHard);

  let result = [...selectedEasy, ...selectedMedium, ...selectedHard];

  // If we still need more to reach count, fill with whatever is left
  if (result.length < count) {
    const resultIds = new Set(result.map(q => q.id));
    const remaining = shuffle(pool.filter(q => !resultIds.has(q.id)));
    result = [...result, ...remaining.slice(0, count - result.length)];
  }

  return result.slice(0, count);
}
