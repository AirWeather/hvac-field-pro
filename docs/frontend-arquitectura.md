# Arquitectura del Frontend

## Capas (de abajo hacia arriba)

1. **config.js**       → constantes, sin dependencias.
2. **storage.js**      → abstracción de localStorage.
3. **api.js**          → única capa con `fetch` hacia Apps Script.
4. **auth.js / asistencias.js / evidencias.js** → reglas de negocio.
5. **ui.js / router.js** → presentación y navegación.
6. **app.js**          → bootstrap, wiring de eventos.

## Reglas

- La UI nunca llama a `fetch` directamente.
- El dominio nunca toca el DOM.
- El router solo conoce hashes y handlers.
- `app.js` es el único que conecta eventos con dominio y UI.

## Flujo típico (check-in)

[button] → app.js handler → Asistencias.registrarEntrada()
        → Api.checkIn() → fetch → Apps Script
        → respuesta → UI.setText()
