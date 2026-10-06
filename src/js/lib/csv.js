/**
 * Exportación CSV (spec 6.4): UTF-8 con BOM, separador coma, todos los valores
 * entrecomillados, saltos de línea CRLF (lo que Excel espera en Windows).
 *
 * Protección contra "inyección de fórmulas" (OWASP CSV Injection): si un valor que
 * escribió un usuario empieza con = + - @ tabulador o retorno, Excel podría ejecutarlo
 * como fórmula al abrir el archivo. Se antepone un apóstrofo para que se lea como texto.
 */
const BOM = '\uFEFF';
const INICIO_PELIGROSO = /^[=+\-@\t\r]/;

export function celda(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (INICIO_PELIGROSO.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * @param {object[]} registros
 * @param {string[]} columnas  Orden y nombre de las columnas (encabezado = nombre del campo).
 */
export function aCSV(registros, columnas) {
  const filas = [columnas.map(celda).join(',')];
  for (const r of registros) filas.push(columnas.map((c) => celda(r[c])).join(','));
  return BOM + filas.join('\r\n') + '\r\n';
}

const FECHA_CDMX = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Mexico_City',
});

/** colaboradores_AAAA-MM-DD.csv con la fecha de la Ciudad de México. */
export function nombreArchivo(prefijo, fecha = new Date()) {
  return `${prefijo}_${FECHA_CDMX.format(fecha)}.csv`;
}

/** Inicia la descarga de un texto como archivo, sin servidor. */
export function descargar(contenido, nombre, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
