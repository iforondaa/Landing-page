const FORMATO_FECHA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
});

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
});

/** "2026-10-01T00:05:00.000Z" → "30 de septiembre de 2026 a las 6:05 p.m." (hora de la Ciudad de México). */
export function formatearFechaHora(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso ?? '') : FORMATO_FECHA_HORA.format(d); // datos dañados: no romper la vista
}

/** "2026-09-30T12:00:00.000Z" → "30 de septiembre de 2026" (hora de la Ciudad de México). */
export function formatearFecha(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso ?? '') : FORMATO_FECHA.format(d);
}

/** Divide el cuerpo de una nota en párrafos (separados por una línea en blanco). */
export function enParrafos(texto) {
  return texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
