/**
 * Comentarios al pie de una nota (Tarea 2 · Escenario BDD 2).
 *
 * - Lista en orden cronológico (el más antiguo primero), como define el contrato.
 * - Nombre opcional: si se deja vacío, la capa de datos guarda "Anónimo".
 * - Al publicar, el comentario aparece al instante sin recargar.
 * - El texto de los usuarios siempre se inserta como texto (nunca como HTML).
 * - Sin atributo "maxlength": el navegador cuenta unidades UTF-16 (un emoji = 2) y cortaría
 *   antes que el contrato. El límite se valida con el esquema y el contador avisa en vivo.
 */
import { h } from '../lib/dom.js';
import { formatearFechaHora } from '../lib/formato.js';
import { schemas } from '../contract/schemas.generated.js';
import { crearValidador, restriccionesDeCampo } from '../lib/validator.js';
import { limpiarEntrada, recortar, OPCIONALES } from '../lib/normalizar.js';
import { ApiError } from '../data/api.js';

const SCHEMA_ID = 'comentario.input.schema.json';
const validar = crearValidador(schemas);
const largo = (texto) => [...texto].length; // caracteres Unicode, como JSON Schema

function itemComentario(c) {
  const inicial = ([...recortar(c.autor)][0] ?? '?').toUpperCase(); // [...] evita partir un emoji
  return h('li', { class: 'comentario', id: `comentario-${c.id}` },
    h('article', { 'aria-label': `Comentario de ${c.autor}` },
      h('header', { class: 'comentario__cabecera' },
        h('span', { class: 'comentario__avatar', 'aria-hidden': 'true' }, inicial),
        h('div', {},
          h('p', { class: 'comentario__autor' }, c.autor),
          h('time', { class: 'comentario__fecha', datetime: c.fecha_creacion }, formatearFechaHora(c.fecha_creacion)))),
      h('p', { class: 'comentario__contenido' }, c.contenido)));
}

/** Campo con etiqueta, ayuda opcional, mensaje de error y (opcional) contador. */
function crearCampo({ id, etiqueta, requerido, ayuda, control, contador }) {
  const error = h('p', { class: 'campo__error', id: `${id}-error` });
  const ayudaEl = ayuda ? h('p', { class: 'campo__ayuda', id: `${id}-ayuda` }, ayuda) : null;
  const base = [ayudaEl?.id, contador?.id].filter(Boolean);
  control.setAttribute('aria-invalid', 'false');
  if (base.length) control.setAttribute('aria-describedby', base.join(' '));
  const pintar = (mensaje) => {
    error.textContent = mensaje ?? '';
    control.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    const ids = mensaje ? [error.id, ...base] : base;
    if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
    else control.removeAttribute('aria-describedby');
  };
  const nodo = h('div', { class: 'campo' },
    h('label', { class: 'campo__etiqueta', for: id }, etiqueta,
      requerido ? h('span', { class: 'campo__req', 'aria-hidden': 'true' }, ' *') : h('span', { class: 'campo__opcional' }, ' (opcional)')),
    control, ayudaEl, error, contador);
  return { nodo, pintar };
}

