## Objetivo

Cuando el usuario toque una categoría en **/prep** (Lógica, Matemáticas, TOEFL, etc.), en lugar de generar el quiz inmediatamente, se abrirá un formulario con:

- **Nivel escolar** (select): 3º secundaria, 1º preparatoria, 2º preparatoria, 3º preparatoria
- **Número de preguntas** (select): 3, 5, 8, 10
- **Tema** (chips, elige uno): lista de temas dependiente de la categoría (p. ej. Matemáticas → Números reales, Polinomios, Factorización, Ecuaciones cuadráticas, Funciones lineales, Razones y proporciones, Trigonometría básica, Probabilidad)
- Botón **"Generar quiz con IA"**

Al confirmar, se llama a `generateQuiz` con los datos elegidos y se navega al quiz.

## Cambios

### 1. `src/lib/quiz.functions.ts`
- Extender `GenSchema` con dos campos opcionales:
  - `level` (string, máx 60) — para inyectarlo al prompt
  - `count` (int 3–10, default 8) — sustituye el "8" hardcodeado en el system prompt
- El handler usa `data.count` y `data.level` al construir `sys`/`userMsg`. El resto (tool-calling, inserción a `quizzes`) queda igual. No se requiere migración de DB.

### 2. `src/routes/_authenticated.prep.tsx`
- Mantener la grid de 6 categorías, pero al hacer click ya no se llama a la mutación: se abre un **Dialog/sheet** (componente `Dialog` de shadcn ya disponible) con el formulario.
- Estado local: `openCat` con la categoría seleccionada; `level`, `count`, `topic`.
- Mapa local `TOPICS_BY_CATEGORY` con los temas por categoría (en es/en/fr vía i18n).
- Botón "Generar quiz con IA" dispara la mutación existente con `{ category, topic, language, level, count }`. El overlay de carga y navegación al quiz se conservan.

### 3. `src/i18n/locales/{es,en,fr}.json`
- Añadir bloque `prep.form` con: `level`, `questions`, `topic`, `generate`, opciones de nivel (`gr9`, `prep1`, `prep2`, `prep3`), y listas de temas por categoría.

## Fuera de alcance
- No cambia DB ni RLS.
- No cambia el componente del quiz en sí (`_authenticated.prep.quiz.$quizId.tsx`).
- No cambia el flujo de onboarding ni autenticación.
