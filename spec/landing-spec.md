# Especificación de Producto: «Manos a la obra» — Landing de Publicaciones y Colaboradores (base sindicalizada de Banobras)

> **Versión:** 1.2 · **Fecha:** 2026-10-05 · Ver decisiones en la sección 7 (ajustes de la v1.2 en §7.1) y el plan técnico en `spec/plan.md`.

## 1. Visión General y Alcance (Specify)
Desarrollo de un sitio web de una sola página (Landing Page) enfocado en la lectura de publicaciones y en el registro de colaboradores, dirigido a las trabajadoras y los trabajadores sindicalizados de Banobras.

## 2. Requisitos Funcionales y Experiencia de Usuario
### 2.1 Navegación y Estructura Principal
- **Barra Superior (Header)**: Contendrá la marca y dos accesos directos: "Publicaciones" y "Quiero colaborar".
  - Marca *(provisional, v1.2.2)*: nombre **"MANOS A LA OBRA"** (se muestra en mayúsculas) y, debajo, el lema **"Información · diálogo · participación"**.
- **Sección Superior (Hero)**: Muestra la **Publicación Principal** activa.
- **Sección Inferior**: Formulario de captura para colaboradores (accesible mediante scroll o haciendo clic en "Quiero colaborar").
  - Texto introductorio *(v1.2)*: "Si tienes un comentario, propuesta o te interesa participar en iniciativas a favor de la base trabajadora, déjanos tus datos y nos pondremos en contacto contigo."

### 2.2 Lectura de Publicaciones y Comentarios
- Al hacer clic en la publicación principal (o futuras publicaciones), la nota se abrirá en una vista dedicada para su lectura.
- Al final de la nota, se incluye un formulario de comentarios:
  - `nombre_autor`: Campo de texto opcional (si se omite, se asigna automáticamente "Anónimo").
  - `texto_comentario`: Campo de texto obligatorio.
  - Botón de envío que publica el comentario al instante.

### 2.3 Formulario "Quiero Colaborar"
- **Campos obligatorios**:
  - `nombre_completo` (Placeholder explicativo: "ej. Antonio Machado Ruiz")
  - `email` (Placeholder explicativo: "ejemplo@banobras.gob.mx")
- **Campos opcionales**:
  - `telefono` (Placeholder explicativo: "ej. 554-365-0920")
  - `area_adscripcion` (Placeholder explicativo: "ej. Dirección de Crédito")
  - `comentario_propuesta` *(v1.2)* — etiqueta "Comentario o propuesta": área de texto más alta que los demás campos (≈4 renglones, ampliable), con contador de caracteres. Placeholder: "ej. Me gustaría proponer pláticas sobre prestaciones laborales."
- **Comportamiento del Placeholder**: El texto de ejemplo desaparece al hacer clic/foco en la casilla.

## 3. Esquema de Datos y Contrato de Persistencia
- **Entidad `Colaborador`**:
  - `id`: String / UUID (Requerido)
  - `nombre_completo`: String (Requerido)
  - `email`: String (Requerido, validación de formato email)
  - `telefono`: String (Opcional)
  - `area_adscripcion`: String (Opcional)
  - `comentario_propuesta`: Text (Opcional, 1–2,000 caracteres) *(v1.2)*
  - `fecha_registro`: Timestamp (Requerido)

- **Entidad `Publicacion`** *(añadida en v1.1)*:
  - `id`: String / UUID (Requerido)
  - `titulo`: String (Requerido, máx. 200)
  - `resumen`: String (Requerido, máx. 400)
  - `cuerpo`: Text (Requerido)
  - `autor`: String (Requerido, máx. 120)
  - `fecha_publicacion`: Timestamp (Requerido)
  - `imagen_url`: String / URI (Opcional)
  - `es_principal`: Boolean (Requerido; solo una a la vez)

- **Entidad `Comentario`**:
  - `id`: String / UUID
  - `publicacion_id`: String
  - `autor`: String (Default: "Anónimo")
  - `contenido`: Text (Requerido)
  - `fecha_creacion`: Timestamp

## 4. Escenarios de Aceptación (BDD)
- **Escenario 1: Registro válido de colaborador**
  - **GIVEN** que el usuario navega al formulario de colaboración,
  - **WHEN** completa los campos "Nombre completo" y "Correo electrónico" válidos y presiona enviar,
  - **THEN** los datos se persisten en la capa de almacenamiento y se muestra un mensaje de confirmación en pantalla.

