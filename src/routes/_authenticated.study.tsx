import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/AppHeader";
import { useServerFn } from "@tanstack/react-start";
import { extractTextFromMedia } from "@/lib/quiz.functions";
import { SCHOOL_SUBJECTS } from "@/lib/school-subjects-data";
import {
  Award,
  GraduationCap,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  Upload,
  FileText,
  HelpCircle,
  Lightbulb,
  BookMarked,
  Layers,
  Globe,
  Brain,
  Calculator,
  ChevronRight,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Estudiar — Lybanhi" }] }),
  component: StudyHub,
});

// ==========================================
// GUÍAS DE ESTUDIO OFICIALES: PAA Y EXANI-II
// ==========================================
interface StudyGuideTopic {
  id: string;
  title: string;
  badge: string;
  summary: string;
  explanation: string;
  keyPoints: string[];
  tips?: string[];
  prepCategory: "paa" | "exani" | "toefl" | "cambridge";
}

const PAA_STUDY_GUIDES: StudyGuideTopic[] = [
  {
    id: "paa-lectura",
    title: "Lectura Crítica, Vocabulario en Contexto e Inferencias",
    badge: "College Board PAA",
    summary: "Aprende a deducir el significado contextual de palabras y extraer ideas implícitas.",
    explanation: `En la sección de Lectura de la PAA (College Board), no se evalúa la memorización de conceptos de diccionario, sino el uso contextual del lenguaje y la deducción de ideas implícitas.

1. Vocabulario en contexto:
Una palabra puede tener múltiples acepciones. Para determinar el significado exacto:
- Reemplaza mentalmente la palabra por las opciones sugeridas y verifica cuál mantiene el sentido exacto del párrafo.
- Por ejemplo, en "la bicicleta aún guardaba el color de su niñez", "guardaba" significa "conservar o mantener", no "esconder" ni "proteger de un peligro".

2. Ideas implícitas e inferencias:
- Las inferencias son conclusiones lógicas fundamentadas en el texto que el autor no dice de forma explícita pero que se desprenden directamente de lo narrado.
- Por ejemplo, la expresión "el tiempo se plegaba sobre sí mismo" sugiere que el pasado y el presente se mezclaban en la mente del personaje (nostalgia).`,
    keyPoints: [
      'Identifica primero qué tipo de ejercicio es antes de responder (vocabulario, tema central o inferencia).',
      'Descarta opciones literales extremas que no estén respaldadas por el texto.',
      'El tema central resume la totalidad del fragmento, no solo un detalle secundario.',
    ],
    tips: [
      'Subraya la palabra clave en el párrafo y lee dos líneas antes y dos después para captar el tono del autor.',
    ],
    prepCategory: "paa",
  },
  {
    id: "paa-literario",
    title: "Análisis Literario y Figuras Retóricas",
    badge: "College Board PAA",
    summary: "Reconocimiento de personificación, símil, hipérbole, metáfora y géneros literarios.",
    explanation: `El análisis literario en la PAA evalúa tu capacidad para identificar recursos poéticos y tipologías textuales en fragmentos en prosa o verso:

1. Figuras retóricas esenciales:
- Personificación (Prosopopeya): Atribución de cualidades o acciones humanas a objetos o seres inanimados (ej. "las olas mordían la orilla con furia").
- Símil o Comparación: Relación explícita de semejanza mediante nexos comparativos como "como", "parece", "cual" (ej. "sus ojos brillaban como dos linternas").
- Hipérbole: Exageración intencionada de la realidad para aumentar el impacto expresivo (ej. "te llamé un millón de veces").
- Metáfora: Identificación directa de un término real con uno imaginario sin usar nexos (ej. "las perlas de tu boca" = los dientes).

2. Géneros en prosa breve:
- Cuento: Narración breve de ficción con personajes, ambiente definido y un conflicto central que se resuelve.
- Ensayo: Texto reflexivo y argumentativo donde el autor expone su punto de vista crítico sobre un tema.`,
    keyPoints: [
      'Personificación = Acción humana en objetos inanimados (las olas muerden, el viento susurra).',
      'Símil = Comparación con nexo explícito ("como", "parecía").',
      'El cuento se diferencia del ensayo en que narra una historia con personajes y conflicto.',
    ],
    prepCategory: "paa",
  },
  {
    id: "paa-redaccion",
    title: "Redacción y Operaciones en Textos (Generalizar, Omitir, Adición)",
    badge: "College Board PAA",
    summary: "Dominio de operaciones textuales sobre segmentos numerados (1), (2), (3)...",
    explanation: `En la sección de Redacción de la PAA, se presentan segmentos con oraciones numeradas y se pide seleccionar la mejor operación de edición:

1. Operación de Generalización:
- Es el enunciado que engloba o sintetiza varios datos particulares expuestos en otras oraciones (ej. Si la oración (3) habla de robles y la (4) de rosas y tulipanes, la oración (2) "el parque tenía árboles y flores" generaliza ambas).

2. Operación de Omisión (Elisión):
- Solo se puede omitir una oración si es totalmente redundante o si repite información ya establecida sin aportar datos nuevos. Si una oración aporta un dato nuevo (un tipo de flor, una medida o un olor), no debe omitirse.

3. Operación de Adición (Lenguaje figurado):
- Consiste en insertar una comparación poética o recurso estético descriptivo (ej. "Las flores parecían un arcoíris caído del cielo").`,
    keyPoints: [
      'Generalizar = Enunciado sombrilla que reúne los detalles particulares.',
      'Omitir = Eliminar solo lo estrictamente redundante; si aporta un dato nuevo, no se elimina.',
      'Adición de lenguaje figurado = Enriquecer el texto con recursos poéticos o metafóricos.',
    ],
    prepCategory: "paa",
  },
  {
    id: "paa-matematicas",
    title: "Razonamiento Cuantitativo, Álgebra y Geometría PAA",
    badge: "College Board PAA",
    summary: "Fórmulas clave de porcentajes, desigualdades, móviles, perímetro y pendientes.",
    explanation: `El razonamiento cuantitativo de la PAA pone a prueba el planteamiento algebraico y la resolución rápida de problemas cotidianos:

1. Porcentajes y Descuentos:
- Si un artículo de $60 tiene 25% de descuento:
  Descuento = $60 × 0.25 = $15 → Precio final = $60 - $15 = $45 (o directamente $60 × 0.75 = $45).

2. Desigualdades Lineales:
- En $2x - 3 < 7$, suma 3 a ambos lados: $2x < 10$, luego divide entre 2: $x < 5$.

3. Problemas de Móviles en Sentidos Opuestos:
- Cuando dos móviles parten en direcciones opuestas, sus velocidades se suman para obtener la velocidad relativa de separación ($v_{\text{rel}} = v_1 + v_2$).
- Ejemplo: $80\text{ km/h} + 100\text{ km/h} = 180\text{ km/h}$. Para separarse $540\text{ km}$: Tiempo = $540 / 180 = 3\text{ horas}$.

4. Perímetro Algebraico de Rectángulos:
- Perímetro = $2(\text{ancho} + \text{largo})$. Si el ancho es $x$ y el largo $x + 4$, con perímetro de $40\text{ cm}$:
  $2(x + x + 4) = 40 \rightarrow 4x + 8 = 40 \rightarrow 4x = 32 \rightarrow x = 8\text{ cm}$.

5. Pendiente de la Recta:
- $m = \frac{y_2 - y_1}{x_2 - x_1}$. Para los puntos $(2, 3)$ y $(6, 11)$: $m = \frac{11 - 3}{6 - 2} = \frac{8}{4} = 2$.

6. Término Faltante en Promedios:
- Si el promedio de 4 números es 15, la suma total debe ser $4 × 15 = 60$. Si tres números son $10, 12, 18$ (suma = $40$), el cuarto número es $60 - 40 = 20$.

7. Probabilidad Clásica:
- $P = \frac{\text{casos favorables}}{\text{casos posibles}}$. Ases en baraja de 52 cartas: $4/52 = 1/13$.`,
    keyPoints: [
      'Velocidades opuestas se suman: v_rel = v1 + v2.',
      'Fórmula de pendiente: m = (y2 - y1) / (x2 - x1).',
      'Suma esperada en promedios = (Número de elementos) × (Promedio deseado).',
      'Probabilidad de un as en baraja inglesa = 4/52 = 1/13.',
    ],
    prepCategory: "paa",
  },
  {
    id: "paa-ingles",
    title: "Inglés PAA: Gramática, Concordancia y Lectura Breve",
    badge: "College Board PAA",
    summary: "Concordancia sujeto-verbo, oraciones negativas y combinación clara de ideas.",
    explanation: `En la sección de inglés de la PAA se evalúan estructuras gramaticales básicas y comprensión directa:

1. Concordancia Sujeto-Verbo en Presente Simple:
- En tercera persona singular (he, she, it / My brother): El verbo agrega -s o -es (ej. "My brother goes to the gym every morning").

2. Negación en Presente Simple:
- Se utiliza el auxiliar "doesn't" seguido de la forma base del verbo (infinitivo sin to): "She doesn't like coffee" (nunca "She don't" ni "She doesn't likes").

3. Combinación de Oraciones:
- Para unir oraciones cortas de manera fluida y concisa:
  "The coffee was hot." + "The coffee was strong." + "I drank it quickly."
  → "I drank the hot, strong coffee quickly."`,
    keyPoints: [
      'Tercera persona singular en presente simple añade -s / -es ("goes").',
      'Negación correcta: sujeto + doesn\'t + verbo base ("She doesn\'t like").',
      'Evita redundancias y fragmentos inconexos al combinar oraciones.',
    ],
    prepCategory: "paa",
  },
];

