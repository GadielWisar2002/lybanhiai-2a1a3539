export interface PresetTopic {
  id: string;
  title: string;
  subject: string;
  category: string;
  icon: string;
  badge: string;
  summary: string;
  content: string;
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
  },
];
