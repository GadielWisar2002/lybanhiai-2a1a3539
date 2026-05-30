# Arreglar error al generar quiz de repaso

## Problema

Cuando picas "Repasar las falladas", se genera un nuevo quiz y se navega a `/prep/quiz/<nuevoId>`. Pero como es la misma ruta (`_authenticated.prep_.quiz.$quizId`), React **no desmonta** el componente — solo cambia el param. Resultado:

- `done` (estado con las respuestas del quiz anterior) **se queda activo**.
- Se carga el nuevo `quiz` con distinta cantidad/orden de preguntas.
- Al renderizar la revisión, `done.answers` tiene N items del quiz viejo, pero `questions[idx]` del quiz nuevo puede ser `undefined` → `Cannot read properties of undefined (reading 'correctIndex')`.

## Solución

En `src/routes/_authenticated.prep_.quiz.$quizId.tsx`: reiniciar todos los estados locales (`i`, `answers`, `done`, `showReview`, `retrying`) cada vez que cambia `quizId`. Se hace con un `useEffect` que depende de `quizId` y limpia el estado, así el nuevo quiz arranca desde la pregunta 1 sin restos del anterior.

No requiere cambios en backend, base de datos, ni en `regenerateFromWrong`. Solo una corrección de estado en el cliente.