- **Escenario 2: Publicación de comentario anónimo**
  - **GIVEN** que el lector se encuentra en la vista de detalle de una nota,
  - **WHEN** escribe un comentario dejando el campo de nombre vacío y hace clic en publicar,
  - **THEN** el comentario se guarda y muestra como autor "Anónimo".

## 5. Límites de Alcance y Exclusiones (Non-Goals)
- **NO** implementar paneles de autenticación o inicio de sesión de usuarios en esta fase.
- **NO** integrar bases de datos complejas de WordPress ni CMS externos en V1 (utilizar LocalStorage o un Mock DB estructurado).
- **NO** incluir pasarelas de pago ni procesamiento financiero.

## 6. Descomposición en Tareas (Tasks)
- [x] **Tarea 1**: Maquetación estructurada del Header y la sección de la Publicación Principal.
- [x] **Tarea 2**: Implementación de la vista de lectura individual y la lógica de comentarios.
- [x] **Tarea 3**: Creación del formulario "Quiero colaborar" con validaciones y placeholders dinámicos.
- [x] **Tarea 4**: Implementación del motor de persistencia simulado (Mock Storage) para exportar o consultar registros guardados.

## 7. Decisiones cerradas (v1.1)
- **Entidad `Publicacion`**: incorporada en la sección 3; las publicaciones se cargan desde un archivo semilla (sin CMS).
- **Placeholder**: desaparece al recibir foco (`:focus::placeholder`); cada campo conserva una etiqueta visible por accesibilidad.
- **Longitudes y formatos**:
  - `nombre_completo`: 2–120 caracteres.
  - `email`: formato email, máx. 254; **se acepta cualquier dominio**.
  - `telefono`: 10 dígitos; **admite guiones entre dígitos en cualquier posición** (`^\d(?:-?\d){9}$`; ej. `5543650920`, `55-4365-0920`, `554-365-0920`). *(Actualizado en v1.2; antes solo 3-3-4.)*
  - `area_adscripcion`: máx. 120.
  - `autor` de comentario: máx. 120; vacío → "Anónimo".
  - `contenido` de comentario: 1–2,000 caracteres.
- **Vista de consulta en el prototipo** *(decisión 2026-10-01)*: `#/admin/exportar` queda accesible sin autenticación mientras el sitio sea prototipo. No expone datos de terceros porque, con LocalStorage, cada navegador solo ve sus propios registros. **Antes de producción** se requiere backend, autenticación del lado del servidor para la consulta/descarga y aviso de privacidad (ver `plan.md` §8).
- **Nombres de campos del comentario**: los campos del formulario de la sección 2.2 (`nombre_autor`, `texto_comentario`) corresponden a los campos de la entidad de la sección 3 (`autor`, `contenido`); el contrato y el código usan estos últimos.
- **Registros repetidos**: se permite registrar el mismo correo más de una vez; cada registro recibe su propio `id` y `fecha_registro` y todos aparecen en la exportación.
- **Exportación (Tarea 4)**: CSV descargable (UTF-8 con BOM, separador coma), nombre `colaboradores_AAAA-MM-DD.csv`, desde la vista `#/admin/exportar`.

### 7.1 Ajustes de la revisión del prototipo (v1.2 · 2026-10-05)
1. **Texto de "Quiero colaborar"** actualizado (ver §2.1).
2. **Nuevo campo opcional `comentario_propuesta`** ("Comentario o propuesta"): hasta 2,000 caracteres, área de texto de ≈4 renglones con contador; se guarda en `Colaborador`, aparece en la consulta y en el CSV (columna entre `area_adscripcion` y `fecha_registro`). Cambio compatible: contrato `openapi.yaml` 1.0.0 → **1.1.0**; los registros previos sin este campo siguen siendo válidos.
3. **Teléfono**: se aceptan guiones entre dígitos en cualquier posición, siempre que sean 10 dígitos (ver §7). Siguen sin aceptarse espacios ni paréntesis.
4. **Paleta rosa** (sustituye al guinda): primario `#B83C74`, oscuro `#8A2752`, suave `#FBEAF1`; todos los textos cumplen contraste WCAG AA. Se seguirá puliendo; los colores se cambian solo en `src/css/tokens.css`.
5. **Identidad provisional**: nombre y lema (ver §2.1). *v1.2.1 (2026-10-05): "Faro Laboral" y su lema se sustituyen por "EL PULSO DE LA BASE SINDICALIZADA DE BANOBRAS" / "Información · diálogo · participación". v1.2.2: el nombre cambia a "MANOS A LA OBRA"; el lema se conserva.* Puede cambiar; se edita solo en `src/js/identidad.js` (una prueba verifica que `index.html` coincida).

