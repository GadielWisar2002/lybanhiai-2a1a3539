# Mejorar pantalla de resultados del quiz

Cuando termines un quiz, además del puntaje verás:
1. **Botón "Ver respuestas"** que muestra cada pregunta con tu respuesta, marcando ✅ correcta o ❌ incorrecta, y en las incorrectas resalta cuál era la respuesta correcta + la explicación.
2. **Botón "Repasar las falladas"** que genera un nuevo quiz con la IA usando los mismos temas/conceptos de las preguntas que fallaste, pero con números/palabras/ejemplos diferentes (mismo nivel de dificultad).
3. Se mantiene el botón actual de "Volver" a /prep.

## Cambios técnicos

**`src/lib/quiz.functions.ts`**
- Nueva server fn `regenerateFromWrong({ quizId, wrongIndexes })`:
  - Carga el quiz original (categoría, tema, idioma, preguntas falladas).
  - Llama al AI gateway con un prompt que pide N preguntas nuevas equivalentes a las falladas (mismos conceptos, distintos números/palabras/contexto, misma dificultad, 4 opciones, 1 correcta).
  - Inserta un nuevo registro en `quizzes` con `topic` = `"Repaso: <topic original>"` y devuelve `{ quizId }`.
  - Reutiliza el mismo esquema de tool-calling que `generateQuiz`.

**`src/routes/_authenticated.prep_.quiz.$quizId.tsx`**
- En el estado `done`, añadir:
  - Vista colapsable "Ver respuestas": lista de preguntas con badge correcta/incorrecta, opciones (resaltando la elegida y la correcta), y `explanation` debajo.
  - Botón "Repasar las falladas" (solo si hay al menos 1 fallada): llama `regenerateFromWrong` y navega al nuevo `quizId` cuando responde; muestra spinner mientras carga.
  - Botón "Volver" se mantiene.
- Guardar `answers` en el estado `done` para poder mostrar la revisión.

**i18n (`es.json`, `en.json`, `fr.json`)**
- Nuevas claves: `quiz.viewAnswers`, `quiz.hideAnswers`, `quiz.retryWrong`, `quiz.correctAnswer`, `quiz.yourAnswer`, `quiz.explanation`, `quiz.allCorrect`, `quiz.generatingRetry`.

## No requiere

- Cambios de base de datos (se reutiliza la tabla `quizzes`).
- Cambios de auth/RLS.
- Cambios en la biblioteca (el quiz de repaso aparecerá automáticamente en el historial).