const EXANI_STUDY_GUIDES: StudyGuideTopic[] = [
  {
    id: "exani-comprension",
    title: "Comprensión Lectora EXANI-II (Ceneval 2025)",
    badge: "Ceneval EXANI-II",
    summary: "Los 3 niveles de lectura y los 3 ámbitos textuales evaluados en el examen oficial.",
    explanation: `La prueba de Comprensión Lectora del EXANI-II mide tres niveles progresivos de habilidad lectora:

1. Niveles de Procesamiento:
- Identificación de información: Localizar datos explícitos, fechas, personajes o hechos concretos en el texto.
- Interpretación: Deducir el sentido global, inferir la postura o tesis del autor y establecer relaciones causa-efecto.
- Evaluación de la forma y el contenido: Juzgar la pertinencia de los recursos estilísticos, justificar por qué el autor incluyó cierta información y valorar la solidez de los argumentos.

2. Tres Ámbitos Textuales Oficiales:
- Ámbito de Estudio: Artículos de divulgación científica, textos académicos y ensayos informativos.
- Ámbito Literario: Cuentos breves, poemas y crónicas narrativas.
- Ámbito de Participación Social: Editoriales periodísticos, cartas de opinión y discursos cívicos.`,
    keyPoints: [
      'Tres niveles: Identificación, Interpretación y Evaluación.',
      'Tres ámbitos: Estudio, Literario y Participación Social.',
      'Identificar la postura del autor corresponde al nivel de Interpretación.',
    ],
    prepCategory: "exani",
  },
  {
    id: "exani-redaccion",
    title: "Redacción Indirecta y Normativa DPD (Ceneval 2025)",
    badge: "Ceneval EXANI-II",
    summary: "Normas ortográficas, acentuación de diptongos y adecuación al registro formal.",
    explanation: `El área de Redacción Indirecta del EXANI-II evalúa la selección de fragmentos que cumplen con la normativa del Diccionario Panhispánico de Dudas (DPD, 2005):

1. Adecuación de Registro:
- En contextos académicos o formales, el empleo de expresiones coloquiales, modismos o frases vagas se clasifica como incorrecto por inadecuación de registro.

2. Acentuación en Diptongos:
- En diptongos conformados por vocal abierta tónica (a, e, o) + vocal cerrada átona (i, u), la tilde se coloca siempre sobre la vocal abierta (ej. "mesiánicas", "náutico").

3. Cohesión y Coherencia:
- Uso correcto de conectores lógicos de oposición (sin embargo, no obstante), causa (porque, puesto que) y consecuencia (por lo tanto, en consecuencia).`,
    keyPoints: [
      'Norma de referencia oficial: Diccionario Panhispánico de Dudas (DPD 2005).',
      'Diptongo vocal abierta tónica + cerrada átona: la tilde va en la vocal abierta.',
      'El registro debe coincidir con el nivel de formalidad exigido por el tipo de texto.',
    ],
    prepCategory: "exani",
  },
  {
    id: "exani-matematicas",
    title: "Pensamiento Matemático EXANI-II",
    badge: "Ceneval EXANI-II",
    summary: "Comprensión de lo matemático, jerarquía de operaciones y simplificación algebraica.",
    explanation: `Pensamiento Matemático del EXANI-II se divide en dos subáreas: Comprensión de lo matemático y Matematización.

1. Jerarquía con signos de agrupación:
- Se resuelven de adentro hacia afuera: paréntesis ( ), corchetes [ ] y llaves { }.
- Ejemplo: $-9\{9 - [(-8) \div (-4)] + 9 - 6\}$
  1° División: $(-8) \div (-4) = 2$.
  2° Dentro de la llave: $9 - 2 + 9 - 6 = 10$.
  3° Multiplicación final: $-9 \times 10 = -90$.

2. Simplificación de Polinomios:
- Dados $A = x - 3$, $B = 3x^3 - x^2$, $C = -4x^2 + 2x$:
  $B + 2C - A = (3x^3 - x^2) + 2(-4x^2 + 2x) - (x - 3)$
  $= 3x^3 - x^2 - 8x^2 + 4x - x + 3 = 3x^3 - 9x^2 + 3x + 3$.`,
    keyPoints: [
      'Dos subáreas: Comprensión de lo matemático y Matematización.',
      'Regla de signos: negativo entre negativo resulta en positivo.',
      'Cuidado al restar un polinomio: -(x - 3) cambia los signos a -x + 3.',
    ],
    prepCategory: "exani",
  },
  {
    id: "exani-salud-ciencias",
    title: "Módulos Específicos: Salud, Física, Química y Administración",
    badge: "Ceneval EXANI-II",
    summary: "Conceptos fundamentales para los módulos de carrera evaluados en EXANI-II.",
    explanation: `Resumen de conceptos clave evaluados en los módulos disciplinares del Ceneval:

1. Ciencias de la Salud y Premedicina:
- Triada ecológica: Agente (bacteria/virus causal), Huésped (persona susceptible) y Ambiente.
- Signos vitales normales: Temperatura corporal normotérmica ($36.5 - 37^\circ\text{C}$). Presión arterial normal $<120/80\text{ mmHg}$ ($140/95\text{ mmHg}$ se considera elevada/hipertensión).

2. Biología Celular:
- Respiración aerobia: Glucosa + O2 → $\text{ATP} + \text{CO}_2 + \text{H}_2\text{O}$.
- Fermentación alcohólica (anaerobia en hongos/levaduras): $\text{NADH y etanol} + \text{CO}_2$.
- Fotosíntesis: $\text{Luz} + \text{CO}_2 + \text{H}_2\text{O} \rightarrow \text{Oxígeno} (\text{O}_2) + \text{Glucosa}$.

3. Física (Ingenierías):
- Momento angular en rotación: $L = I\omega = mr^2\omega$.
- Si $m = 0.5\text{ kg}$, $r = 0.5\text{ m}$, $L = 1.25\text{ N}\cdot\text{m}\cdot\text{s} \rightarrow \omega = \frac{1.25}{0.5 \times (0.5)^2} = 10\text{ rad/s}$.

4. Química Inorgánica:
- Sustitución simple: $\text{A} + \text{BC} \rightarrow \text{AC} + \text{B}$ ($\text{Fe} + \text{CuSO}_4 \rightarrow \text{FeSO}_4 + \text{Cu}$).
- Análisis o descomposición: $\text{AB} \rightarrow \text{A} + \text{B}$.

5. Administración:
- Etapas del proceso administrativo: Planeación, Organización, Dirección y Control.
- Mercadotecnia: Encargada de promoción, distribución y comercialización.`,
    keyPoints: [
      'Triada ecológica: Agente, Huésped y Ambiente.',
      'Normotermia: 36.5 a 37 °C.',
      'Proceso administrativo: Planeación, Organización, Dirección y Control.',
      'Reacción de análisis/descomposición: AB → A + B.',
    ],
    prepCategory: "exani",
  },
];

function StudyHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getExtractTextFn = useServerFn(extractTextFromMedia);

  const [activeSection, setActiveSection] = useState<"admision" | "materias" | "custom">("admision");
  const [selectedExamType, setSelectedExamType] = useState<"paa" | "exani">("paa");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("matematicas");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom material state
  const [customText, setCustomText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTitle, setExtractedTitle] = useState("");
  const [extractedPoints, setExtractedPoints] = useState<string[]>([]);

  // Active study guide detail modal
  const [activeGuide, setActiveGuide] = useState<StudyGuideTopic | null>(null);
  const [activeSubjectTopic, setActiveSubjectTopic] = useState<{
    subjectName: string;
    subjectIcon: string;
    topicName: string;
    summary: string;
    explanation: string;
    keyPoints: string[];
    examples?: string[];
    subjectId: string;
  } | null>(null);

  // Filter study guides
  const currentExamGuides = selectedExamType === "paa" ? PAA_STUDY_GUIDES : EXANI_STUDY_GUIDES;
  const filteredExamGuides = currentExamGuides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.keyPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentSubject = SCHOOL_SUBJECTS.find((s) => s.id === selectedSubjectId) || SCHOOL_SUBJECTS[0];
  const filteredSubjectTopics = currentSubject.topics.filter(
    (tp) =>
      tp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tp.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tp.keyPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProcessCustomText = () => {
    if (!customText.trim()) {
      toast.error("Por favor escribe o sube algún material primero.");
      return;
    }
    const lines = customText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 10);
    const title = lines[0] || "Mi Tema de Estudio";
    const points = lines.slice(0, 5).map((l) => l.replace(/^[-*•\d.]+\s*/, ""));
    setExtractedTitle(title);
    setExtractedPoints(points.length > 0 ? points : [customText.slice(0, 100) + "..."]);
    toast.success("¡Material analizado con éxito! Revisa los puntos clave abajo.");
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-md px-5 pt-4 pb-24 space-y-6">
        {/* Encabezado Principal */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <BookMarked className="size-3.5" />
            <span>Centro de Estudio · Lo que debes saber</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Estudia antes de contestar 📖
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Revisa las explicaciones didácticas, fórmulas y conceptos clave de tus exámenes y materias antes de ponerte a prueba.
          </p>
        </div>

        {/* Selector de Pestañas Principales */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveSection("admision");
              setSearchQuery("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === "admision"
                ? "bg-card text-primary shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="size-3.5" />
            <span>Admisión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection("materias");
              setSearchQuery("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === "materias"
                ? "bg-card text-primary shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Materias</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection("custom");
              setSearchQuery("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === "custom"
                ? "bg-card text-primary shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Mi Material</span>
          </button>
        </div>

        {/* Buscador Rápido (si no está en custom) */}
        {activeSection !== "custom" && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSection === "admision"
                  ? "Buscar temas (ej. inferencias, pendientes, triada...)"
                  : "Buscar en esta materia..."
              }
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 1: GUÍAS DE EXÁMENES DE ADMISIÓN (PAA & EXANI-II) */}
        {/* ======================================================== */}
        {activeSection === "admision" && (
          <div className="space-y-4 animate-fade-in">
            {/* Selector PAA vs EXANI-II */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedExamType("paa")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedExamType === "paa"
                    ? "border-blue-500/50 bg-blue-500/10 text-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                  <Award className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-foreground">Examen PAA</span>
                  <span className="block text-[10px] text-muted-foreground">College Board</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedExamType("exani")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition cursor-pointer ${
                  selectedExamType === "exani"
                    ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-foreground">Examen EXANI-II</span>
                  <span className="block text-[10px] text-muted-foreground">Ceneval 2025</span>
                </div>
              </button>
            </div>

            {/* Banner Pedagógico */}
            <div className="p-3.5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-start gap-3">
              <Lightbulb className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-bold text-foreground">
                  Regla de oro: Estudia primero → Responde después
                </p>
                <p className="text-[11px] leading-relaxed">
                  Toca cualquier tema para leer la explicación completa y fórmulas clave. Cuando termines, podrás pasar directo a resolver el quiz.
                </p>
              </div>
            </div>

            {/* Lista de Guías de Estudio del Examen */}
            <div className="space-y-3">
              {filteredExamGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => setActiveGuide(guide)}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition cursor-pointer space-y-2.5 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {guide.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Leer guía <ChevronRight className="size-3.5" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {guide.keyPoints.slice(0, 2).map((kp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-muted text-muted-foreground flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-2.5 text-success" />
                        <span className="line-clamp-1">{kp}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 2: MATERIAS ESCOLARES (9 MATERIAS) */}
        {/* ======================================================== */}
        {activeSection === "materias" && (
          <div className="space-y-4 animate-fade-in">
            {/* Carrusel Horizontal de Materias */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {SCHOOL_SUBJECTS.map((sub) => {
                const on = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border shrink-0 transition cursor-pointer ${
                      on
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalle de la Materia Seleccionada */}
            <div className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentSubject.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{currentSubject.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{currentSubject.description}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {currentSubject.topics.length} temas
              </span>
            </div>

            {/* Lista de Temas con Explicación de la Materia */}
            <div className="space-y-3">
              {filteredSubjectTopics.map((tp) => (
                <div
                  key={tp.id}
                  onClick={() =>
                    setActiveSubjectTopic({
                      subjectName: currentSubject.name,
                      subjectIcon: currentSubject.icon,
                      topicName: tp.name,
                      summary: tp.summary,
                      explanation: tp.explanation,
                      keyPoints: tp.keyPoints,
                      examples: tp.examples,
                      subjectId: currentSubject.id,
                    })
                  }
                  className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition cursor-pointer space-y-2.5 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {tp.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Estudiar <ChevronRight className="size-3.5" />
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{tp.summary}</p>

                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {tp.keyPoints.slice(0, 2).map((kp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-muted text-muted-foreground flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-2.5 text-success" />
                        <span className="line-clamp-1">{kp}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 3: ESTUDIAR CON MI MATERIAL (CON IA) */}
        {/* ======================================================== */}
        {activeSection === "custom" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Sube tus apuntes o texto</h3>
                  <p className="text-[11px] text-muted-foreground">
                    La IA extraerá "Lo que debes saber" antes de que hagas el quiz.
                  </p>
                </div>
              </div>

              {/* Botón de Subir Archivo / Foto */}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 cursor-pointer transition">
                  <Upload className="size-4" />
                  <span>Subir PDF, Word o Foto</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsExtracting(true);
                      const toastId = toast.loading("Extrayendo texto con la IA de Gemini...");
                      try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          try {
                            const base64Data = (reader.result as string).split(",")[1];
                            const res = await getExtractTextFn({
                              data: {
                                fileBase64: base64Data,
                                mimeType: file.type || "application/octet-stream",
                                fileName: file.name,
                              },
                            });
                            if (res.text) {
                              setCustomText(res.text);
                              toast.success("¡Texto extraído con éxito!", { id: toastId });
                            }
                          } catch (err) {
                            toast.error("Error al extraer texto.", { id: toastId });
                          } finally {
                            setIsExtracting(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      } catch {
                        toast.error("Error al leer archivo.", { id: toastId });
                        setIsExtracting(false);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Área de Texto */}
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Pega aquí el texto de tus apuntes, resumen, capítulo de libro o temas a repasar..."
                className="h-32 w-full rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-primary focus:outline-none resize-none leading-relaxed"
              />

              <button
                type="button"
                onClick={handleProcessCustomText}
                disabled={isExtracting || !customText.trim()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="size-4" />
                <span>Analizar y Generar Ficha de Estudio</span>
              </button>
            </div>

            {/* Resultado de la Ficha de Estudio */}
            {extractedPoints.length > 0 && (
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    📌 Ficha de Estudio Generada
                  </span>
                  <span className="text-[10px] text-muted-foreground">Listo para repasar</span>
                </div>

                <h3 className="text-sm font-bold text-foreground">{extractedTitle}</h3>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Lo que debes saber antes del examen:
                  </span>
                  {extractedPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                      <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate({ to: "/prep" });
                  }}
                  className="w-full h-11 mt-2 rounded-xl bg-card border border-primary text-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition active:scale-95 cursor-pointer"
                >
                  <span>Ir a Prep y Responder Quiz sobre este Material</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DETALLADO DE GUÍA DE EXAMEN (PAA / EXANI-II) */}
      {/* ======================================================== */}
      {activeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setActiveGuide(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-xl sm:rounded-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeGuide.badge}
                </span>
                <h2 className="font-display text-lg font-bold text-foreground mt-1">
                  {activeGuide.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Contenido Explicativo */}
            <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  📌 Lo que debes saber antes del examen:
                </span>
                <div className="whitespace-pre-line text-muted-foreground">{activeGuide.explanation}</div>
              </div>

              {/* Puntos Clave */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Puntos esenciales que vienen en las preguntas:
                </span>
                <div className="space-y-1">
                  {activeGuide.keyPoints.map((kp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground bg-card p-2 rounded-xl border border-border">
                      <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                      <span>{kp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón de Acción Directo a Prep */}
            <button
              type="button"
              onClick={() => {
                setActiveGuide(null);
                navigate({ to: "/prep" });
              }}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>¡Ya lo estudié! Ir a contestar el Quiz en Prep</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLADO DE TEMA DE MATERIA ESCOLAR */}
      {/* ======================================================== */}
      {activeSubjectTopic && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setActiveSubjectTopic(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-xl sm:rounded-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1 w-fit">
                  <span>{activeSubjectTopic.subjectIcon}</span>
                  <span>{activeSubjectTopic.subjectName}</span>
                </span>
                <h2 className="font-display text-lg font-bold text-foreground mt-1">
                  {activeSubjectTopic.topicName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubjectTopic(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Contenido Explicativo */}
            <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  📌 Explicación del Tema:
                </span>
                <div className="whitespace-pre-line text-muted-foreground">{activeSubjectTopic.explanation}</div>
              </div>

              {/* Puntos Clave */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Conceptos que debes dominar:
                </span>
                <div className="space-y-1">
                  {activeSubjectTopic.keyPoints.map((kp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground bg-card p-2 rounded-xl border border-border">
                      <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                      <span>{kp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón de Acción Directo a Prep */}
            <button
              type="button"
              onClick={() => {
                setActiveSubjectTopic(null);
                navigate({ to: "/prep" });
              }}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>Comprobar lo que aprendí (Hacer Quiz en Prep)</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
