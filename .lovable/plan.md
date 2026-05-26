## Diagnóstico

1. **"No se genera"**: en realidad sí se genera (estás ahora en `/prep/quiz/616c...`), pero el botón "Generar quiz con IA" aparece muy abajo en la pantalla y obliga a hacer scroll, así que parece que no responde.
2. **"Muy abajo"**: el modal está anclado al borde inferior (`bottom-0`), pensado para móvil. En desktop (1021px) eso lo empuja muy abajo.
3. **"Historial de quizzes"**: la página `Biblioteca` está vacía, no muestra los quizzes generados.

## Cambios

### 1. `src/routes/_authenticated.prep.tsx` — Centrar el modal
- Cambiar el contenedor del sheet: en lugar de `absolute inset-x-0 bottom-0 ... rounded-t-3xl`, usar centrado vertical en pantallas medianas (`md:` centered dialog) y mantener el bottom sheet en móvil.
- Resultado: en desktop aparece como un diálogo centrado con el botón "Generar quiz con IA" siempre visible; en móvil sigue siendo un bottom sheet.

### 2. `src/lib/quiz.functions.ts` — Nuevo server fn `listMyQuizzes`
- Server fn protegido con `requireSupabaseAuth` que devuelve `{ id, category, topic, language, created_at, questions_count }` del usuario, ordenado por `created_at desc`, límite 50.

### 3. `src/routes/_authenticated.library.tsx` — Historial de quizzes
- Usar `useQuery` con `listMyQuizzes` para mostrar la lista.
- Cada item: icono de categoría, título (tema), categoría + idioma + nº preguntas + fecha relativa, y al hacer click navega a `/prep/quiz/$quizId` para volver a hacerlo.
- Estado vacío: mensaje actual.
- Loading: spinner.

### 4. `src/i18n/locales/{es,en,fr}.json`
- Añadir claves: `library.recentQuizzes`, `library.questions`, `library.retake`.

## Detalles técnicos

- No se requieren cambios de esquema: la tabla `quizzes` ya guarda `user_id`, `category`, `topic`, `language`, `questions`, `created_at` (RLS ya filtra por usuario en el server fn autenticado).
- El conteo de preguntas se calcula en el server con `jsonb_array_length(questions)` vía `select` raw, o más simple: traer `questions` y devolver `length` desde el handler (datos pequeños).
