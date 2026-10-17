# Plan Técnico (Plan Phase) — Landing Page de Publicaciones y Colaboradores Banobras

> **Versión:** 1.12 · **Fecha:** 2026-10-16 · **Estado:** V1 (prototipo) con la nota definitiva e identidad «El Banobrino» (spec v1.4) — ver `spec/verificacion.md`
> **Documentos relacionados:** `spec/landing-spec.md` (Specify) · `spec/openapi.yaml` (contrato) · `spec/schemas/` (esquemas)
> **Metodología de referencia:** Guía Maestra de Implementación — Desarrollo Basado en Especificaciones (SDD)

---

## 1. Principio rector

La especificación y el contrato técnico (`openapi.yaml` + JSON Schemas) son la **fuente única de verdad**. Ningún campo, validación u operación se implementa en código si antes no existe en el contrato. Cualquier cambio de requisitos se hace primero en `spec/` y después se propaga al código.

## 2. Aplicación del ciclo SDD a este proyecto

| Fase de la guía | Aplicación en V1 |
|---|---|
| **1. Diseño del contrato** | `openapi.yaml` (OpenAPI 3.1) + JSON Schemas (2020-12) de `Colaborador`, `Comentario` y `Publicacion`. |
| **2. Gobernanza** | Linting del contrato con **Spectral** (`.spectral.yaml`). oasdiff/Delimit se incorporan a partir de V2, cuando exista una versión previa contra la cual comparar. |
| **3. Simulación (Mock)** | El adaptador de LocalStorage actúa como servidor mock: expone las mismas operaciones y formas de datos del contrato y valida cada escritura contra los esquemas. |
| **4. Generación** | No se generan SDKs en V1. Se genera `src/js/contract/schemas.generated.js` desde `spec/schemas` (`npm run gen:schemas`) y una prueba falla si está desfasado. Los formularios derivan obligatoriedad, límites y placeholders del esquema. |
| **5. CI/CD** | **Activo (v1.10):** GitHub Actions (`.github/workflows/verificacion.yml`) ejecuta en cada cambio a `main` el lint del contrato, la sincronía de esquemas, las pruebas unitarias y las de aceptación (escritorio y móvil). Dependencias fijadas en `package-lock.json`. |

AsyncAPI no aplica: el sistema no tiene eventos ni mensajería.

**Desacoplamiento:** la UI invoca funciones nombradas igual que los `operationId` del contrato. Para migrar a un backend real en V2 solo se sustituye `localstorage.adapter.js` por un adaptador HTTP; las vistas no cambian.

## 3. Pila tecnológica

**HTML5 + CSS + JavaScript Vanilla (ES Modules), sin paso de build.**

Justificación: dos vistas y dos formularios no justifican el costo de React (build, dependencias, peso). Vanilla se despliega en cualquier hosting estático, incluido uno institucional.

| Capa | Elección |
|---|---|
| Marcado | HTML5 semántico (`header`, `main`, `article`, `form`, `label`) |
| Estilos | CSS con custom properties (tokens), mobile-first, sin frameworks |
| Lógica | JavaScript ES Modules (`<script type="module">`) |
| Enrutamiento | Hash routing: `#/` (inicio), `#/publicaciones` y `#/colaborar` (inicio + desplazamiento a la sección), `#/publicacion/:id` (lectura), `#/admin/exportar` (exportación, no enlazada en el header) |
| Identificadores | `crypto.randomUUID()` |
| Fechas | ISO 8601 (`date-time`) vía `new Date().toISOString()` |
| Validación | Validador ligero que lee la copia generada de los JSON Schemas (`schemas.generated.js`, sincronizada con `spec/schemas/` y verificada por prueba); sin reglas duplicadas a mano. Verificado contra Ajv. |
| Persistencia | LocalStorage detrás de una interfaz de repositorio |
| Dev tooling | Spectral (lint), Vitest (contrato/unitarias), Playwright (escenarios BDD) |

## 4. Estructura de archivos

