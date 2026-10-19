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
| `npm run test:integracion` | Pruebas contra Postgres + PostgREST locales (`bash scripts/supabase-local.sh iniciar` primero; ver el archivo) |
| `npm run test:e2e` | Pruebas de aceptación en navegador (escenarios BDD). Fuerzan el modo prototipo con `tests/helpers/test-local.js`, así nunca escriben en la base real. La primera vez: `npx playwright install chromium` |

**Flujo para cambiar una regla:** editar `spec/schemas/…` → `npm run gen:schemas` → `npm run verify`.

> La carpeta está en OneDrive: `node_modules/` puede pesar ~100 MB y OneDrive intentará sincronizarla.
> Si lo prefieres, ejecuta sin instalar: `npx @stoplight/spectral-cli@6.16.3 lint spec/openapi.yaml --ruleset .spectral.yaml`

## Pendientes de contenido

- **Nota «El Sindicato visto por su base»** (`src/js/data/seed/publicaciones.seed.js`): cifras definitivas cargadas (v1.4). Autor: Iván Foronda; publicación: 19 de octubre de 2026. Falta confirmar los títulos de las gráficas del informe.
- Nombre y lema definitivos: «El Banobrino» / «Acercando el Sindicato a las y los trabajadores». Si cambian, se editan **solo** en `src/js/identidad.js` (y su respaldo en `src/index.html`; una prueba avisa si no coinciden).
- Pulir la paleta rosa: se cambia **solo** en `src/css/tokens.css`.
- Logotipo (opcional), si se define uno.
- **Aviso de privacidad**: retirado por decisión del responsable (sitio interno). El borrador está en `spec/borradores/aviso-privacidad.md` por si se reactiva.

## Control de versiones y verificación automática

- El proyecto es un repositorio **Git** (rama `main`) alojado como repositorio **privado en GitHub**.
- En cada cambio que se sube, **GitHub Actions** corre la verificación completa (`.github/workflows/verificacion.yml`): contrato, sincronía de esquemas, pruebas unitarias y pruebas de aceptación. El resultado aparece en la pestaña **Actions** del repositorio (✅ o ❌).
- Flujo diario con **GitHub Desktop**: revisar cambios → escribir un resumen → **Commit to main** → **Push origin**.
- Para volver a una versión anterior (por ejemplo, un nombre o color previo): en GitHub Desktop, pestaña **History** → clic derecho sobre el cambio → **Revert changes in commit**.

## Publicar el sitio (V2: Supabase + Cloudflare Pages)

Mientras `src/js/config.js` esté vacío, el sitio funciona en **modo prototipo** (los datos se quedan en cada navegador). Para que los registros y comentarios sean reales, sigue estos pasos **una sola vez**. Los nombres de los botones pueden variar un poco según la versión de cada servicio.

### A. Supabase (base de datos)
1. Entra a **supabase.com** y crea una cuenta (puedes usar tu cuenta de GitHub).
2. **New project** → nombre `banobrino` → escribe una contraseña para la base de datos (guárdala en un lugar seguro; el sitio no la usa) → región **East US** → **Create new project**. Espera un par de minutos.
3. **SQL Editor** → **New query** → pega **todo** el contenido de `supabase/esquema.sql` → **Run**. Debe decir *Success*.
4. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up** (nadie más podrá crear cuentas).
5. **Authentication → Users → Add user → Create new user**: tu correo y una contraseña fuerte; marca **Auto Confirm User**.
6. De vuelta en **SQL Editor**, ejecuta (con tu correo):
   ```sql
   insert into public.administradores (user_id, nota)
   select id, 'Administración del sitio' from auth.users where email = 'tu-correo@ejemplo.com'
   on conflict do nothing;
   ```
   Debe decir *1 row*. Si dice *0 rows*, revisa que el correo sea idéntico al del paso 5.
7. **Project Settings → API Keys** (o **Data API**): copia la **Project URL** y la **Publishable key** (empieza con `sb_publishable_`; si tu proyecto muestra «anon public», usa esa).
8. Abre `src/js/config.js` (con VS Code o el Bloc de notas) y pega los dos valores entre las comillas. **Nunca** pegues la *secret key* ni la *service_role*.
9. En GitHub Desktop: **Commit to main** → **Push origin**.

### B. Cloudflare Pages (publicación)
1. Entra a **dash.cloudflare.com** y crea una cuenta.
2. **Workers & Pages → Create → Pages → Connect to Git** → autoriza GitHub **solo** para el repositorio `Landing-page`.
3. Configuración: *Production branch* `main` · *Framework preset* **None** · *Build command* **(vacío)** · *Build output directory* **`src`** → **Save and Deploy**.
4. Cloudflare te da una dirección `https://….pages.dev`. Esa es la que compartes. Cada vez que hagas **Push origin**, el sitio se actualiza solo en un minuto.

### C. Probar
1. Abre la dirección, regístrate en «Quiero colaborar» y deja un comentario en la nota.
2. Entra a `…pages.dev/#/admin`, inicia sesión con tu correo y contraseña: debes ver tu registro y tu comentario, y poder ocultarlo o borrarlo.
3. En Supabase → **Table Editor** también puedes ver las tablas `colaboradores` y `comentarios`.

### Mantenimiento
- El plan gratuito de Supabase se pausa tras una semana sin uso. GitHub Actions hace una consulta automática los lunes y jueves (`.github/workflows/mantener-activo.yml`). Si aun así se pausa, en Supabase pulsa **Restore project**.
- Para agregar a otra persona administradora: repite los pasos A5 y A6 con su correo.
- Si alguien abusa de los comentarios, ocúltalos o bórralos desde `#/admin`.

## Estado

- [x] Fase 0 — Contrato (schemas + OpenAPI + Spectral)
- [x] Paso 1 — Adaptador LocalStorage + validador (Tarea 4, motor)
- [x] Paso 2 — Header + hero (Tarea 1)
- [x] Paso 3 — Formulario "Quiero colaborar" (Tarea 3)
- [x] Paso 4 — Lectura + comentarios (Tarea 2)
- [x] Paso 5 — Consulta + descarga CSV (Tarea 4, exportación)

> La administración (registros y moderación de comentarios) está en `#/admin` (no aparece en el menú).
- [x] Paso 6 — Verificación final (ver `spec/verificacion.md`)
- [x] v1.3 — Primera nota real (carátula + informe) y aviso de privacidad
- [x] v1.4 — Cifras definitivas, sin aviso de privacidad, identidad «El Banobrino»
- [x] v2.0 — Supabase + Cloudflare Pages: registros y comentarios reales, administración con inicio de sesión y moderación
- [x] Cuentas de Supabase y Cloudflare creadas; `src/js/config.js` con los datos reales
- [ ] Prueba de humo en el sitio publicado y limpieza de los datos de prueba
