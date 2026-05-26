## Diagnóstico

El archivo `src/routes/_authenticated.prep.tsx` es el **layout padre** de `src/routes/_authenticated.prep.quiz.$quizId.tsx` (por la convención de nombres con puntos de TanStack Router: `prep.quiz.$quizId` = hijo de `prep`).

`prep.tsx` **no renderiza `<Outlet />`**, así que cuando navegas a `/prep/quiz/<id>` desde la biblioteca, la ruta hija sí matchea pero no tiene dónde renderizar — solo se ve la página de Prep otra vez, lo que parece "me regresa".

## Cambio

Renombrar el archivo del quiz para que **no** sea hijo de `prep` (usando el sufijo `_` que rompe el anidamiento en TanStack):

- `src/routes/_authenticated.prep.quiz.$quizId.tsx` → `src/routes/_authenticated.prep_.quiz.$quizId.tsx`

El `prep_` (con guion bajo al final) le dice a TanStack: "la URL sigue siendo `/prep/quiz/$quizId` pero NO uses `prep.tsx` como layout padre". Así la página del quiz toma toda la pantalla como ya lo hace en su JSX.

No se requieren cambios en el código del componente, ni en `library.tsx`, ni en `quiz.functions.ts`. El `Link` desde la biblioteca seguirá apuntando a `/prep/quiz/$quizId` (la URL no cambia, solo la jerarquía de layouts).

## Detalles técnicos

- TanStack regenerará `src/routeTree.gen.ts` automáticamente.
- El botón X dentro del quiz (`navigate({ to: "/prep" })`) sigue funcionando igual.
- No toca base de datos ni server functions.
