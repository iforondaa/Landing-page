# El Banobrino — Landing de Publicaciones y Colaboradores

Proyecto desarrollado con la metodología **SDD (Especificación primero)**.
Todo cambio de requisitos se hace primero en `spec/` y después en el código.

## Documentos de especificación (`spec/`)

| Archivo | Rol |
|---|---|
| `landing-spec.md` | Qué se construye (Specify) |
| `plan.md` | Cómo se construye (Plan) |
| `openapi.yaml` | Contrato de operaciones de la capa de datos |
| `schemas/*.schema.json` | Modelos de datos y reglas de validación (JSON Schema 2020-12) |

## Ver el sitio

Los módulos de JavaScript no funcionan abriendo `index.html` con doble clic: se necesita un servidor local.

- `npm start` → abre http://localhost:5173 (no requiere `npm install`), o
- la extensión **Live Server** de VS Code sobre la carpeta `src/`.

## Comandos

Requiere Node.js 18 o superior y `npm install`.

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor local del sitio (`src/`) |
| `npm run lint:spec` | Revisa el contrato con Spectral |
| `npm run gen:schemas` | Copia `spec/schemas` al código (ejecutar tras cambiar un esquema) |
| `npm run check:schemas` | Falla si el código está desfasado respecto a `spec/schemas` |
| `npm test` | Pruebas unitarias y de contrato (validador, adaptador, formulario, router, CSV) |
| `npm run verify` | Todo lo anterior en orden |
| `npm run test:e2e` | Pruebas de aceptación en navegador (escenarios BDD). La primera vez: `npx playwright install chromium` |

**Flujo para cambiar una regla:** editar `spec/schemas/…` → `npm run gen:schemas` → `npm run verify`.

> La carpeta está en OneDrive: `node_modules/` puede pesar ~100 MB y OneDrive intentará sincronizarla.
> Si lo prefieres, ejecuta sin instalar: `npx @stoplight/spectral-cli@6.16.3 lint spec/openapi.yaml --ruleset .spectral.yaml`

## Pendientes de contenido

- **Nota «El Sindicato visto por su base»** (`src/js/data/seed/publicaciones.seed.js`): cifras definitivas cargadas (v1.4). Autor: Iván Foronda; publicación: 19 de octubre de 2026. Falta confirmar los títulos de las gráficas del informe.
- Nombre y lema definitivos: «El Banobrino» / «Acercando el Sindicato a las y los trabajadores». Si cambian, se editan **solo** en `src/js/identidad.js` (y su respaldo en `src/index.html`; una prueba avisa si no coinciden).
- Pulir la paleta rosa: se cambia **solo** en `src/css/tokens.css`.
- Logotipo (opcional), si se define uno.
- **Aviso de privacidad**: retirado del sitio por ahora (v1.4). El borrador está en `spec/borradores/aviso-privacidad.md`; antes de recabar datos reales conviene reactivarlo con revisión legal.

## Control de versiones y verificación automática

- El proyecto es un repositorio **Git** (rama `main`) alojado como repositorio **privado en GitHub**.
- En cada cambio que se sube, **GitHub Actions** corre la verificación completa (`.github/workflows/verificacion.yml`): contrato, sincronía de esquemas, pruebas unitarias y pruebas de aceptación. El resultado aparece en la pestaña **Actions** del repositorio (✅ o ❌).
- Flujo diario con **GitHub Desktop**: revisar cambios → escribir un resumen → **Commit to main** → **Push origin**.
- Para volver a una versión anterior (por ejemplo, un nombre o color previo): en GitHub Desktop, pestaña **History** → clic derecho sobre el cambio → **Revert changes in commit**.

## Antes de pasar a producción (V2)

Este sitio es un **prototipo**: los datos viven en el navegador de cada visitante (LocalStorage), por lo que no recolecta registros reales y la vista `#/admin/exportar` no está protegida. Para producción se requiere backend con base de datos, autenticación del lado del servidor para la consulta/descarga y aviso de privacidad con revisión legal. Ver `spec/plan.md` §8.

## Estado

- [x] Fase 0 — Contrato (schemas + OpenAPI + Spectral)
- [x] Paso 1 — Adaptador LocalStorage + validador (Tarea 4, motor)
- [x] Paso 2 — Header + hero (Tarea 1)
- [x] Paso 3 — Formulario "Quiero colaborar" (Tarea 3)
- [x] Paso 4 — Lectura + comentarios (Tarea 2)
- [x] Paso 5 — Consulta + descarga CSV (Tarea 4, exportación)

> La consulta de colaboradores está en `#/admin/exportar` (no aparece en el menú).
- [x] Paso 6 — Verificación final (ver `spec/verificacion.md`)
- [x] v1.3 — Primera nota real (carátula + informe) y aviso de privacidad
- [x] v1.4 — Cifras definitivas, sin aviso de privacidad, identidad «El Banobrino»
