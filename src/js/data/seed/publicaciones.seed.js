/**
 * Publicaciones semilla (V1 sin CMS). Deben cumplir spec/schemas/publicacion.schema.json;
 * el adaptador las valida al arrancar y exige exactamente una con es_principal = true.
 *
 * ⚠ CONTENIDO DE EJEMPLO: sustituir por las notas institucionales reales.
 */
export const publicaciones = [
  {
    id: '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
    titulo: '[Ejemplo] Título de la publicación principal',
    resumen: 'Resumen breve de la publicación principal. Este texto aparece en la sección superior de la landing e invita a leer la nota completa.',
    cuerpo: 'Primer párrafo de la nota de ejemplo. Aquí va la introducción del tema.\n\nSegundo párrafo con el desarrollo de la información.\n\nTercer párrafo con el cierre y la invitación a comentar.',
    autor: 'Comunicación Institucional',
    fecha_publicacion: '2026-09-30T12:00:00.000Z',
    // imagen_url: 'assets/img/publicacion-principal.jpg', ← activar al colocar la imagen real (si falta, se muestra un fondo institucional)
    es_principal: true,
  },
  {
    id: 'b4c5d6e7-f809-4a1b-9c2d-3e4f5a6b7c8d',
    titulo: '[Ejemplo] Publicación anterior',
    resumen: 'Resumen de una publicación anterior, disponible para futuras secciones de la landing.',
    cuerpo: 'Contenido de ejemplo de una publicación anterior.\n\nSegundo párrafo de ejemplo.',
    autor: 'Comunicación Institucional',
    fecha_publicacion: '2026-09-15T12:00:00.000Z',
    es_principal: false,
  },
];
