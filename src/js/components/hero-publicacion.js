import { h } from '../lib/dom.js';
import { formatearFecha } from '../lib/formato.js';

/** Bloque visual de la imagen; si no hay imagen o no carga, muestra un fondo institucional. */
export function mediaPublicacion(publicacion, clase = 'hero-card__media') {
  const contenedor = h('div', { class: clase });
  if (!publicacion.imagen_url) {
    contenedor.classList.add(`${clase}--vacia`, 'media--vacia');
    return contenedor;
  }
  // La portada puede ser informativa (p. ej. una gráfica): su texto alternativo viene del contrato.
  const img = h('img', { src: publicacion.imagen_url, alt: publicacion.imagen_alt ?? '', decoding: 'async', fetchpriority: 'high' });
  img.addEventListener('error', () => {
    img.remove();
    contenedor.classList.add(`${clase}--vacia`, 'media--vacia');
  }, { once: true });
  contenedor.append(img);
  return contenedor;
}

/**
 * Tarjeta de la publicación principal. Toda la tarjeta lleva a la vista de lectura
 * (#/publicacion/:id) mediante un único enlace en el título (accesible y sin anidar enlaces).
 */
export function heroPublicacion(publicacion) {
  const url = `#/publicacion/${encodeURIComponent(publicacion.id)}`;
  return h('article', { class: 'hero-card', 'aria-labelledby': 'titulo-principal' },
    mediaPublicacion(publicacion),
    h('div', { class: 'hero-card__cuerpo' },
      h('p', { class: 'etiqueta' }, 'Publicación principal'),
      h('h1', { class: 'hero-card__titulo', id: 'titulo-principal' },
        h('a', { href: url }, publicacion.titulo)),
      h('p', { class: 'hero-card__resumen' }, publicacion.resumen),
      h('p', { class: 'meta' },
        h('span', {}, publicacion.autor),
        h('span', { class: 'meta__sep', 'aria-hidden': 'true' }, '·'),
        h('time', { datetime: publicacion.fecha_publicacion }, formatearFecha(publicacion.fecha_publicacion))),
      h('span', { class: 'boton', 'aria-hidden': 'true' }, 'Leer nota completa', h('span', { class: 'boton__flecha' }, '→')),
    ),
  );
}