export async function seccionComentarios({ api, publicacionId }) {
  const maxAutor = restriccionesDeCampo(schemas, SCHEMA_ID, 'autor').maxLength;
  const maxContenido = restriccionesDeCampo(schemas, SCHEMA_ID, 'contenido').maxLength;

  const conteo = h('span', { class: 'comentarios__conteo' });
  const lista = h('ol', { class: 'comentarios__lista', 'aria-label': 'Comentarios publicados' });
  const vacio = h('p', { class: 'comentarios__vacio' }, 'Aún no hay comentarios. Sé la primera persona en comentar.');
  const errorCarga = h('p', { class: 'alerta', role: 'alert', hidden: true });

  let total = 0;
  const actualizarConteo = () => {
    conteo.textContent = `(${total})`; // el encabezado se lee "Comentarios (n)"
    vacio.hidden = total > 0 || !errorCarga.hidden;
  };

  try {
    const comentarios = await api.listComentarios(publicacionId);
    lista.append(...comentarios.map(itemComentario));
    total = comentarios.length;
  } catch (e) {
    console.error(e);
    errorCarga.textContent = e instanceof ApiError ? `No pudimos cargar los comentarios. ${e.message}` : 'No pudimos cargar los comentarios.';
    errorCarga.hidden = false;
  }
  actualizarConteo();

  // ---- Formulario ----
  const autor = h('input', { id: 'comentario-autor', name: 'autor', type: 'text', autocomplete: 'name' });
  const contenido = h('textarea', { id: 'comentario-contenido', name: 'contenido', rows: '5', 'aria-required': 'true' });
  const contador = h('p', { class: 'campo__contador', id: 'comentario-contenido-contador' });
  const campoAutor = crearCampo({
    id: autor.id, etiqueta: 'Tu nombre', control: autor,
    ayuda: 'Si lo dejas vacío, tu comentario aparecerá como «Anónimo».',
  });
  const campoContenido = crearCampo({ id: contenido.id, etiqueta: 'Comentario', requerido: true, control: contenido, contador });
  const campos = { autor: campoAutor, contenido: campoContenido };
  const controles = { autor, contenido };

  const alerta = h('div', { class: 'alerta', role: 'alert', hidden: true });
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });
  const boton = h('button', { class: 'boton', type: 'submit' }, 'Publicar comentario');

  const fmt = (n) => n.toLocaleString('es-MX');
  const actualizarContador = () => {
    const n = largo(contenido.value);
    contador.textContent = `${fmt(n)} / ${fmt(maxContenido)} caracteres`;
    contador.classList.toggle('campo__contador--limite', n >= maxContenido * 0.9);
  };
  actualizarContador();

  const erroresPorCampo = (datos) => {
    const porCampo = {};
    for (const e of validar(SCHEMA_ID, limpiarEntrada(datos, OPCIONALES.comentario)).errores) porCampo[e.campo] ??= e.mensaje;
    return porCampo;
  };
  const leer = () => ({ autor: autor.value, contenido: contenido.value });
  const revisar = (nombre) => campos[nombre].pintar(erroresPorCampo(leer())[nombre]);

  // Error en vivo al pasar el límite, y se retira en cuanto se corrige.
  contenido.addEventListener('input', () => {
    actualizarContador();
    if (largo(contenido.value) > maxContenido || contenido.getAttribute('aria-invalid') === 'true') revisar('contenido');
  });
  autor.addEventListener('input', () => {
    if (largo(autor.value) > maxAutor || autor.getAttribute('aria-invalid') === 'true') revisar('autor');
  });

  let enviando = false;
  const form = h('form', { class: 'formulario comentarios__form', novalidate: true, 'aria-labelledby': 'titulo-nuevo-comentario' },
    h('h3', { class: 'comentarios__subtitulo', id: 'titulo-nuevo-comentario' }, 'Deja un comentario'),
    h('div', { class: 'formulario__rejilla formulario__rejilla--una' }, campoAutor.nodo, campoContenido.nodo),
    alerta,
    h('div', { class: 'formulario__acciones' }, boton),
    anuncio);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    alerta.hidden = true;
    const datos = leer();
    const errores = erroresPorCampo(datos);
    for (const nombre of Object.keys(campos)) campos[nombre].pintar(errores[nombre]);
    const primero = Object.keys(campos).find((n) => errores[n]);
    if (primero) {
      controles[primero].focus();
      return;
    }

    enviando = true;
    boton.disabled = true;
    boton.classList.add('boton--cargando');
    boton.textContent = 'Publicando…';
    try {
      const nuevo = await api.createComentario(publicacionId, datos);
      const item = itemComentario(nuevo);
      item.classList.add('comentario--nuevo');
      lista.append(item);
      total += 1;
      actualizarConteo();
      form.reset();
      actualizarContador();
      Object.values(campos).forEach((c) => c.pintar(null));
      anuncio.textContent = `Tu comentario se publicó como ${nuevo.autor}.`;
      item.scrollIntoView({ block: 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } catch (err) {
      console.error(err);
      const detalles = err instanceof ApiError && err.codigo === 'VALIDACION' ? (err.detalles ?? []).filter((d) => campos[d.campo]) : [];
      if (detalles.length) {
        detalles.forEach((d) => campos[d.campo].pintar(d.mensaje));
        controles[detalles[0].campo].focus();
      } else {
        alerta.textContent = err instanceof ApiError ? err.message : 'No se pudo publicar tu comentario. Intenta de nuevo.';
        alerta.hidden = false;
      }
    } finally {
      enviando = false;
      boton.disabled = false;
      boton.classList.remove('boton--cargando');
      boton.textContent = 'Publicar comentario';
    }
  });

  return h('section', { class: 'comentarios', id: 'comentarios', 'aria-labelledby': 'titulo-comentarios' },
    h('h2', { class: 'comentarios__titulo', id: 'titulo-comentarios' }, 'Comentarios ', conteo),
    errorCarga,
    lista,
    vacio,
    form);
}
