export interface EXANIQuestion {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  section: string;
  subtopic: string;
}

export const EXANI_OFFICIAL_QUESTIONS: EXANIQuestion[] = [
  // ==========================================
  // 1. COMPRENSIÓN LECTORA
  // ==========================================
  {
    q: "¿Qué habilidad evalúa el área de Comprensión lectora del EXANI-II?",
    options: [
      "Memorizar reglas ortográficas",
      "Identificar, interpretar y evaluar la forma y el contenido de textos",
      "Resolver operaciones matemáticas a partir de un texto",
    ],
    correctIndex: 1,
    explanation: "El área de Comprensión lectora del EXANI-II evalúa la capacidad de identificar información explícita, interpretar el sentido global e intenciones del autor y evaluar la estructura y contenido del texto.",
    section: "comprension_lectora",
    subtopic: "Comprensión Lectora",
  },
  {
    q: "En un texto argumentativo, ¿qué proceso se evalúa cuando se pide identificar la postura del autor?",
    options: [
      "Identificación de información",
      "Interpretación",
      "Evaluación de la forma y el contenido",
    ],
    correctIndex: 1,
    explanation: "Identificar la postura o tesis del autor requiere deducir e interpretar la intención comunicativa y el sentido global del texto más allá de los datos explícitos.",
    section: "comprension_lectora",
    subtopic: "Comprensión Lectora",
  },
  {
    q: "¿Cuáles son los tres ámbitos textuales que evalúa el área de Comprensión lectora en el EXANI-II?",
    options: [
      "Estudio, literario, participación social",
      "Científico, histórico, técnico",
      "Narrativo, descriptivo, expositivo",
    ],
    correctIndex: 0,
    explanation: "Según la Guía Ceneval EXANI-II 2025, los tres ámbitos textuales evaluados son: Ámbito de estudio, Ámbito literario y Ámbito de participación social.",
    section: "comprension_lectora",
    subtopic: "Comprensión Lectora",
  },
  {
    q: "Cuando se pide justificar por qué el autor incluyó cierta información en el texto, se evalúa:",
    options: [
      "Identificación de información",
      "Interpretación",
      "Evaluación de la forma y el contenido",
    ],
    correctIndex: 2,
    explanation: "Juzgar la pertinencia, función retórica o justificación de los recursos empleados por el autor corresponde al nivel de evaluación de la forma y el contenido.",
    section: "comprension_lectora",
    subtopic: "Comprensión Lectora",
  },

  // ==========================================
  // 2. REDACCIÓN INDIRECTA
  // ==========================================
  {
    q: "¿Qué evalúa principalmente el área de Redacción indirecta en el EXANI-II?",
    options: [
      "Conocimientos teóricos de gramática",
      "Selección de pasajes que cumplan convenciones gramaticales, semánticas y ortográficas",
      "Redacción libre de un ensayo",
    ],
    correctIndex: 1,
    explanation: "Evalúa la habilidad del sustentante para seleccionar fragmentos textuales correctos que cumplan con la normativa gramatical, semántica, ortográfica y adecuación al contexto comunicativo.",
    section: "redaccion_indirecta",
    subtopic: "Redacción Indirecta",
  },
  {
    q: "¿En qué documento se basaron las reglas de acentuación y ortografía para el área de Redacción indirecta?",
    options: [
      "Diccionario panhispánico de dudas (edición 2005, versión original)",
      "Nueva gramática básica de la lengua española (edición 2020)",
      "Manual de estilo Chicago",
    ],
    correctIndex: 0,
    explanation: "El Ceneval establece como referencia normativa oficial para esta área el Diccionario panhispánico de dudas (DPD, 2005).",
    section: "redaccion_indirecta",
    subtopic: "Redacción Indirecta",
  },
  {
    q: "Un texto que emplea un registro coloquial en un contexto que exige formalidad académica se considera:",
    options: [
      "Correcto por ser natural",
      "Incorrecto por inadecuación de registro",
      "Correcto si es gramaticalmente válido",
    ],
    correctIndex: 1,
    explanation: "En la evaluación de redacción indirecta, la adecuación al registro formal o académico requerido por la situación comunicativa es un criterio esencial de corrección.",
    section: "redaccion_indirecta",
    subtopic: "Redacción Indirecta",
  },
  {
    q: "Las palabras con diptongo de vocal abierta tónica + cerrada átona (como \"mesiánicas\") llevan tilde en:",
    options: [
      "La vocal cerrada",
      "La vocal abierta",
      "No llevan tilde",
    ],
    correctIndex: 1,
    explanation: "En diptongos formados por una vocal abierta (a, e, o) y una cerrada (i, u), el acento ortográfico se coloca siempre sobre la vocal abierta (en \"mesiánicas\", sobre la 'a').",
    section: "redaccion_indirecta",
    subtopic: "Redacción Indirecta",
  },

  // ==========================================
  // 3. PENSAMIENTO MATEMÁTICO
  // ==========================================
  {
    q: "El área de Pensamiento matemático del EXANI-II se divide en las subáreas de:",
    options: [
      "Aritmética y Álgebra",
      "Comprensión de lo matemático y Matematización",
      "Geometría y Estadística",
    ],
    correctIndex: 1,
    explanation: "El temario oficial Ceneval divide Pensamiento Matemático en dos grandes subáreas: Comprensión de lo matemático y Matematización.",
    section: "pensamiento_matematico",
    subtopic: "Pensamiento Matemático",
  },
  {
    q: "Resuelve la siguiente operación con signos de agrupación: -9{9 - [(-8) ÷ (-4)] + 9 - 6}",
    options: [
      "-90",
      "-19",
      "1",
    ],
    correctIndex: 0,
    explanation: "Primero la división: (-8) ÷ (-4) = 2. Luego dentro de la llave: 9 - [2] + 9 - 6 = 7 + 9 - 6 = 10. Finalmente: -9 × (10) = -90.",
    section: "pensamiento_matematico",
    subtopic: "Pensamiento Matemático",
  },
  {
    q: "Si A = x - 3, B = 3x³ - x², C = -4x² + 2x, ¿cuál es el resultado simplificado de B + 2C - A?",
    options: [
      "3x³ - 9x² + 3x + 3",
      "3x³ - 9x² + x + 3",
      "3x³ - 9x² - 5x + 3",
    ],
    correctIndex: 0,
    explanation: "Sustituyendo: (3x³ - x²) + 2(-4x² + 2x) - (x - 3) = 3x³ - x² - 8x² + 4x - x + 3 = 3x³ - 9x² + 3x + 3.",
    section: "pensamiento_matematico",
    subtopic: "Pensamiento Matemático",
  },
  {
    q: "¿Cuál de los siguientes temas NO forma parte del bloque \"Conexiones\" en Comprensión de lo matemático?",
    options: [
      "Razones y proporciones",
      "Ejes de simetría",
      "Sistemas de ecuaciones con tres incógnitas",
    ],
    correctIndex: 2,
    explanation: "Los sistemas de ecuaciones con tres incógnitas no pertenecen al núcleo de 'Conexiones' de Comprensión de lo matemático del EXANI-II.",
    section: "pensamiento_matematico",
    subtopic: "Pensamiento Matemático",
  },

  // ==========================================
  // 4. INGLÉS (Diagnóstico)
  // ==========================================
  {
    q: "¿Qué nivel del Marco Común Europeo de Referencia (MCER) evalúa el EXANI-II en el área de Inglés?",
    options: [
      "A2",
      "B1",
      "C1",
    ],
    correctIndex: 1,
    explanation: "El módulo diagnóstico de inglés del EXANI-II está alineado al nivel B1 del Marco Común Europeo de Referencia.",
    section: "ingles",
    subtopic: "Inglés Diagnóstico",
  },
  {
    q: "Elige la opción correcta para completar la oración:\n\"Marie Van Brittan Brown, an African American nurse living ___ Jamaica, Queens...\"",
    options: [
      "at",
      "in",
      "on",
    ],
    correctIndex: 1,
    explanation: "Para ciudades, vecindarios o barrios (como Jamaica, Queens), se utiliza la preposición de lugar 'in'.",
    section: "ingles",
    subtopic: "Inglés Diagnóstico",
  },
  {
    q: "¿Cuáles son las dos subáreas que integran el área de Inglés en el EXANI-II?",
    options: [
      "Gramática y Vocabulario",
      "Comprensión lectora y Redacción indirecta",
      "Escucha y Habla",
    ],
    correctIndex: 1,
    explanation: "Al igual que en español, el módulo de inglés evalúa dos subáreas: Comprensión lectora (Reading comprehension) y Redacción indirecta (Written language use).",
    section: "ingles",
    subtopic: "Inglés Diagnóstico",
  },

  // ==========================================
  // 5. ADMINISTRACIÓN
  // ==========================================
  {
    q: "¿Qué área funcional de una empresa se encarga de la promoción, distribución y venta de bienes y servicios?",
    options: [
      "Producción",
      "Finanzas",
      "Mercadotecnia",
    ],
    correctIndex: 2,
    explanation: "La mercadotecnia (marketing) es el área funcional enfocada en la investigación de mercados, publicidad, fijación de precios, promoción y distribución/venta.",
    section: "administracion",
    subtopic: "Administración",
  },
  {
    q: "¿Cuáles son las cuatro etapas esenciales del proceso administrativo?",
    options: [
      "Planeación, organización, dirección y control",
      "Diagnóstico, ejecución y evaluación",
      "Investigación, desarrollo y venta",
    ],
    correctIndex: 0,
    explanation: "El proceso administrativo clásico formulado por Henri Fayol comprende: Planeación, Organización, Dirección y Control.",
    section: "administracion",
    subtopic: "Administración",
  },

  // ==========================================
  // 6. ARITMÉTICA
  // ==========================================
  {
    q: "¿Qué operación matemática se utiliza para encontrar el múltiplo positivo más pequeño que comparten dos o más números?",
    options: [
      "Máximo común divisor",
      "Mínimo común múltiplo",
      "Factorización prima",
    ],
    correctIndex: 1,
    explanation: "El Mínimo Común Múltiplo (mcm) es el menor número entero positivo que es múltiplo de cada uno de los números dados.",
    section: "aritmetica",
    subtopic: "Aritmética",
  },
  {
    q: "En un problema de reparto proporcional, ¿qué elementos son indispensables para calcularlo?",
    options: [
      "Solo la cantidad total a repartir",
      "La cantidad total y las razones o partes asignadas",
      "Solo el número de personas",
    ],
    correctIndex: 1,
    explanation: "Para efectuar un reparto proporcional se necesita conocer la cantidad global a distribuir y los índices o factores proporcionales (razones) de cada beneficiario.",
    section: "aritmetica",
    subtopic: "Aritmética",
  },

  // ==========================================
  // 7. BIOLOGÍA
  // ==========================================
  {
    q: "Los productos finales de la respiración celular aerobia son:",
    options: [
      "O2 y glucosa",
      "ATP y CO2",
      "NADH y etanol",
    ],
    correctIndex: 1,
    explanation: "En la respiración aerobia, la glucosa reacciona con O2 para producir energía en forma de ATP, dióxido de carbono (CO2) y agua (H2O).",
    section: "biologia",
    subtopic: "Biología y Ciencias de la Salud",
  },
  {
    q: "Los productos de la respiración anaerobia (fermentación alcohólica) en hongos como las levaduras son:",
    options: [
      "ATP y CO2",
      "NADH y etanol",
      "O2 y glucosa",
    ],
    correctIndex: 1,
    explanation: "La fermentación alcohólica produce etanol, CO2 y regenera moléculas de coenzimas como NADH/NAD+ junto a una pequeña ganancia de ATP.",
    section: "biologia",
    subtopic: "Biología y Ciencias de la Salud",
  },
  {
    q: "¿Qué proceso celular genera oxígeno (O2) y glucosa (C6H12O6) como productos finales?",
    options: [
      "Respiración celular",
      "Fotosíntesis",
      "Fermentación",
    ],
    correctIndex: 1,
    explanation: "La fotosíntesis utiliza energía solar, agua y CO2 para sintetizar glucosa y liberar oxígeno molecular a la atmósfera.",
    section: "biologia",
    subtopic: "Biología y Ciencias de la Salud",
  },

  // ==========================================
  // 8. CIENCIAS DE LA SALUD
  // ==========================================
  {
    q: "En la triada ecológica de la salud-enfermedad, la bacteria causante de una infección corresponde al:",
    options: [
      "Huésped",
      "Agente",
      "Ambiente",
    ],
    correctIndex: 1,
    explanation: "El agente etiológico o causal es el factor biológico, físico o químico (como bacterias o virus) responsable del desarrollo de la enfermedad.",
    section: "ciencias_salud",
    subtopic: "Ciencias de la Salud (Premedicina)",
  },
  {
    q: "¿Cuál es el rango normal de temperatura corporal en reposo en un adulto sano?",
    options: [
      "34 - 35 °C",
      "36.5 - 37 °C",
      "38 - 39 °C",
    ],
    correctIndex: 1,
    explanation: "El rango normotérmico promedio del cuerpo humano se sitúa entre 36.5 °C y 37.2 °C.",
    section: "ciencias_salud",
    subtopic: "Ciencias de la Salud (Premedicina)",
  },
  {
    q: "Una cifra de presión arterial de 140/95 mmHg en un adulto se clasifica como:",
    options: [
      "Normal",
      "Fuera de parámetros normales (elevada)",
      "Baja",
    ],
    correctIndex: 1,
    explanation: "Una presión arterial de 140/95 mmHg supera el rango óptimo (<120/80 mmHg) y se clasifica clínicamente como hipertensión o presión arterial elevada.",
    section: "ciencias_salud",
    subtopic: "Ciencias de la Salud (Premedicina)",
  },

  // ==========================================
  // 9. DERECHO
  // ==========================================
  {
    q: "¿Qué derecho humano fundamental tiene como finalidad principal limitar la actividad del Estado frente a la esfera de acción de las personas?",
    options: [
      "Igualdad",
      "Seguridad",
      "Libertad",
    ],
    correctIndex: 2,
    explanation: "Los derechos de libertad imponen al Estado un deber de no interferencia, garantizando la autodeterminación de las personas.",
    section: "derecho",
    subtopic: "Derecho",
  },
  {
    q: "¿Cuáles son las ramas del derecho evaluadas en el módulo específico de Derecho del EXANI-II?",
    options: [
      "Laboral, civil, mercantil, constitucional, penal y administrativa",
      "Solo civil y penal",
      "Internacional y ambiental",
    ],
    correctIndex: 0,
    explanation: "El temario oficial de Derecho del Ceneval abarca las ramas: Constitucional, Civil, Penal, Administrativa, Laboral y Mercantil.",
    section: "derecho",
    subtopic: "Derecho",
  },

  // ==========================================
  // 10. ECONOMÍA
  // ==========================================
  {
    q: "De acuerdo con la teoría económica marxista, la ganancia del capitalista proviene de:",
    options: [
      "El capital invertido",
      "El plusvalor (trabajo excedente no pagado)",
      "El comercio internacional",
    ],
    correctIndex: 1,
    explanation: "Marx plantea que la plusvalía surge de la jornada laboral excedente realizada por el trabajador que no es remunerada en su salario.",
    section: "economia",
    subtopic: "Economía",
  },
  {
    q: "Según Adam Smith y la escuela clásica, el beneficio o ganancia proviene de:",
    options: [
      "El capital, como pago justo por el riesgo empresarial",
      "El plusvalor",
      "El Estado",
    ],
    correctIndex: 0,
    explanation: "Para Adam Smith, la ganancia remunera la inversión y el riesgo productivo asumido por el dueño del capital.",
    section: "economia",
    subtopic: "Economía",
  },

  // ==========================================
  // 11. FILOSOFÍA
  // ==========================================
  {
    q: "La capacidad de asombro de los filósofos presocráticos les permitió:",
    options: [
      "Aceptar explicaciones míticas",
      "Ir más allá de lo mítico e indagar el arjé de la physis",
      "Rechazar toda pregunta filosófica",
    ],
    correctIndex: 1,
    explanation: "El asombro impulsó el paso del mito al logos, buscando el principio originario (arjé) que gobierna la naturaleza (physis).",
    section: "filosofia",
    subtopic: "Filosofía",
  },
  {
    q: "¿Qué distingue esencialmente a una pregunta filosófica de una simple duda?",
    options: [
      "La pregunta filosófica nos lleva a filosofar; la duda es solo carencia de certezas",
      "Son sinónimos",
      "La duda es más profunda que la pregunta filosófica",
    ],
    correctIndex: 0,
    explanation: "La pregunta filosófica es reflexiva, busca fundamentos universales y genera conocimiento crítico, mientras que la duda es un estado psicológico de incertidumbre.",
    section: "filosofia",
    subtopic: "Filosofía",
  },

  // ==========================================
  // 12. FÍSICA
  // ==========================================
  {
    q: "Un niño hace girar una lonchera de 0.5 kg con una cuerda de 0.5 m, con un momento angular de 1.25 N·m·s. ¿Cuál es su rapidez angular?",
    options: [
      "2.5 rad/s",
      "5.0 rad/s",
      "10.0 rad/s",
    ],
    correctIndex: 2,
    explanation: "L = m × r² × ω → 1.25 = 0.5 × (0.5)² × ω = 0.5 × 0.25 × ω = 0.125 × ω → ω = 1.25 / 0.125 = 10.0 rad/s.",
    section: "fisica",
    subtopic: "Física e Ingenierías",
  },
  {
    q: "¿Cuál es la fórmula correcta del momento angular (L) para una partícula puntual en movimiento circular?",
    options: [
      "L = m × v",
      "L = I × ω = m × r² × ω",
      "L = m × g × h",
    ],
    correctIndex: 1,
    explanation: "El momento angular de un objeto puntual en rotación circular es el producto del momento de inercia (I = m·r²) por la velocidad angular (ω): L = m·r²·ω.",
    section: "fisica",
    subtopic: "Física e Ingenierías",
  },

  // ==========================================
  // 13. HISTORIA
  // ==========================================
  {
    q: "¿Cuáles fueron las causas fundamentales del levantamiento zapatista (EZLN) en México en 1994?",
    options: [
      "Demandas salariales del magisterio",
      "El abandono de comunidades indígenas y falta de derechos humanos en Chiapas",
      "La represión de la libertad de prensa",
    ],
    correctIndex: 1,
    explanation: "El EZLN se levantó en armas el 1 de enero de 1994 exigiendo reconocimiento de derechos indígenas, tierra, salud, educación y fin a la marginación histórica en Chiapas.",
    section: "historia",
    subtopic: "Historia",
  },
  {
    q: "El movimiento estudiantil mexicano de 1968 estuvo primordialmente vinculado con:",
    options: [
      "La búsqueda de autonomía de comunidades indígenas",
      "La participación política ciudadana y la represión gubernamental",
      "Demandas salariales del sector obrero",
    ],
    correctIndex: 1,
    explanation: "El movimiento de 1968 demandaba libertades democráticas, fin al autoritarismo y cese a la represión policial y militar del gobierno.",
    section: "historia",
    subtopic: "Historia",
  },

  // ==========================================
  // 14. LITERATURA
  // ==========================================
  {
    q: "¿Cuál de las siguientes obras cumbres pertenece a la literatura romana clásica?",
    options: [
      "La teogonía (Hesíodo)",
      "Historia de la guerra del Peloponeso (Tucídides)",
      "Las metamorfosis (Ovidio)",
    ],
    correctIndex: 2,
    explanation: "Las metamorfosis es una obra poética en quince libros del escritor romano Publio Ovidio Nasón.",
    section: "literatura",
    subtopic: "Literatura",
  },
  {
    q: "La obra épica y cosmológica \"La teogonía\", escrita por Hesíodo, pertenece a la cultura:",
    options: [
      "Griega",
      "Romana",
      "Medieval",
    ],
    correctIndex: 0,
    explanation: "Hesíodo fue un destacado poeta de la Antigua Grecia; en La Teogonía relata el origen del cosmos y la genealogía de los dioses griegos.",
    section: "literatura",
    subtopic: "Literatura",
  },

  // ==========================================
  // 15. MATEMÁTICAS FINANCIERAS
  // ==========================================
  {
    q: "Un automóvil cuesta $335,900. Se da el 23% de enganche y se cobra 15% de interés simple anual sobre el remanente a 1 año. ¿Cuál es el precio total pagado?",
    options: [
      "$297,439.45",
      "$374,696.45",
      "$386,285.00",
    ],
    correctIndex: 1,
    explanation: "Enganche (23%) = $77,257. Remanente a financiar (77%) = $258,643. Interés (15% sobre remanente) = $38,796.45. Total pagado = $77,257 + $258,643 + $38,796.45 = $374,696.45.",
    section: "matematicas_financieras",
    subtopic: "Matemáticas Financieras",
  },
  {
    q: "¿Qué variables o elementos intervienen en el modelo de cálculo del interés simple?",
    options: [
      "Capital, tasa, tiempo y monto",
      "Solo el capital",
      "Solo la tasa de interés",
    ],
    correctIndex: 0,
    explanation: "La fórmula de interés simple I = C × i × t relaciona el capital inicial (C), la tasa de interés (i), el periodo temporal (t) y el monto total acumulado (M = C + I).",
    section: "matematicas_financieras",
    subtopic: "Matemáticas Financieras",
  },

  // ==========================================
  // 16. PROBABILIDAD Y ESTADÍSTICA
  // ==========================================
  {
    q: "Calcula la media aritmética del siguiente conjunto de datos: 15, 22, 13, 17, 12, 16, 21, 22, 11, 26, 23",
    options: [
      "16",
      "17",
      "18",
    ],
    correctIndex: 2,
    explanation: "Suma de los 11 valores: 15 + 22 + 13 + 17 + 12 + 16 + 21 + 22 + 11 + 26 + 23 = 198. Media = 198 / 11 = 18.",
    section: "probabilidad_estadistica",
    subtopic: "Probabilidad y Estadística",
  },
  {
    q: "¿Qué medida de tendencia central corresponde al valor posicional que divide un conjunto de datos ordenados exactamente a la mitad (50%)?",
    options: [
      "Media",
      "Mediana",
      "Moda",
    ],
    correctIndex: 1,
    explanation: "La mediana es el valor central que divide a una distribución previamente ordenada en dos partes con igual número de observaciones.",
    section: "probabilidad_estadistica",
    subtopic: "Probabilidad y Estadística",
  },

  // ==========================================
  // 17. PSICOLOGÍA
  // ==========================================
  {
    q: "Un joven recuerda con alegría y detalle los festejos de cumpleaños que le organizaban sus padres en su infancia. ¿Qué tipo de memoria a largo plazo se ejemplifica?",
    options: [
      "Sensorial",
      "Episódica",
      "Semántica",
    ],
    correctIndex: 1,
    explanation: "La memoria episódica almacena vivencias autobiográficas ligadas a un momento y lugar específico del pasado personal.",
    section: "psicologia",
    subtopic: "Psicología",
  },
  {
    q: "El sistema de memoria que retiene información capturada por los órganos de los sentidos durante fracciones de segundo (milisegundos) se denomina:",
    options: [
      "Sensorial",
      "Episódica",
      "Semántica",
    ],
    correctIndex: 0,
    explanation: "La memoria sensorial retiene la huella perceptual de estímulos visuales (icónica) o auditivos (ecoica) por unos pocos milisegundos.",
    section: "psicologia",
    subtopic: "Psicología",
  },

  // ==========================================
  // 18. QUÍMICA
  // ==========================================
  {
    q: "En la ecuación química Fe + CuSO4 → FeSO4 + Cu, ¿qué tipo de reacción inorgánica se lleva a cabo?",
    options: [
      "Doble sustitución",
      "Sustitución simple (desplazamiento)",
      "Análisis (descomposición)",
    ],
    correctIndex: 1,
    explanation: "El hierro (Fe) desplaza al cobre (Cu) de su compuesto formando sulfato ferroso y liberando cobre metálico: A + BC → AC + B.",
    section: "quimica",
    subtopic: "Química",
  },
  {
    q: "Una reacción química de descomposición o análisis se representa mediante el modelo algebraico:",
    options: [
      "A + BC → AC + B",
      "AB → A + B",
      "AB + CD → AD + BC",
    ],
    correctIndex: 1,
    explanation: "En una reacción de análisis o descomposición, una sola sustancia compleja se divide en dos o más sustancias más simples: AB → A + B.",
    section: "quimica",
    subtopic: "Química",
  },

  // ==========================================
  // 19. CIENCIAS EXPERIMENTALES
  // ==========================================
  {
    q: "En un spa de relajación, ¿cuál de las siguientes situaciones ejemplifica con mayor precisión la búsqueda y logro de un equilibrio térmico?",
    options: [
      "Un baño en cabina de vapor",
      "El remojo prolongado de pies en un recipiente con agua caliente",
      "El secado de cabello con una secadora de aire caliente",
    ],
    correctIndex: 1,
    explanation: "Al sumergir los pies en agua caliente por cierto tiempo, el calor fluye entre el agua y la piel hasta que ambos cuerpos alcanzan la misma temperatura (equilibrio térmico).",
    section: "ciencias_experimentales",
    subtopic: "Ciencias Experimentales",
  },

  // ==========================================
  // 20. CIENCIAS SOCIALES
  // ==========================================
  {
    q: "En un aula de primaria, un maestro enseña a los niños valores cívicos y respeto a través de la historia de los héroes de la patria. ¿Qué etapa de socialización se ejemplifica?",
    options: [
      "Socialización primaria",
      "Socialización secundaria",
      "Resocialización",
    ],
    correctIndex: 0,
    explanation: "La socialización primaria se desarrolla en la infancia temprana mediante la familia y los primeros años de educación básica formativa.",
    section: "ciencias_sociales",
    subtopic: "Ciencias Sociales",
  },
  {
    q: "El proceso de socialización que ocurre en la educación superior, universidades y en el entorno laboral especializado se denomina:",
    options: [
      "Socialización primaria",
      "Socialización secundaria",
      "Resocialización",
    ],
    correctIndex: 1,
    explanation: "La socialización secundaria introduce al individuo ya socializado en nuevos sectores del mundo objetivo de su sociedad, roles profesionales y ambientes laborales.",
    section: "ciencias_sociales",
    subtopic: "Ciencias Sociales",
  },
];