```
Landing page/
├── spec/                             ← Fuente única de verdad
│   ├── landing-spec.md               (Specify, v1.4 con decisiones cerradas)
│   ├── plan.md                       (este documento)
│   ├── openapi.yaml                  (contrato de operaciones, 2.0.0)
│   ├── verificacion.md               (resultados de verificación)
│   ├── borradores/aviso-privacidad.md (en reserva; no se publica)
│   └── schemas/
│       ├── colaborador.schema.json
│       ├── comentario.schema.json
│       ├── colaborador.input.schema.json
│       ├── comentario.input.schema.json
│       ├── publicacion.schema.json
│       └── error.schema.json
├── src/
│   ├── index.html
│   ├── css/
│   │   ├── tokens.css                (colores, tipografía, espaciado)
│   │   ├── base.css
│   │   └── components.css
│   ├── js/
│   │   ├── main.js                   (arranque y tabla de rutas)
│   │   ├── identidad.js              (nombre y lema del sitio: único lugar para cambiarlos)
│   │   ├── router.js                 (hash routing)
│   │   ├── views/
│   │   │   ├── home.view.js          (hero + formulario de colaboración)
│   │   │   ├── publicacion.view.js   (lectura + comentarios)
│   │   │   ├── exportar.view.js      (consulta y descarga CSV)
│   │   │   └── estado.view.js        (error y página no encontrada)
│   │   ├── components/
│   │   │   ├── header.js
│   │   │   ├── hero-publicacion.js   (tarjeta principal + imagen con respaldo)
│   │   │   ├── caratula.js           (resumen "de un vistazo" de la nota)
│   │   │   ├── bloques.js            (secciones, párrafos, listas, citas del informe)
│   │   │   ├── grafica.js            (barras, barras agrupadas, apilada, dona)
│   │   │   ├── colaborar-form.js
│   │   │   └── comentarios.js
│   │   ├── contract/
│   │   │   └── schemas.generated.js  (GENERADO desde spec/schemas — no editar)
│   │   ├── data/
│   │   │   ├── api.js                (interfaz = operationIds del contrato)
│   │   │   ├── api-error.js          (errores 400/404/500 del contrato)
│   │   │   ├── localstorage.adapter.js
│   │   │   └── seed/publicaciones.seed.js
│   │   └── lib/
│   │       ├── dom.js                (creación segura de elementos, sin innerHTML)
│   │       ├── formato.js            (fecha, fecha y hora es-MX, párrafos)
│   │       ├── normalizar.js         (recorte y omisión de opcionales: compartido UI ↔ datos)
│   │       ├── texto.js              (negritas **…** sin innerHTML)
│   │       ├── validator.js          (valida contra spec/schemas)
│   │       └── csv.js                (serialización y descarga CSV)
│   └── assets/img/consulta-portada.svg (imagen de la nota)
├── scripts/
│   └── gen-schemas.mjs               (spec/schemas → schemas.generated.js)
├── tests/
│   ├── helpers/                      (Ajv de referencia, storage en memoria)
│   ├── validator.test.js             (validador propio vs Ajv)
│   ├── contract.test.js              (el adaptador cumple el contrato)
│   ├── colaborar-form.test.js        (el formulario se deriva del esquema)
│   ├── router.test.js
│   ├── identidad.test.js             (index.html coincide con identidad.js)
│   ├── acceptance.spec.js            (Escenario BDD 1: formulario de colaboración)
│   ├── comentarios.spec.js           (Escenario BDD 2: lectura y comentarios)
│   ├── csv.test.js                   (formato CSV, comillas, inyección de fórmulas)
│   ├── exportar.spec.js              (consulta y descarga CSV)
│   ├── identidad.spec.js             (nombre, lema, texto y paleta — ajustes v1.2)
│   ├── texto.test.js                 (negritas)
│   └── nota.spec.js                  (carátula, informe y gráficas — v1.3/v1.4)
├── .spectral.yaml
├── playwright.config.js              (escritorio + móvil)
├── vitest.config.js
├── package.json                      (solo devDependencies)
└── README.md
```

