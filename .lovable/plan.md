## Diagnóstico

Cuando das clic en un botón de "Generar Quiz":

1. La mutación arranca y se muestra el overlay "Generando con IA…".
2. **Inmediatamente** `useAuth` recibe un evento de `onAuthStateChange` (Supabase dispara `INITIAL_SESSION` al montar y `TOKEN_REFRESHED` periódicamente).
3. Dentro de ese listener llamamos `router.invalidate()` **y** `qc.invalidateQueries()` (invalida TODAS las queries).
4. Eso re-renderiza el layout, vuelve a montar la página de Prep, y **aborta el fetch a `generateQuiz` antes de que termine** → el overlay desaparece y no pasa nada.

Pruebas:
- La network log muestra muchísimas llamadas a `getDashboard` y a `user_profile_data` en pocos segundos (loop de invalidación), y **cero** llamadas a `/_serverFn/...generateQuiz_...`.
- El runtime error "Maximum update depth exceeded" viene del mismo loop (`onAuthStateChange` → `router.invalidate` → render → estado → otra invalidación).

## Cambios

### 1. `src/hooks/use-auth.tsx` (raíz del problema)

- Solo invalidar cuando realmente cambia la sesión (`SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`). Ignorar `INITIAL_SESSION` y `TOKEN_REFRESHED`.
- Quitar `qc.invalidateQueries()` global (es agresivo y mata cualquier mutation/fetch en curso). El guard del onboarding ya invalida su propia query cuando hace falta.
- Mantener `router.invalidate()` solo en sign-in/sign-out reales.
- Comparar el `access_token` previo con el nuevo para no reaccionar a refrescos que mantienen el mismo usuario.

### 2. `src/routes/_authenticated.prep.tsx` (mejora menor)

- Si la mutación falla, el toast ya se muestra; añadir `console.error` para diagnóstico futuro.
- Sin más cambios estructurales — al desaparecer el loop, los botones funcionan.

## Lo que NO se toca

- `src/lib/quiz.functions.ts` — el server function está correcto (Lovable AI Gateway con `google/gemini-2.5-flash` + tool-calling + fallback a JSON).
- La UI del onboarding ni del dashboard.

## Verificación

1. Recargar `/prep`, dar clic a "Lógica" (o cualquier categoría).
2. Network debe mostrar **una** llamada POST a `/_serverFn/...generateQuiz...` que dura unos segundos.
3. Al terminar, navega a `/prep/quiz/<id>` y se ve el quiz.
4. El error "Maximum update depth exceeded" desaparece de la consola.