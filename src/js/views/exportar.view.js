/**
 * Consulta y exportación de colaboradores (Tarea 4 · spec 6.4).
 * Ruta #/admin/exportar, no enlazada desde el encabezado. Sin autenticación en V1 (Non-Goal).
 */
import { h } from '../lib/dom.js';
import { formatearFechaHora } from '../lib/formato.js';
import { aCSV, nombreArchivo, descargar } from '../lib/csv.js';
import { schemas } from '../contract/schemas.generated.js';

/** Columnas del CSV: exactamente las propiedades del esquema, en su orden. */
export const COLUMNAS_CSV = Object.freeze(Object.keys(schemas['colaborador.schema.json'].properties));

const COLUMNAS_TABLA = [
  ['nombre_completo', 'Nombre completo'],
  ['email', 'Correo electrónico'],
  ['telefono', 'Teléfono'],
  ['area_adscripcion', 'Área de adscripción'],
  ['comentario_propuesta', 'Comentario o propuesta'],
  ['fecha_registro', 'Fecha de registro'],
];

function tabla(colaboradores) {
  return h('div', { class: 'tabla-contenedor', tabindex: '0', role: 'region', 'aria-labelledby': 'titulo-tabla' },
    h('table', { class: 'tabla' },
      h('caption', { class: 'visualmente-oculto', id: 'titulo-tabla' }, 'Colaboradores registrados, del más reciente al más antiguo'),
      h('thead', {}, h('tr', {}, COLUMNAS_TABLA.map(([, t]) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, colaboradores.map((c) => h('tr', {},
        COLUMNAS_TABLA.map(([campo]) => {
          if (campo === 'fecha_registro') return h('td', { 'data-campo': campo }, h('time', { datetime: c[campo] }, formatearFechaHora(c[campo])));
          if (campo === 'nombre_completo') return h('th', { scope: 'row' }, c[campo]);
          return h('td', { 'data-campo': campo }, c[campo] ?? h('span', { class: 'tabla__vacio' }, h('span', { 'aria-hidden': 'true' }, '—'), h('span', { class: 'visualmente-oculto' }, 'Sin dato')));
        }))))));
}

export async function vistaExportar({ api }) {
  const colaboradores = await api.listColaboradores();
  const total = colaboradores.length;
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });

  const boton = h('button', {
    class: 'boton', type: 'button', disabled: total === 0,
    onClick: () => {
      const nombre = nombreArchivo('colaboradores');
      descargar(aCSV(colaboradores, COLUMNAS_CSV), nombre);
      anuncio.textContent = `Se descargó ${nombre} con ${total} ${total === 1 ? 'registro' : 'registros'}.`;
    },
  }, 'Descargar CSV');

  const nodo = h('div', { class: 'contenedor exportar' },
    h('header', { class: 'exportar__cabecera' },
      h('div', {},
        h('h1', { class: 'exportar__titulo' }, 'Colaboradores registrados'),
        h('p', { class: 'exportar__resumen' },
          total === 0 ? 'Aún no hay registros.' : `${total} ${total === 1 ? 'registro' : 'registros'}, del más reciente al más antiguo.`)),
      boton),
    h('p', { class: 'aviso' },
      h('strong', {}, 'Importante: '),
      'en esta versión los registros se guardan solo en este navegador. ',
      'Otros equipos o navegadores tienen sus propios registros, y borrar los datos de navegación los elimina.'),
    total === 0
      ? h('div', { class: 'comentarios__vacio' }, 'Cuando alguien se registre en «Quiero colaborar», aparecerá aquí.')
      : tabla(colaboradores),
    anuncio);

  return { nodo, titulo: 'Colaboradores registrados' };
}