## 5. Contrato preliminar (`openapi.yaml`)

| operationId | Método / Ruta | Propósito |
|---|---|---|
| `listPublicaciones` | GET `/publicaciones` | Obtener la principal y futuras publicaciones |
| `getPublicacion` | GET `/publicaciones/{id}` | Vista de lectura |
| `listComentarios` | GET `/publicaciones/{id}/comentarios` | Comentarios al pie de la nota (orden cronológico) |
| `createComentario` | POST `/publicaciones/{id}/comentarios` | Autor vacío → "Anónimo" |
| `createColaborador` | POST `/colaboradores` | Formulario "Quiero colaborar" |
| `listColaboradores` | GET `/colaboradores` | Consulta y exportación CSV |

## 6. Decisiones que cierran los huecos de la especificación

### 6.1 Nueva entidad `Publicacion` (aprobado)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (uuid) | Requerido |
| `titulo` | string | Requerido, máx. 200 |
| `resumen` | string | Requerido, máx. 400 (se muestra en el hero) |
| `cuerpo` | string | Requerido (texto de la nota; párrafos separados por línea en blanco) |
| `autor` | string | Requerido, máx. 120 |
| `fecha_publicacion` | string (date-time) | Requerido |
| `imagen_url` | string (uri-reference) | Opcional |
| `es_principal` | boolean | Requerido; solo una publicación con `true` a la vez |

Las publicaciones se cargan desde `data/seed/publicaciones.seed.js` (módulo JS en lugar de JSON para no depender de import attributes; no hay CMS en V1).

### 6.2 Comportamiento del placeholder (aprobado)

- El texto de ejemplo desaparece **al recibir foco**, mediante `input:focus::placeholder { color: transparent; }`.
- Cada campo conserva una **etiqueta visible** (`<label>`); el placeholder nunca sustituye a la etiqueta (accesibilidad).
- Los campos obligatorios se marcan con `*` y `aria-required="true"`.

### 6.3 Longitudes y formatos (aprobado)

| Campo | Regla |
|---|---|
| `nombre_completo` | Requerido, 2–120 caracteres, sin espacios al inicio/fin |
| `email` | Requerido, formato email, máx. 254. **Se acepta cualquier dominio** |
| `telefono` | Opcional, 10 dígitos con guiones opcionales entre dígitos en cualquier posición: `^\d(?:-?\d){9}$` (ej. 5543650920, 55-4365-0920, 554-365-0920) — v1.2 |
| `comentario_propuesta` | Opcional, 1–2,000 caracteres; área de texto de 4 renglones con contador — v1.2 |
| `area_adscripcion` | Opcional, máx. 120 |
| `autor` (comentario) | Opcional, máx. 120; vacío o solo espacios → "Anónimo" |
| `contenido` (comentario) | Requerido, 1–2,000 caracteres (sin contar espacios al inicio/fin) |

Notas de implementación (verificación final):
- Las longitudes se cuentan en caracteres Unicode (un emoji = 1), como JSON Schema. Por eso los campos **no** usan el atributo HTML `maxlength` (que cuenta unidades UTF-16 y cortaría los emojis a la mitad del límite); el límite se valida con el esquema y se avisa en vivo.
- El recorte de extremos también elimina caracteres invisibles (espacio de ancho cero U+200B–U+200D, U+2060, BOM U+FEFF): un texto formado solo por ellos cuenta como vacío.

### 6.3.1 Registros repetidos (aprobado)

- Se **permite** registrar el mismo correo más de una vez. No hay restricción de unicidad en `email`; cada registro es independiente (`id` y `fecha_registro` propios) y todos se exportan.

### 6.4 Exportación (aprobado)

