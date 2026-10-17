/**
 * Administración (#/admin, también #/admin/exportar). No se enlaza desde el encabezado.
 *  - Colaboradores: tabla y descarga CSV (Tarea 4 · spec 6.4).
 *  - Comentarios: ocultar, volver a mostrar o borrar (spec v2.0).
 * En modo Supabase pide iniciar sesión; en modo prototipo (LocalStorage) no.
 */
import { h } from '../lib/dom.js';
import { formatearFechaHora } from '../lib/formato.js';
import { aCSV, nombreArchivo, descargar } from '../lib/csv.js';
import { schemas } from '../contract/schemas.generated.js';
import { ApiError } from '../data/api.js';

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

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const sinDato = () => h('span', { class: 'tabla__vacio' }, h('span', { 'aria-hidden': 'true' }, '—'), h('span', { class: 'visualmente-oculto' }, 'Sin dato'));

function tabla(colaboradores) {
  return h('div', { class: 'tabla-contenedor', tabindex: '0', role: 'region', 'aria-labelledby': 'titulo-tabla' },
    h('table', { class: 'tabla' },
      h('caption', { class: 'visualmente-oculto', id: 'titulo-tabla' }, 'Colaboradores registrados, del más reciente al más antiguo'),
      h('thead', {}, h('tr', {}, COLUMNAS_TABLA.map(([, t]) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, colaboradores.map((c) => h('tr', {},
        COLUMNAS_TABLA.map(([campo]) => {
          if (campo === 'fecha_registro') return h('td', { 'data-campo': campo }, h('time', { datetime: c[campo] }, formatearFechaHora(c[campo])));
          if (campo === 'nombre_completo') return h('th', { scope: 'row' }, c[campo]);
          return h('td', { 'data-campo': campo }, c[campo] ?? sinDato());
        }))))));
}

function seccionColaboradores(colaboradores, modo) {
  const total = colaboradores.length;
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });
  const boton = h('button', {
    class: 'boton', type: 'button', disabled: total === 0,
    onClick: () => {
      const nombre = nombreArchivo('colaboradores');
      descargar(aCSV(colaboradores, COLUMNAS_CSV), nombre);
      anuncio.textContent = `Se descargó ${nombre} con ${plural(total, 'registro', 'registros')}.`;
    },
  }, 'Descargar CSV');

  return h('section', { class: 'admin__seccion', 'aria-labelledby': 'titulo-colaboradores' },
    h('header', { class: 'exportar__cabecera' },
      h('div', {},
        h('h1', { class: 'exportar__titulo', id: 'titulo-colaboradores' }, 'Colaboradores registrados'),
        h('p', { class: 'exportar__resumen' },
          total === 0 ? 'Aún no hay registros.' : `${plural(total, 'registro', 'registros')}, del más reciente al más antiguo.`)),
      boton),
    modo === 'local'
      ? h('p', { class: 'aviso' },
        h('strong', {}, 'Modo prototipo: '),
        'los registros se guardan solo en este navegador. ',
        'Otros equipos o navegadores tienen sus propios registros, y borrar los datos de navegación los elimina.')
      : null,
    total === 0
      ? h('div', { class: 'comentarios__vacio' }, 'Cuando alguien se registre en «Quiero colaborar», aparecerá aquí.')
      : tabla(colaboradores),
    anuncio);
}

