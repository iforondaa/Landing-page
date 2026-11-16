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

const ETIQUETA_ESTADO = { pendiente: 'Pendiente', aprobado: 'Publicado', rechazado: 'Rechazado' };

/**
 * Revisión de comentarios (contrato 3.0.0): los nuevos llegan «pendientes» y solo se
 * publican al aprobarlos. Los revisados se pueden volver a aprobar o rechazar, o borrar.
 */
function seccionModeracion({ api, comentarios, titulos, alExpirar }) {
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });
  const estado = new Map(comentarios.map((c) => [c.id, c]));
  const contenedor = h('div', { class: 'admin__moderacion' });
  const tituloPendientes = h('h2', { class: 'exportar__titulo', id: 'titulo-pendientes', tabindex: '-1' });
  const tituloRevisados = h('h2', { class: 'exportar__titulo admin__subtitulo', id: 'titulo-revisados' }, 'Comentarios revisados');

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

  /** Vuelve a dibujar ambas listas y pone el foco en `enfocar(id)` o en el título de pendientes. */
  function pintar(enfocarId) {
    const todos = [...estado.values()];
    const pendientes = todos.filter((c) => c.estado === 'pendiente');
    const revisados = todos.filter((c) => c.estado !== 'pendiente');
    tituloPendientes.replaceChildren('Pendientes de revisión ', h('span', { class: 'admin__contador' }, `(${pendientes.length})`));
    contenedor.replaceChildren(
      h('section', { class: 'admin__seccion', 'aria-labelledby': 'titulo-pendientes' },
        tituloPendientes,
        h('p', { class: 'exportar__resumen' }, pendientes.length === 0
          ? 'No hay comentarios por revisar.'
          : 'Revisa cada comentario antes de publicarlo. Nadie más los ve mientras estén pendientes.'),
        pendientes.length ? h('ul', { class: 'moderacion', 'aria-label': 'Comentarios pendientes de revisión' }, pendientes.map(item)) : null),
      h('section', { class: 'admin__seccion', 'aria-labelledby': 'titulo-revisados' },
        tituloRevisados,
        revisados.length === 0
          ? h('div', { class: 'comentarios__vacio' }, 'Aún no hay comentarios revisados.')
          : [
            h('p', { class: 'exportar__resumen' }, `${plural(revisados.length, 'comentario', 'comentarios')}, del más reciente al más antiguo.`),
            h('ul', { class: 'moderacion', 'aria-label': 'Comentarios revisados' }, revisados.map(item)),
          ]),
      anuncio);
    const destino = enfocarId ? contenedor.querySelector(`#moderar-${enfocarId} button`) : null;
    if (enfocarId !== undefined) (destino ?? tituloPendientes).focus();
  }

  /** Tras una acción, el foco va al siguiente comentario de la misma lista (o al título). */
  const siguienteDe = (id) => {
    const lista = [...estado.values()].filter((c) => (c.estado === 'pendiente') === (estado.get(id)?.estado === 'pendiente'));
    const i = lista.findIndex((c) => c.id === id);
    return (lista[i + 1] ?? lista[i - 1])?.id ?? null;
  };

  function item(c) {
    const error = h('p', { class: 'alerta', role: 'alert', hidden: true });
    const titulo = titulos.get(c.publicacion_id) ?? 'Publicación no disponible';
    const boton = (texto, clase, accion) => h('button', {
      class: `boton boton--chico ${clase}`, type: 'button', 'aria-label': `${texto} el comentario de ${c.autor}`, onClick: accion,
    }, texto);

    const cambiar = (nuevo) => async (e) => {
      e.currentTarget.disabled = true;
      error.hidden = true;
      const siguiente = siguienteDe(c.id);
      const ok = await intentar(async () => estado.set(c.id, await api.moderarComentario(c.id, { estado: nuevo })), error);
      if (!ok) { e.currentTarget.disabled = false; return; }
      anuncio.textContent = nuevo === 'aprobado' ? `Se publicó el comentario de ${c.autor}.` : `Se rechazó el comentario de ${c.autor}; ya no se ve en la nota.`;
      pintar(siguiente);
    };

    const acciones = h('div', { class: 'moderacion__acciones' },
      c.estado !== 'aprobado' ? boton('Aprobar', 'boton--aprobar', cambiar('aprobado')) : null,
      c.estado !== 'rechazado' ? boton('Rechazar', 'boton--secundario', cambiar('rechazado')) : null,
      boton('Borrar', 'boton--secundario boton--peligro', () => { acciones.hidden = true; confirmar.hidden = false; botonNo.focus(); }));
    const botonSi = h('button', { class: 'boton boton--chico boton--peligro-lleno', type: 'button' }, 'Sí, borrar');
    const botonNo = h('button', { class: 'boton boton--secundario boton--chico', type: 'button' }, 'Cancelar');
    const confirmar = h('div', { class: 'moderacion__confirmar', hidden: true },
      h('p', {}, '¿Borrar este comentario para siempre? No se puede deshacer.'),
      h('div', { class: 'moderacion__acciones' }, botonSi, botonNo));
    botonNo.addEventListener('click', () => { confirmar.hidden = true; acciones.hidden = false; acciones.querySelector('button:last-child').focus(); });
    botonSi.addEventListener('click', async () => {
      botonSi.disabled = true;
      error.hidden = true;
      const siguiente = siguienteDe(c.id);
      const ok = await intentar(() => api.deleteComentario(c.id), error);
      botonSi.disabled = false;
      if (!ok) return;
      estado.delete(c.id);
      anuncio.textContent = `Se borró el comentario de ${c.autor}.`;
      pintar(siguiente);
    });

    return h('li', { class: `moderacion__item moderacion__item--${c.estado}`, id: `moderar-${c.id}` },
      h('article', { 'aria-label': `Comentario de ${c.autor}` },
        h('p', { class: 'moderacion__meta' },
          h('strong', {}, c.autor), ' · ',
          h('time', { datetime: c.fecha_creacion }, formatearFechaHora(c.fecha_creacion)), ' · en ',
          h('a', { href: `#/publicacion/${encodeURIComponent(c.publicacion_id)}` }, titulo)),
        h('span', { class: `etiqueta etiqueta--${c.estado}` }, ETIQUETA_ESTADO[c.estado]),
        h('p', { class: 'comentario__contenido' }, c.contenido),
        acciones, confirmar, error));
  }

  pintar();
  return contenedor;
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
    const pendientes = comentarios.filter((c) => c.estado === 'pendiente').length;
    const moderacion = seccionModeracion({ api, comentarios, titulos, alExpirar: expirar });
    const avisoPendientes = pendientes
      ? h('div', { class: 'admin__pendientes' },
        h('p', {}, h('strong', {}, `Tienes ${plural(pendientes, 'comentario pendiente', 'comentarios pendientes')} de revisión.`)),
        h('button', {
          class: 'boton boton--chico', type: 'button',
          onClick: () => { const t = moderacion.querySelector('#titulo-pendientes'); t?.focus(); t?.scrollIntoView({ block: 'start' }); },
        }, 'Revisar ahora'))
      : null;
    nodo.replaceChildren(...[barra, avisoPendientes,
      seccionColaboradores(colaboradores, api.modo),
      moderacion].filter(Boolean));
  }

  if (sesion.requiereContrasena && !sesion.activa()) mostrarAcceso();
  else await mostrarPanel();
  return { nodo, titulo: 'Administración' };
}