- Formato **CSV descargable**, codificación UTF-8 con BOM (para que Excel muestre bien acentos y ñ), separador coma, valores entrecomillados.
- Columnas en el orden del esquema: `id, nombre_completo, email, telefono, area_adscripcion, comentario_propuesta, fecha_registro` (la columna `comentario_propuesta` se añadió en v1.2).
- Nombre de archivo: `colaboradores_AAAA-MM-DD.csv`.
- Disponible en `#/admin/exportar` (vista con tabla de consulta + botón de descarga), no enlazada desde el header.
- Nota: con LocalStorage, los datos solo existen en el navegador donde se capturaron. La consolidación real requiere backend (V2). La vista lo advierte en pantalla.
- Seguridad: los valores que empiezan con `= + - @`, tabulador o retorno se anteponen con `'` para que Excel no los ejecute como fórmula (OWASP *CSV Injection*). Ejemplo: `=HYPERLINK(...)` se exporta como `'=HYPERLINK(...)`.
- Fechas en ISO 8601 UTC, tal como se guardan (contrato). La tabla en pantalla las muestra en hora de la Ciudad de México.

## 7. Orden de implementación

La Tarea 4 (persistencia) es dependencia de las Tareas 2 y 3, por lo que se adelanta.

| # | Paso | Tarea de la spec | Criterio de terminado |
|---|---|---|---|
| 0 | Contrato: schemas + `openapi.yaml` + lint Spectral | — | Spectral sin errores |
| 1 | Adaptador LocalStorage + validador | Tarea 4 (motor) | `contract.test.js` en verde |
| 2 | Header + hero con publicación principal | Tarea 1 | Render correcto en móvil y escritorio |
| 3 | Formulario "Quiero colaborar" | Tarea 3 | Escenario BDD 1 pasa |
| 4 | Vista de lectura + comentarios | Tarea 2 | Escenario BDD 2 pasa |
| 5 | Vista de consulta + descarga CSV | Tarea 4 (exportación) | CSV abre correctamente en Excel |
| 6 | Verificación final | — | Lint + pruebas de contrato + aceptación en verde |

## 8. Fuera de alcance en V1 (se mantienen los Non-Goals)

- Autenticación / inicio de sesión (la vista de exportación no está protegida).
  - **Condición para salir de prototipo (V2):** backend con base de datos (sustituir `localstorage.adapter.js` por un adaptador HTTP con la misma interfaz), autenticación del lado del servidor para `listColaboradores` y la descarga CSV, y aviso de privacidad con revisión legal (borrador en `spec/borradores/`). Una contraseña validada solo en el navegador no es aceptable.
- CMS externo o WordPress.
- Pagos o procesamiento financiero.
- Generación de SDKs, portales de documentación y servidores MCP (fases 4–5 completas de la guía).