function seccionModeracion({ api, comentarios, titulos, alExpirar }) {
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });
  const resumen = h('p', { class: 'exportar__resumen' });
  const lista = h('ul', { class: 'moderacion', 'aria-label': 'Comentarios para moderar' });
  const vacio = h('div', { class: 'comentarios__vacio' }, 'Aún no hay comentarios en ninguna publicación.');
  const estado = new Map(comentarios.map((c) => [c.id, c]));

  const actualizarResumen = () => {
    const todos = [...estado.values()];
    const ocultos = todos.filter((c) => c.oculto).length;
    resumen.textContent = todos.length === 0
      ? 'Aún no hay comentarios.'
      : `${plural(todos.length, 'comentario', 'comentarios')}, del más reciente al más antiguo${ocultos ? ` · ${plural(ocultos, 'oculto', 'ocultos')} al público` : ''}.`;
    vacio.hidden = todos.length > 0;
  };

  async function intentar(accion, error) {
    try {
      await accion();
      return true;
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError && e.codigo === 'NO_AUTORIZADO') { alExpirar(); return false; }
      error.textContent = e instanceof ApiError ? e.message : 'No se pudo completar la acción. Intenta de nuevo.';
      error.hidden = false;
      return false;
    }
  }

  function item(c) {
    const error = h('p', { class: 'alerta', role: 'alert', hidden: true });
    const etiquetaOculto = h('span', { class: 'etiqueta etiqueta--oculto' }, 'Oculto al público');
    const botonVisibilidad = h('button', { class: 'boton boton--secundario boton--chico', type: 'button' });
    const botonBorrar = h('button', { class: 'boton boton--secundario boton--chico boton--peligro', type: 'button' }, 'Borrar');
    const confirmar = h('div', { class: 'moderacion__confirmar', hidden: true },
      h('p', {}, '¿Borrar este comentario para siempre? No se puede deshacer.'));
    const botonSi = h('button', { class: 'boton boton--chico boton--peligro-lleno', type: 'button' }, 'Sí, borrar');
    const botonNo = h('button', { class: 'boton boton--secundario boton--chico', type: 'button' }, 'Cancelar');
    confirmar.append(h('div', { class: 'moderacion__acciones' }, botonSi, botonNo));
    const acciones = h('div', { class: 'moderacion__acciones' }, botonVisibilidad, botonBorrar);
    const titulo = titulos.get(c.publicacion_id) ?? 'Publicación no disponible';

    const nodo = h('li', { class: 'moderacion__item', id: `moderar-${c.id}` },
      h('article', { 'aria-label': `Comentario de ${c.autor}` },
        h('p', { class: 'moderacion__meta' },
          h('strong', {}, c.autor), ' · ',
          h('time', { datetime: c.fecha_creacion }, formatearFechaHora(c.fecha_creacion)), ' · en ',
          h('a', { href: `#/publicacion/${encodeURIComponent(c.publicacion_id)}` }, titulo)),
        etiquetaOculto,
        h('p', { class: 'comentario__contenido' }, c.contenido),
        acciones, confirmar, error));

    const pintar = () => {
      const actual = estado.get(c.id);
      nodo.classList.toggle('moderacion__item--oculto', actual.oculto);
      etiquetaOculto.hidden = !actual.oculto;
      botonVisibilidad.textContent = actual.oculto ? 'Mostrar' : 'Ocultar';
      botonVisibilidad.setAttribute('aria-label', `${actual.oculto ? 'Mostrar' : 'Ocultar'} el comentario de ${c.autor}`);
      botonBorrar.setAttribute('aria-label', `Borrar el comentario de ${c.autor}`);
    };
    pintar();

    botonVisibilidad.addEventListener('click', async () => {
      error.hidden = true;
      botonVisibilidad.disabled = true;
      const oculto = !estado.get(c.id).oculto;
      const ok = await intentar(async () => estado.set(c.id, await api.moderarComentario(c.id, { oculto })), error);
      botonVisibilidad.disabled = false;
      if (ok) {
        pintar();
        actualizarResumen();
        anuncio.textContent = oculto ? `Se ocultó el comentario de ${c.autor}.` : `El comentario de ${c.autor} vuelve a ser visible.`;
        botonVisibilidad.focus();
      }
    });
    botonBorrar.addEventListener('click', () => {
      acciones.hidden = true;
      confirmar.hidden = false;
      botonNo.focus();
    });
    botonNo.addEventListener('click', () => {
      confirmar.hidden = true;
      acciones.hidden = false;
      botonBorrar.focus();
    });
    botonSi.addEventListener('click', async () => {
      error.hidden = true;
      botonSi.disabled = true;
      const ok = await intentar(() => api.deleteComentario(c.id), error);
      botonSi.disabled = false;
      if (!ok) return;
      const siguiente = nodo.nextElementSibling ?? nodo.previousElementSibling;
      nodo.remove();
      estado.delete(c.id);
      actualizarResumen();
      anuncio.textContent = `Se borró el comentario de ${c.autor}.`;
      (siguiente?.querySelector('button') ?? resumen).focus?.();
    });
    return nodo;
  }

  lista.append(...comentarios.map(item));
  actualizarResumen();
  return h('section', { class: 'admin__seccion', 'aria-labelledby': 'titulo-moderacion' },
    h('h2', { class: 'exportar__titulo', id: 'titulo-moderacion' }, 'Comentarios'),
    resumen, vacio, lista, anuncio);
}

