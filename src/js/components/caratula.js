/** Carátula de la nota: «los resultados en un vistazo» (spec: $defs/caratula). */
import { h } from '../lib/dom.js';
import { textoEnriquecido } from '../lib/texto.js';
import { grafica } from './grafica.js';
import { citas } from './bloques.js';

export function caratula(c) {
  return h('section', { class: 'caratula', 'aria-labelledby': 'caratula-titulo' },
    h('h2', { class: 'caratula__titulo', id: 'caratula-titulo' }, c.titulo),
    c.subtitulo ? h('p', { class: 'caratula__subtitulo' }, c.subtitulo) : null,
    c.cifras?.length
      ? h('ul', { class: 'caratula__cifras' }, c.cifras.map((x) => h('li', { class: 'cifra' },
        h('span', { class: 'cifra__valor' }, x.valor),
        h('span', { class: 'cifra__texto' }, textoEnriquecido(x.texto)))))
      : null,
    c.graficas?.length ? h('div', { class: 'caratula__graficas' }, c.graficas.map(grafica)) : null,
    c.destacado || c.cita
      ? h('div', { class: 'caratula__pie' },
        c.destacado ? h('div', { class: 'destacado' },
          h('p', { class: 'destacado__titulo' }, c.destacado.titulo),
          h('p', { class: 'destacado__valor' }, c.destacado.valor),
          h('p', { class: 'destacado__texto' }, textoEnriquecido(c.destacado.texto))) : null,
        c.cita ? citas([c.cita]) : null)
      : null,
    c.nota ? h('p', { class: 'caratula__nota' }, c.nota) : null);
}