## 9. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-09-30 | Plan inicial aprobado; se cierran los huecos 1–5 de la especificación. |
| 1.1 | 2026-09-30 | Fase 0 completada: 6 esquemas (3 entidades, 2 de entrada, 1 de error), `openapi.yaml` con 6 operaciones y respuestas 400/404/500, `.spectral.yaml` con 4 reglas propias. Lint sin errores. |
| 1.2 | 2026-09-30 | Paso 1 completado: validador propio (verificado contra Ajv con ~2,200 casos), adaptador LocalStorage con las 6 operaciones, generador anti-deriva de esquemas. Semilla pasa a `.seed.js`. 2,266 pruebas en verde. |
| 1.3 | 2026-09-30 | Decisión: se permiten correos repetidos en `Colaborador` (prueba de contrato añadida). |
| 1.4 | 2026-10-01 | Paso 2 completado: encabezado, publicación principal (tarjeta clicable completa), router por hash, vistas de error/404. Encabezado fijo solo desde 640 px. Paleta provisional en `tokens.css`. Verificado con Playwright (320–1280 px) y axe (0 violaciones WCAG 2.2 AA). |
| 1.5 | 2026-10-01 | Paso 3 completado: formulario "Quiero colaborar" derivado del esquema (obligatoriedad y `maxlength`), validación en vivo con los mismos mensajes que la capa de datos, confirmación en pantalla. Limpieza de entrada movida a `lib/normalizar.js`. Campo vacío obligatorio → "Este campo es obligatorio.". 22 pruebas de aceptación (escritorio y móvil) en verde, Escenario BDD 1 incluido. |
| 1.6 | 2026-10-01 | Paso 4 completado: vista de lectura (cabecera, imagen, párrafos) y comentarios (lista cronológica, conteo, nombre opcional → "Anónimo", contador de 2,000 caracteres, publicación al instante). Si los comentarios guardados están dañados, la nota se sigue leyendo. 50 pruebas de aceptación en verde (Escenarios BDD 1 y 2), axe sin violaciones. |
| 1.7 | 2026-10-01 | Paso 5 completado: vista `#/admin/exportar` con tabla (más reciente primero) y descarga `colaboradores_AAAA-MM-DD.csv` (UTF-8 con BOM, CRLF, columnas del esquema). Protección contra inyección de fórmulas. Verificado abriendo el CSV en LibreOffice. 60 pruebas de aceptación en verde. |
| 1.8 | 2026-10-01 | Paso 6 (verificación final): revisión independiente spec ↔ código; corregidos 3 defectos (límite UTF-16 vs Unicode, inicial de avatar con emoji, inconsistencias de documentación) y 4 mejoras (invisibles, `aria-label` en `span`, fecha dañada, escuchadores acumulados). Decisión: `#/admin/exportar` sin protección mientras sea prototipo. Resultado: 2,300 unitarias + 74 de aceptación en verde, 24 combinaciones ruta × ancho sin fallas de axe, HTML válido. |
| 1.9 | 2026-10-05 | Ajustes de la revisión del prototipo (spec v1.2 §7.1): texto de "Quiero colaborar"; campo opcional `comentario_propuesta` (contrato 1.1.0); teléfono con guiones en cualquier posición; paleta rosa; identidad centralizada en `identidad.js`. 2,474 unitarias + 84 de aceptación en verde; 24 combinaciones ruta × ancho sin fallas de axe. |
| 1.9.1 | 2026-10-05 | Identidad: "El pulso de la base sindicalizada de Banobras" (nombre en mayúsculas) con el lema "Información · diálogo · participación". Solo cambió `identidad.js`, su respaldo en `index.html` y el estilo de la marca. |
| 1.9.2 | 2026-10-05 | Identidad: nombre "Manos a la obra" (en mayúsculas, tamaño mayor por ser corto); se conserva el lema. |
| 1.10 | 2026-10-06 | Control de versiones: repositorio Git (rama `main`), `.gitattributes` (LF), `.gitignore`, `package-lock.json` y verificación automática en GitHub Actions (Fase 5 de la guía SDD). Repositorio privado en GitHub, publicado con GitHub Desktop. |
| 1.11 | 2026-10-10 | Primera nota real (spec v1.3 §7.2): carátula tomada del Resumen ejecutivo + Informe completo como bloques; 12 gráficas HTML/SVG con paleta validada para daltonismo; imagen de portada SVG con texto alternativo. Aviso de privacidad genérico (`#/aviso-de-privacidad`) y consentimiento expreso obligatorio en el registro (datos sensibles, LFPDPPP 2025). Contrato 2.0.0. Corregido: la casilla heredaba `width:100%` y ensanchaba la página en móvil; las pruebas de desbordamiento ahora usan `clientWidth`. 3,038 unitarias + 112 de aceptación en verde; 28 combinaciones ruta × ancho sin fallas. |
| 1.12 | 2026-10-16 | Spec v1.4 §7.3: cifras definitivas de la versión «revision_consistencia» (carátula e informe); se retira el aviso de privacidad (página, enlaces y casilla) y `Colaborador` vuelve a sus campos de la v1.2 (texto del aviso guardado como borrador); pie con aclaración sobre el SUNTB; identidad definitiva «El Banobrino» / «Acercando el Sindicato a las y los trabajadores»; carpeta «versión definitiva» en `.gitignore`. 2,795 unitarias + 104 de aceptación en verde; 24 combinaciones ruta × ancho sin fallas. |
