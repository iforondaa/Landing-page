import { h } from './dom.js';

/**
 * "Texto con **negritas**" → [nodos de texto y <strong>]. Nunca interpreta HTML:
 * cualquier "<etiqueta>" se muestra tal cual, como texto.
 */
export function textoEnriquecido(texto) {
  return String(texto ?? '')
    .split(/\*\*(.+?)\*\*/su)
    .map((parte, i) => (i % 2 === 1 ? h('strong', {}, parte) : parte))
    .filter((parte) => parte !== '');
}
