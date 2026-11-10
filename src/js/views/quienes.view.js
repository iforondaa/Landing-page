/** «¿Quiénes somos?» (#/quienes-somos). */
import { h } from '../lib/dom.js';
import { textoEnriquecido } from '../lib/texto.js';
import { QUIENES_SOMOS as Q } from '../contenido/quienes-somos.js';

const parrafo = (t) => h('p', { class: 'bloque-parrafo' }, textoEnriquecido(t));

export function vistaQuienes() {
  const nodo = h('div', { class: 'lectura' },
    h('div', { class: 'contenedor lectura__contenedor' },
      h('article', { class: 'nota quienes', 'aria-labelledby': 'titulo-quienes' },
        h('header', { class: 'nota__cabecera' },
          h('h1', { class: 'nota__titulo', id: 'titulo-quienes' }, Q.titulo),
          h('p', { class: 'nota__resumen' }, Q.entrada)),
        h('div', { class: 'nota__cuerpo' },
          Q.presentacion.map(parrafo),
          h('aside', { class: 'quienes__aclaracion', 'aria-label': 'Aclaración' }, parrafo(Q.aclaracion)),
          Q.secciones.map((s) => [
            h('h2', { class: 'bloque-seccion' }, s.titulo),
            s.parrafos.map(parrafo),
            s.invitacion
              ? h('div', { class: 'quienes__invitacion' },
                h('p', {}, s.invitacion),
                h('a', { class: 'boton', href: '#/colaborar' }, 'Quiero colaborar'))
              : null,
          ])))));
  return { nodo, titulo: Q.titulo };
}
