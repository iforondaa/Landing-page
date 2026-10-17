# Verificación final (Paso 6) — Landing de Publicaciones y Colaboradores

> **Fecha:** 2026-10-01 · **Versión verificada:** V1 (prototipo) · **Resultado:** ✅ Aprobada
> **Re-verificación:** 2026-10-05 tras los ajustes de la spec v1.2 (ver §6) · ✅ Aprobada
> Documentos de referencia: `landing-spec.md` (v1.1 + decisiones §7), `plan.md` (v1.8), `openapi.yaml`, `schemas/`.

## 1. Resumen de resultados

| Verificación | Herramienta | Resultado |
|---|---|---|
| Lint del contrato (`openapi.yaml`) | Spectral + 4 reglas propias | ✅ 0 errores, 0 advertencias |
| Sincronía contrato ↔ código | `npm run check:schemas` | ✅ sincronizado |
| Pruebas unitarias y de contrato | Vitest | ✅ 2,300 / 2,300 |
| Validador propio vs. referencia | Vitest + Ajv (prueba diferencial) | ✅ ~2,200 casos idénticos |
| Pruebas de aceptación (BDD) | Playwright, escritorio + móvil | ✅ 74 / 74 (37 × 2 dispositivos) |
| Accesibilidad | axe-core, WCAG 2.2 A/AA + buenas prácticas | ✅ 0 violaciones en 24 combinaciones (6 rutas × 4 anchos: 320, 375, 768, 1280 px) |
| Diseño adaptable | Playwright | ✅ sin desplazamiento horizontal en las 24 combinaciones |
| Errores en consola | Playwright | ✅ ninguno |
| Peticiones a servidores externos | Playwright | ✅ ninguna (el sitio es autocontenido) |
| HTML válido | html-validate | ✅ 0 problemas |
| Seguridad del DOM | revisión de código | ✅ sin `innerHTML`/`eval`; texto de usuario siempre como nodo de texto |
| CSV en hoja de cálculo | LibreOffice | ✅ acentos, comillas, comas y fórmula neutralizada correctos |
| Revisión independiente spec ↔ código | agente revisor sin participación en el desarrollo | ✅ todos los requisitos CUMPLEN tras correcciones (§4) |

**Cómo repetir la verificación:** `npm install` → `npm run verify` → `npx playwright install chromium` (una vez) → `npm run test:e2e`.

## 2. Trazabilidad requisito → implementación → prueba

| Requisito (spec) | Implementación | Prueba(s) |
|---|---|---|
| 2.1 Encabezado con marca, "Publicaciones" y "Quiero colaborar" | `src/index.html` | `acceptance.spec.js`: "Publicaciones" del encabezado…; "Quiero colaborar" del encabezado…; `exportar.spec.js`: la vista no aparece en el encabezado |
| 2.1 Hero con la publicación principal | `views/home.view.js`, `components/hero-publicacion.js` | `comentarios.spec.js`: al hacer clic en la publicación principal…; `contract.test.js`: semilla con exactamente una principal |
| 2.1 Formulario abajo, accesible por desplazamiento o clic | `views/home.view.js`, ruta `#/colaborar` | `acceptance.spec.js`: "Quiero colaborar" del encabezado lleva al formulario |
| 2.2 La nota se abre en vista dedicada | `views/publicacion.view.js` | `comentarios.spec.js`: Vista de lectura (3 pruebas) |
| 2.2 Nombre opcional → "Anónimo" | `localstorage.adapter.js`, `lib/normalizar.js` | **Escenario 2** (`comentarios.spec.js`); `contract.test.js`: Escenario BDD 2 |
| 2.2 Comentario obligatorio | esquema + `components/comentarios.js` | `comentarios.spec.js`: vacío o solo espacios; solo caracteres invisibles |
| 2.2 Publicación al instante | `components/comentarios.js` | **Escenario 2**; con nombre… persiste al recargar |
| 2.3 Campos obligatorios / opcionales y placeholders | `components/colaborar-form.js` (derivado del esquema) | `colaborar-form.test.js` (6 pruebas) |
| 2.3 El placeholder desaparece al foco | `css/components.css` (`:focus::placeholder`) | `acceptance.spec.js`: el texto de ejemplo desaparece al recibir foco |
| 3 Entidades `Colaborador`, `Comentario`, `Publicacion` | `spec/schemas/*.json`, adaptador | `contract.test.js` (todas las operaciones validan contra los esquemas con Ajv) |
| 3 Validación de formato de email | esquema `format: email` | `validator.test.js` (corpus); `acceptance.spec.js`: formatos inválidos… |
| **4 Escenario 1** — registro válido persiste y confirma | formulario + adaptador | `acceptance.spec.js`: Escenario 1; `contract.test.js`: Escenario BDD 1 |
| **4 Escenario 2** — comentario anónimo | comentarios + adaptador | `comentarios.spec.js`: Escenario 2; `contract.test.js`: Escenario BDD 2 |
| 5 Sin autenticación, sin CMS, sin pagos | — (fuera de alcance) | — |
| 6 Tarea 4 — persistencia simulada, consulta y exportación | `localstorage.adapter.js`, `views/exportar.view.js`, `lib/csv.js` | `contract.test.js`; `exportar.spec.js` (6); `csv.test.js` (11) |
| 7 Longitudes y formatos (nombre 2–120, email ≤254, teléfono, área ≤120, autor ≤120, contenido 1–2,000) | esquemas | `validator.test.js` (límites exactos 119/120/121, 2,000/2,001…); `acceptance.spec.js` y `comentarios.spec.js` (límites en pantalla, emojis) |
| 7 Cualquier dominio de correo | esquema | `contract.test.js`: acepta correos de cualquier dominio |
| 7 Correos repetidos permitidos | adaptador (sin unicidad) | `contract.test.js`: permite registrar el mismo correo más de una vez |
| 7 CSV UTF-8 con BOM, comas, CRLF, columnas del esquema, `colaboradores_AAAA-MM-DD.csv` | `lib/csv.js`, `views/exportar.view.js` | `csv.test.js`; `exportar.spec.js`: consulta… y descarga CSV con el contrato |
| plan 6.4 Protección contra inyección de fórmulas | `lib/csv.js` | `csv.test.js` (6 vectores); `exportar.spec.js` |

