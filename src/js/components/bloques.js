/** Convierte los bloques del contenido (spec: $defs/bloque) en elementos de la página. */
import { h } from '../lib/dom.js';
import { textoEnriquecido } from '../lib/texto.js';
import { grafica } from './grafica.js';

function citas(lista) {
  return h('div', { class: 'citas' }, lista.map((c) => h('blockquote', { class: 'cita' },
    h('p', {}, `“${c.texto}”`),
    c.fuente ? h('p', { class: 'cita__fuente' }, c.fuente) : null)));
}

export function bloque(b) {
  switch (b.tipo) {
    case 'seccion': return h('h2', { class: 'bloque-seccion' }, textoEnriquecido(b.texto));
    case 'subseccion': return h('h3', { class: 'bloque-subseccion' }, textoEnriquecido(b.texto));
    case 'parrafo': return h('p', { class: 'bloque-parrafo' }, textoEnriquecido(b.texto));
    case 'lista': return h('ul', { class: 'bloque-lista' }, (b.elementos ?? []).map((e) => h('li', {}, textoEnriquecido(e))));
    case 'citas': return citas(b.citas ?? []);
    case 'grafica': return b.grafica ? grafica(b.grafica) : null;
    default: return null; // tipo desconocido: se ignora sin romper la página
  }
}

export const bloques = (lista = []) => lista.map(bloque).filter(Boolean);
export { citas };
