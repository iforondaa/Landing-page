import { h, fragmento } from '../lib/dom.js';
import { heroPublicacion } from '../components/hero-publicacion.js';
import { formularioColaborar } from '../components/colaborar-form.js';

/** Vista de inicio: publicación principal (hero) + sección "Quiero colaborar". */
export async function vistaInicio({ api }) {
  const publicaciones = await api.listPublicaciones();
  const principal = publicaciones.find((p) => p.es_principal);

  const seccionPublicaciones = h('section', { id: 'publicaciones', class: 'seccion seccion--hero', tabindex: '-1', 'aria-labelledby': 'antetitulo-publicaciones' },
    h('div', { class: 'contenedor' },
      h('p', { class: 'antetitulo', id: 'antetitulo-publicaciones' }, 'Publicaciones'),
      heroPublicacion(principal),
    ),
  );

  const seccionColaborar = h('section', { id: 'colaborar', class: 'seccion', tabindex: '-1', 'aria-labelledby': 'titulo-colaborar' },
    h('div', { class: 'contenedor colaborar' },
      h('div', { class: 'colaborar__intro' },
        h('h2', { class: 'seccion__titulo', id: 'titulo-colaborar' }, 'Quiero colaborar'),
        h('p', { class: 'seccion__intro' },
          'Si tienes un comentario, propuesta o te interesa participar en iniciativas a favor de la base trabajadora, déjanos tus datos y nos pondremos en contacto contigo.')),
      formularioColaborar({ api }),
    ),
  );

  return { nodo: fragmento(seccionPublicaciones, seccionColaborar), titulo: 'Inicio' };
}
