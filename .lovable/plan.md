El sheet del formulario en `/prep` se extiende bajo la barra de navegación inferior, por lo que el botón "Generar quiz con IA" queda oculto y solo se ve haciendo scroll dentro de la página, no del modal.

## Cambio

En `src/routes/_authenticated.prep.tsx`, ajustar el contenedor del sheet:

- Limitar su alto a `max-h-[85vh]` (o `calc(100vh - 5rem)`) y dejar el contenido scrollable internamente con `overflow-y-auto`.
- Padding inferior generoso (`pb-24`) para que el botón nunca quede tapado por la `BottomNav` (h-20).
- El botón "Generar quiz con IA" queda dentro del área scrollable (no flotante), pero siempre alcanzable.
- Ocultar la `BottomNav` mientras el sheet está abierto no es necesario; basta con que el sheet se sitúe por encima (`z-50`) y deje espacio inferior.

No se tocan datos, servidor ni traducciones.