## 3. Robustez verificada (más allá de la especificación)

- LocalStorage bloqueado, lleno o con datos dañados: la nota se sigue leyendo, el formulario avisa y conserva lo escrito, nada se sobrescribe en silencio.
- Texto de usuario con `<script>`, `<img onerror>` o fórmulas de Excel: se muestra y exporta como texto.
- Nombres y palabras extremadamente largos, emojis, saltos de línea y caracteres invisibles.
- Navegación solo con teclado, foco gestionado al cambiar de vista, mensajes de error asociados a cada campo para lectores de pantalla.

## 4. Hallazgos de la revisión independiente y su resolución

| # | Hallazgo | Severidad | Resolución | Prueba de regresión |
|---|---|---|---|---|
| D1 | `maxlength` del navegador cuenta unidades UTF-16: un texto con emojis se cortaba a la mitad del límite del contrato | Baja-media | Se retiró `maxlength`; el límite se valida con el esquema y se avisa en vivo | `comentarios.spec.js` revisión D1; `acceptance.spec.js` 120 emojis |
| D2 | La inicial del avatar partía un emoji | Baja | Se toma el primer carácter Unicode completo | `comentarios.spec.js` revisión D2 |
| D3 | Inconsistencias de documentación (versión del plan, JSDoc, nombres de campos 2.2 vs 3, README) | Baja | Documentos corregidos | — |
| C1 | Un texto de solo caracteres invisibles pasaba la validación | Mejora | El recorte elimina invisibles en los extremos (plan 6.3) | `comentarios.spec.js` revisión C1; `contract.test.js`; `colaborar-form.test.js` |
| C2 | `aria-label` en un `<span>` genérico (no permitido por ARIA 1.2) | Mejora | Retirado; el encabezado se lee "Comentarios (n)" | axe |
| C3 | Una fecha dañada en LocalStorage tumbaba la vista de consulta | Mejora | Los formateadores de fecha toleran datos inválidos | `exportar.spec.js` revisión C3; `router.test.js` |
| C4 | Escuchadores de puntero acumulados al navegar solo con teclado | Mejora | Un solo rastreador a nivel de módulo | `acceptance.spec.js` regresión del clic en "Enviar" |

Defectos encontrados durante el desarrollo (pasos 1–5) y ya cubiertos por pruebas de regresión: validador aceptaba no-ASCII en URI; desbordamientos en 320 px (navegación, botón, nombre largo, tabla); ícono de error leído por lectores de pantalla; mensaje "mínimo 2 caracteres" en campo vacío; clic en "Enviar" perdido por desplazamiento del botón; correos/teléfonos partidos en la tabla.

## 5. Limitaciones conocidas (aceptadas para el prototipo)

1. **Persistencia local:** cada navegador guarda sus propios datos; el sitio no recolecta registros reales. *(Decisión: spec §7.)*
2. **Consulta sin protección:** `#/admin/exportar` es accesible por URL; no expone datos de terceros por la limitación anterior. *(Decisión 2026-10-01: spec §7.)*
3. **Contenido de ejemplo:** publicaciones, imagen de portada, logotipo y paleta son provisionales.
4. **Aviso de privacidad:** pendiente de validar con el área jurídica.
5. **Fechas del CSV** en ISO 8601 UTC (como se guardan); la tabla en pantalla usa hora de la Ciudad de México.
6. **Teléfono:** solo dígitos con guiones opcionales (no espacios ni paréntesis), según el contrato.

