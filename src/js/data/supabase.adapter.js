/**
 * Adaptador de Supabase (V2): implementa las mismas operaciones que el
 * adaptador de LocalStorage (spec/openapi.yaml 2.1.0) usando la API REST de
 * Supabase (PostgREST). No necesita librerías: solo `fetch`.
 *
 * Seguridad: el navegador solo tiene la clave pública del proyecto. Lo que
 * cada quien puede hacer lo deciden las reglas de supabase/esquema.sql (RLS);
 * la validación de aquí es para dar mensajes claros, no para proteger datos.
 */
import { ApiError } from './api-error.js';
import { limpiarEntrada, OPCIONALES } from '../lib/normalizar.js';
import { crearCatalogo, crearValidacion } from './catalogo.js';

const CAMPOS_COMENTARIO = 'id,publicacion_id,autor,contenido,fecha_creacion';
const TIEMPO_MAXIMO_MS = 15000;

/** Las claves "legacy" (anon) son JWT y también van en Authorization; las nuevas (sb_publishable_…) no. */
export const esClaveJwt = (clave) => /^eyJ/.test(clave);

/** Quita los null que devuelve la base de datos y normaliza fechas a ISO UTC. */
function normalizar(fila, campoFecha) {
  const limpio = {};
  for (const [k, v] of Object.entries(fila)) if (v !== null && v !== undefined) limpio[k] = v;
  if (limpio[campoFecha]) limpio[campoFecha] = new Date(limpio[campoFecha]).toISOString();
  return limpio;
}

/** Traduce la respuesta de error de PostgREST/Supabase al error del contrato. */
export async function errorDesdeRespuesta(respuesta) {
  let cuerpo = {};
  try { cuerpo = await respuesta.json(); } catch { /* sin cuerpo JSON */ }
  const codigo = String(cuerpo?.code ?? '');
  if (respuesta.status === 401 || respuesta.status === 403 || codigo === '42501' || codigo.startsWith('PGRST30')) {
    return new ApiError('NO_AUTORIZADO', { causa: cuerpo });
  }
  if (codigo === '23514' || codigo === '23502' || codigo.startsWith('22')) {
    return new ApiError('VALIDACION', { causa: cuerpo, detalles: [{ campo: '(datos)', mensaje: 'El servidor rechazó los datos: revisa el formato de los campos.' }] });
  }
  return new ApiError('ALMACENAMIENTO', { causa: cuerpo });
}

/**
 * @param {object} opciones
 * @param {string} opciones.url                 URL del proyecto, ej. https://abcd.supabase.co
 * @param {string} opciones.clave               Clave pública (publishable / anon) del proyecto.
 * @param {object[]} opciones.publicaciones     Semilla de publicaciones (siguen viviendo en el sitio).
 * @param {() => Promise<string|null>} [opciones.obtenerToken]  Token de la sesión de administración.
 * @param {typeof fetch} [opciones.fetch]
 */
export function createSupabaseAdapter({ url, clave, publicaciones, obtenerToken = async () => null, fetch: f = globalThis.fetch.bind(globalThis) }) {
  if (!url || !clave) throw new Error('Faltan la URL o la clave pública de Supabase.');
  const base = `${url.replace(/\/+$/, '')}/rest/v1`;
  const { validar, comprobarEntrada, comprobarSalida } = crearValidacion();
  const catalogo = crearCatalogo(publicaciones, validar);

  /** Petición a PostgREST. `admin: true` exige la sesión de administración. */
  async function pedir(ruta, { metodo = 'GET', cuerpo, admin = false, devolver = false } = {}) {
    const encabezados = { apikey: clave, Accept: 'application/json' };
    let token = null;
    if (admin) {
      token = await obtenerToken();
      if (!token) throw new ApiError('NO_AUTORIZADO');
    }
    if (token) encabezados.Authorization = `Bearer ${token}`;
    else if (esClaveJwt(clave)) encabezados.Authorization = `Bearer ${clave}`;
    if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (devolver) encabezados.Prefer = 'return=representation';

    let respuesta;
    try {
      respuesta = await f(`${base}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout?.(TIEMPO_MAXIMO_MS),
      });
    } catch (e) {
      throw new ApiError('ALMACENAMIENTO', { causa: e, mensaje: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.' });
    }
    if (!respuesta.ok) throw await errorDesdeRespuesta(respuesta);
    if (respuesta.status === 204) return null;
    const texto = await respuesta.text();
    return texto ? JSON.parse(texto) : null;
  }

  const comentario = (fila) => {
    const c = normalizar(fila, 'fecha_creacion');
    comprobarSalida('comentario.schema.json', c);
    return c;
  };
  const colaborador = (fila) => {
    const c = normalizar(fila, 'fecha_registro');
    comprobarSalida('colaborador.schema.json', c);
    return c;
  };
  const enc = encodeURIComponent;

  return Object.freeze({
    modo: 'supabase',

    listPublicaciones: async () => catalogo.listar(),
    getPublicacion: async (publicacionId) => catalogo.buscar(publicacionId),

    /** Solo comentarios visibles; nunca usa la sesión de administración. */
    async listComentarios(publicacionId) {
      catalogo.buscar(publicacionId);
      const filas = await pedir(`/comentarios?select=${CAMPOS_COMENTARIO}&publicacion_id=eq.${enc(publicacionId)}&oculto=is.false&order=fecha_creacion.asc`);
      return filas.map(comentario);
    },

    async createComentario(publicacionId, entrada) {
      catalogo.buscar(publicacionId);
      const datos = limpiarEntrada(entrada, OPCIONALES.comentario);
      comprobarEntrada('comentario.input.schema.json', datos);
      const [fila] = await pedir(`/comentarios?select=${CAMPOS_COMENTARIO}`, {
        metodo: 'POST', devolver: true,
        cuerpo: { publicacion_id: publicacionId, contenido: datos.contenido, ...(datos.autor && { autor: datos.autor }) },
      });
      return comentario(fila);
    },

    async listColaboradores() {
      const filas = await pedir('/colaboradores?select=*&order=fecha_registro.desc', { admin: true });
      return filas.map(colaborador);
    },

    async createColaborador(entrada) {
      const datos = limpiarEntrada(entrada, OPCIONALES.colaborador);
      comprobarEntrada('colaborador.input.schema.json', datos);
      const fila = await pedir('/rpc/registrar_colaborador', { metodo: 'POST', cuerpo: datos });
      return colaborador(fila);
    },

    async listComentariosAdmin() {
      const filas = await pedir(`/comentarios?select=${CAMPOS_COMENTARIO},oculto&order=fecha_creacion.desc`, { admin: true });
      return filas.map(comentario);
    },

    async moderarComentario(comentarioId, cambios) {
      comprobarEntrada('comentario.moderacion.schema.json', cambios);
      const filas = await pedir(`/comentarios?id=eq.${enc(comentarioId)}&select=${CAMPOS_COMENTARIO},oculto`, {
        metodo: 'PATCH', admin: true, devolver: true, cuerpo: { oculto: cambios.oculto },
      });
      if (!filas?.length) throw new ApiError('NO_ENCONTRADO', { mensaje: 'El comentario ya no existe.' });
      return comentario(filas[0]);
    },

    async deleteComentario(comentarioId) {
      const filas = await pedir(`/comentarios?id=eq.${enc(comentarioId)}&select=id`, { metodo: 'DELETE', admin: true, devolver: true });
      if (!filas?.length) throw new ApiError('NO_ENCONTRADO', { mensaje: 'El comentario ya no existe.' });
      return undefined;
    },
  });
}
