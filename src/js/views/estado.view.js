import { h } from '../lib/dom.js';
import { ApiError } from '../data/api.js';

export function vistaNoEncontrada() {
  return {
    titulo: 'Página no encontrada',
    nodo: h('div', { class: 'contenedor estado' },
      h('h1', {}, 'Página no encontrada'),
      h('p', {}, 'La dirección que abriste no existe o cambió.'),
      h('a', { class: 'boton', href: '#/' }, 'Ir al inicio')),
  };
}

export function vistaError(error, reintentar) {
  const mensaje = error instanceof ApiError ? error.message : 'Ocurrió un problema inesperado al cargar esta página.';
  return {
    titulo: 'Error',
    nodo: h('div', { class: 'contenedor estado', role: 'alert' },
      h('h1', {}, 'No pudimos cargar el contenido'),
      h('p', {}, mensaje),
      h('button', { class: 'boton', type: 'button', onClick: reintentar }, 'Intentar de nuevo')),
  };
}
