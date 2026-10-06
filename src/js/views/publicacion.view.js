/** Vista de lectura de una publicación (Tarea 2) con sus comentarios al pie. */
import { h } from '../lib/dom.js';
import { formatearFecha, enParrafos } from '../lib/formato.js';
import { ApiError } from '../data/api.js';
import { mediaPublicacion } from '../components/hero-publicacion.js';
import { seccionComentarios } from '../components/comentarios.js';
import { vistaNoEncontrada } from './estado.view.js';

export async function vistaPublicacion({ api, params }) {
  let publicacion;
  try {
    publicacion = await api.getPublicacion(params.id);
  } catch (e) {
    if (e instanceof ApiError && e.codigo === 'NO_ENCONTRADO') {
      const v = vistaNoEncontrada();
      v.nodo.querySelector('h1').textContent = 'Publicación no encontrada';
      v.nodo.querySelector('p').textContent = 'La publicación que buscas no existe o fue retirada.';
      return { ...v, titulo: 'Publicación no encontrada' };
    }
    throw e;
  }

  const comentarios = await seccionComentarios({ api, publicacionId: publicacion.id });

  const nodo = h('div', { class: 'lectura' },
    h('div', { class: 'contenedor lectura__contenedor' },
      h('nav', { class: 'lectura__migas', 'aria-label': 'Ruta de navegación' },
        h('a', { href: '#/publicaciones', class: 'enlace-volver' }, h('span', { 'aria-hidden': 'true' }, '← '), 'Volver a publicaciones')),
      h('article', { class: 'nota', 'aria-labelledby': 'titulo-nota' },
        h('header', { class: 'nota__cabecera' },
          publicacion.es_principal ? h('p', { class: 'etiqueta' }, 'Publicación principal') : null,
          h('h1', { class: 'nota__titulo', id: 'titulo-nota' }, publicacion.titulo),
          h('p', { class: 'nota__resumen' }, publicacion.resumen),
          h('p', { class: 'meta' },
            h('span', {}, publicacion.autor),
            h('span', { class: 'meta__sep', 'aria-hidden': 'true' }, '·'),
            h('time', { datetime: publicacion.fecha_publicacion }, formatearFecha(publicacion.fecha_publicacion)))),
        mediaPublicacion(publicacion, 'nota__media'),
        h('div', { class: 'nota__cuerpo' }, enParrafos(publicacion.cuerpo).map((p) => h('p', {}, p)))),
      comentarios));

  return { nodo, titulo: publicacion.titulo };
}
