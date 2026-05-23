
# Lybanhi — Plan de la v1

App mobile-first para ayudar a adolescentes a descubrir qué estudiar, recomendar carreras y universidades según su perfil y presupuesto, y prepararlos para exámenes de admisión y de inglés (TOEFL / Cambridge). Diseño blanco con azul y dorado, inspirado en los mockups subidos.

## Stack
- TanStack Start + Tailwind + shadcn (ya configurado).
- Lovable Cloud (auth email/Google + base de datos + RLS).
- Lovable AI Gateway (Gemini) para recomendaciones de carreras y generación de quizzes.
- i18n con `i18next` + `react-i18next` (ES / EN / FR).

## Identidad visual
- Paleta: blanco `#FFFFFF`, azul primario `#1E40AF`, dorado `#D4AF37`, gris neutro para texto.
- Tipografía: Inter (cuerpo) + Sora (titulares).
- Componentes con bordes redondeados (rounded-2xl), cards limpias, layout mobile con bottom nav fijo.
- Icono de racha: birrete azul con detalle dorado (se genera como asset SVG/PNG y se usa en header + dashboard).

## Estructura de rutas
```
/                       → Landing + selector de idioma
/login, /signup         → Auth (email + Google)
/onboarding             → Formulario multi-paso (hobbies, habilidades, intereses,
                          materias favoritas, presupuesto, ubicación preferida)
/_authenticated/
  dashboard             → Home: saludo, racha (birrete), próximo desafío, progreso
  recommendations       → Carreras sugeridas por IA + universidades por presupuesto
  recommendations/$id   → Detalle de carrera (por qué encaja, plan de estudio)
  prep                  → Hub de preparación
  prep/career/$id       → Quizzes por materia de la carrera elegida
  prep/english          → TOEFL / Cambridge (listening, reading, grammar, vocab)
  prep/quiz/$quizId     → Quiz player (estilo screen 5)
  library               → Recursos guardados
  profile               → Perfil, idioma, racha, logros
```

## Modelo de datos (Lovable Cloud)
- `profiles` — id (fk auth.users), full_name, avatar_url, language, created_at.
- `user_profile_data` — user_id, hobbies[], skills[], interests (text), favorite_subjects (jsonb con rating), budget_monthly, country, updated_at.
- `recommendations` — id, user_id, career_name, match_score, reasoning, tags[], universities (jsonb), created_at.
- `quizzes` — id, category ('career'|'toefl'|'cambridge'), topic, language, questions (jsonb).
- `quiz_attempts` — id, user_id, quiz_id, score, total, answers (jsonb), completed_at.
- `streaks` — user_id (pk), current_streak, longest_streak, last_active_date, total_xp.
- `daily_challenges` — id, date, title, description, quiz_id, xp_reward.

RLS: cada tabla con políticas `auth.uid() = user_id` (select/insert/update propios). `quizzes` y `daily_challenges` lectura pública autenticada.

## Server functions (createServerFn)
- `saveOnboarding` — guarda `user_profile_data`.
- `generateRecommendations` — llama a Lovable AI con el perfil → devuelve 5-8 carreras con match %, razonamiento y 3 universidades dentro del presupuesto; persiste en `recommendations`.
- `generateQuiz` — genera quiz por materia/carrera o por sección TOEFL/Cambridge con tool-calling (JSON estructurado).
- `submitQuizAttempt` — guarda intento, actualiza XP y racha (incrementa si `last_active_date` = ayer, resetea si no).
- `getDashboard` — devuelve racha, próximo desafío, progreso por materia, top carreras.

## Pantallas clave
1. **Selector de idioma** (primer arranque) — 3 tarjetas ES/EN/FR.
2. **Onboarding** (3 pasos, estilo screen 2/4):
   - Habilidades (chips multi-select) + intereses (textarea).
   - Materias favoritas (rating 1-5 estrellas).
   - Presupuesto + país + tipo de universidad (pública/privada/online).
3. **Dashboard** (estilo screen / screen-3):
   - Saludo + racha con icono birrete azul/dorado y contador de días.
   - Card "Próximo desafío" (CTA Empezar ahora).
   - Progreso por materia (barras).
   - Carreras recomendadas (carrusel con % match).
4. **Recomendaciones** — lista de carreras con tags y universidades filtradas por presupuesto.
5. **Prep hub** (estilo screen_3) — categorías: Carrera, TOEFL, Cambridge, Lógica, Matemáticas, Lenguaje.
6. **Quiz player** (estilo screen 5) — barra de progreso, pregunta, opciones con iconos, botones Anterior / Siguiente, resultado final con XP y suma a racha.
7. **Profile** — datos, idioma, racha histórica, logros.

## i18n
- `src/i18n/` con `en.json`, `es.json`, `fr.json`.
- Idioma se guarda en `profiles.language` y en `localStorage` para invitados.
- Todos los textos de UI vienen de claves de traducción; los contenidos de IA se generan en el idioma del usuario (se pasa al prompt).

## Lógica de racha
- Al completar un quiz o el desafío diario: si `last_active_date == hoy` no cambia, si `== ayer` suma 1, si no resetea a 1.
- Birrete se muestra siempre; el número de días se anima al subir.
- Desafío diario rotatorio generado al primer login del día.

## Detalles técnicos
- Auth: email/password + Google (vía broker Lovable). `_authenticated` layout protege rutas internas.
- Quizzes generados por IA con tool-calling para JSON estricto `{ questions: [{ q, options[], correctIndex, explanation }] }`.
- Recomendaciones cacheadas en DB; botón "Regenerar" si el usuario actualiza su perfil.
- Bottom nav (Dashboard / Library / Prep / Profile) presente en todas las rutas autenticadas.
- SEO: meta tags por ruta, `lang` dinámico en `<html>`.

## Fuera de alcance v1 (para siguientes iteraciones)
- Grupos de estudio / leaderboard social.
- Mentores con IA en chat (placeholder de CTA por ahora).
- Pagos / planes premium.

¿Procedo a implementar este plan?