function formularioAcceso({ sesion, aviso, alEntrar }) {
  const correo = h('input', { id: 'admin-correo', name: 'email', type: 'email', autocomplete: 'username', required: true });
  const contrasena = h('input', { id: 'admin-contrasena', name: 'password', type: 'password', autocomplete: 'current-password', required: true });
  const alerta = h('p', { class: 'alerta', role: 'alert', hidden: !aviso }, aviso ?? '');
  const boton = h('button', { class: 'boton', type: 'submit' }, 'Entrar');
  const form = h('form', { class: 'formulario acceso', 'aria-labelledby': 'titulo-acceso' },
    h('h1', { class: 'exportar__titulo', id: 'titulo-acceso' }, 'Administración'),
    h('p', { class: 'exportar__resumen' }, 'Inicia sesión para ver los registros y moderar los comentarios.'),
    alerta,
    h('div', { class: 'campo' }, h('label', { class: 'campo__etiqueta', for: correo.id }, 'Correo electrónico'), correo),
    h('div', { class: 'campo' }, h('label', { class: 'campo__etiqueta', for: contrasena.id }, 'Contraseña'), contrasena),
    h('div', { class: 'formulario__acciones' }, boton));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!correo.value.trim() || !contrasena.value) {
      alerta.textContent = 'Escribe tu correo y tu contraseña.';
      alerta.hidden = false;
      (correo.value.trim() ? contrasena : correo).focus();
      return;
    }
    boton.disabled = true;
    boton.classList.add('boton--cargando');
    try {
      await sesion.iniciar(correo.value.trim(), contrasena.value);
      contrasena.value = '';
      await alEntrar();
    } catch (err) {
      console.error(err);
      alerta.textContent = err.message || 'No se pudo iniciar sesión.';
      alerta.hidden = false;
      contrasena.value = '';
      contrasena.focus();
    } finally {
      boton.disabled = false;
      boton.classList.remove('boton--cargando');
    }
  });
  return form;
}

export async function vistaAdmin({ api, sesion }) {
  const nodo = h('div', { class: 'contenedor exportar' });
  const enfocarTitulo = () => nodo.querySelector('h1')?.focus?.();

  const mostrarAcceso = (aviso) => {
    nodo.replaceChildren(formularioAcceso({ sesion, aviso, alEntrar: async () => { await mostrarPanel(); nodo.querySelector('h1')?.setAttribute('tabindex', '-1'); enfocarTitulo(); } }));
  };
  const expirar = async () => {
    await sesion.cerrar();
    mostrarAcceso('Tu sesión expiró. Vuelve a iniciar sesión.');
  };

  async function mostrarPanel() {
    let colaboradores; let comentarios; let publicaciones;
    try {
      [colaboradores, comentarios, publicaciones] = await Promise.all([api.listColaboradores(), api.listComentariosAdmin(), api.listPublicaciones()]);
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'NO_AUTORIZADO') { await expirar(); return; }
      throw e;
    }
    const titulos = new Map(publicaciones.map((p) => [p.id, p.titulo]));
    const barra = sesion.requiereContrasena
      ? h('div', { class: 'admin__sesion' },
        h('p', {}, 'Sesión iniciada', sesion.correo() ? [' como ', h('strong', {}, sesion.correo())] : null, '.'),
        h('button', {
          class: 'boton boton--secundario boton--chico', type: 'button',
          onClick: async () => { await sesion.cerrar(); mostrarAcceso(); },
        }, 'Cerrar sesión'))
      : null;
    nodo.replaceChildren(...[barra,
      seccionColaboradores(colaboradores, api.modo),
      seccionModeracion({ api, comentarios, titulos, alExpirar: expirar })].filter(Boolean));
  }

  if (sesion.requiereContrasena && !sesion.activa()) mostrarAcceso();
  else await mostrarPanel();
  return { nodo, titulo: 'Administración' };
}