## 6. Re-verificación tras los ajustes v1.2 (2026-10-05)

| Verificación | Resultado |
|---|---|
| Lint del contrato (`openapi.yaml` 1.1.0) y sincronía de esquemas | ✅ |
| Pruebas unitarias y de contrato | ✅ 2,474 / 2,474 (el corpus diferencial creció con el campo nuevo) |
| Pruebas de aceptación (escritorio + móvil) | ✅ 84 / 84 |
| Accesibilidad (axe, 6 rutas × 4 anchos) y desbordamientos | ✅ 0 problemas |
| HTML válido | ✅ |

| Ajuste | Prueba(s) |
|---|---|
| 1. Texto de "Quiero colaborar" | `identidad.spec.js`: ajuste 1 |
| 2. Campo "Comentario o propuesta" | `acceptance.spec.js`: ajuste 2 (opcional, más alto, contador, se guarda); `contract.test.js`; `colaborar-form.test.js`; `exportar.spec.js` y `csv.test.js` (columna CSV) |
| 3. Teléfono con guiones en cualquier posición | `validator.test.js` (12 formatos); `acceptance.spec.js`: ajuste 3; `contract.test.js` |
| 4. Paleta rosa | `identidad.spec.js`: ajuste 4 (sin restos de guinda); contrastes en `tokens.css` |
| 5. Nombre y lema | `identidad.spec.js`: ajuste 5; `identidad.test.js` (anti-deriva con `index.html`) |

## 6.1 Re-verificación tras la v1.3 (2026-10-10): nota real y aviso de privacidad

| Verificación | Resultado |
|---|---|
| Lint del contrato (`openapi.yaml` 2.0.0) y sincronía de esquemas | ✅ |
| Pruebas unitarias y de contrato | ✅ 3,038 / 3,038 |
| Pruebas de aceptación (escritorio + móvil) | ✅ 112 / 112 |
| Accesibilidad (axe, 7 rutas × 4 anchos) y desbordamientos | ✅ 0 problemas |
| HTML válido | ✅ |

| Requisito v1.3 | Prueba(s) |
|---|---|
| Imagen de portada con texto alternativo | `nota.spec.js` |
| Carátula: 3 cifras, 4 gráficas, destacado y cita | `nota.spec.js`; `contract.test.js` (coherencia de gráficas) |
| Informe completo: 8 secciones, 8 gráficas, negritas, listas y 7 citas | `nota.spec.js`; `texto.test.js` |
| Aviso de privacidad (11 secciones, enlazado desde pie, formulario y comentarios) | `nota.spec.js`; `texto.test.js` |
| Consentimiento obligatorio y versión aceptada | `acceptance.spec.js`; `contract.test.js`; `validator.test.js`; `exportar.spec.js` (CSV de 9 columnas) |

**Defecto hallado y corregido:** la casilla del aviso heredaba `width: 100%` de los campos de texto y ensanchaba la página en móvil (469 px en una pantalla de 412 px). Las pruebas no lo detectaban porque en móvil `innerWidth` crece junto con la página; ahora comparan contra `clientWidth` y hay una prueba de regresión.

## 6.2 Re-verificación tras la v1.4 (2026-10-16)

| Verificación | Resultado |
|---|---|
| Lint del contrato y sincronía de esquemas | ✅ |
| Pruebas unitarias y de contrato | ✅ 2,795 / 2,795 (menos casos al retirar los campos del aviso del corpus diferencial) |
| Pruebas de aceptación (escritorio + móvil) | ✅ 104 / 104 |
| Accesibilidad (axe, 6 rutas × 4 anchos) y desbordamientos | ✅ 0 problemas |
| HTML válido | ✅ |

Pruebas nuevas o ajustadas: `nota.spec.js` (destacado «17 de 96», prioridad del Comité en %, pie con aclaración del SUNTB, sin casilla/enlaces/página del aviso), `identidad.spec.js` e `identidad.test.js` (El Banobrino).

## 7. Condiciones para producción (V2)

Backend con base de datos (sustituir el adaptador por uno HTTP con la misma interfaz), autenticación del lado del servidor para la consulta y la descarga, y aviso de privacidad con revisión legal (borrador en `spec/borradores/`). Al cambiar el contrato, aplicar oasdiff/Delimit para detectar cambios incompatibles (Fase 2 de la guía SDD).
