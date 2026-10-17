/**
 * Adaptador de LocalStorage = servidor simulado (Fase 3 de la guía SDD).
 *
 * Implementa las operaciones de spec/openapi.yaml con los mismos operationId.
 * Cada operación es asíncrona (como una llamada HTTP), devuelve copias de los
 * datos y, ante un error, rechaza con un ApiError cuyo status coincide con el
 * contrato (400, 404 o 500).
 *
 * Se usa mientras src/js/config.js no tenga los datos de Supabase (modo
 * prototipo) y en las pruebas. En este modo la administración no pide sesión.
 */
import { ApiError } from './api-error.js';
import { limpiarEntrada, OPCIONALES } from '../lib/normalizar.js';
import { AUTOR_ANONIMO, crearCatalogo, crearValidacion, porFecha } from './catalogo.js';

export { AUTOR_ANONIMO };

export const CLAVES = Object.freeze({
  colaboradores: 'landing.v1.colaboradores',
  comentarios: 'landing.v1.comentarios',
});

/** Campos públicos de un comentario (sin `oculto`). */
const publico = ({ oculto, ...c }) => c;

/**
 * @param {object} opciones
 * @param {Pick<Storage, 'getItem'|'setItem'>} opciones.storage   Normalmente window.localStorage.
 * @param {object[]} opciones.publicaciones                        Semilla de publicaciones (solo lectura).
 * @param {() => Date} [opciones.ahora]                            Reloj (inyectable para pruebas).
 * @param {() => string} [opciones.generarId]                      Generador de UUID (inyectable para pruebas).
 */
export function createLocalStorageAdapter({
  storage,
  publicaciones,
  ahora = () => new Date(),
  generarId = () => crypto.randomUUID(),
}) {
  const { validar, comprobarEntrada, comprobarSalida } = crearValidacion();
  const catalogo = crearCatalogo(publicaciones, validar);

  function leer(clave) {
    let crudo;
    try {
      crudo = storage.getItem(clave);
    } catch (e) {
      throw new ApiError('ALMACENAMIENTO', { causa: e });
    }
    if (crudo === null || crudo === undefined) return [];
    let datos;
    try {
      datos = JSON.parse(crudo);
    } catch (e) {
      throw new ApiError('ALMACENAMIENTO', { causa: e, mensaje: 'Los datos guardados están dañados.' });
    }
    if (!Array.isArray(datos)) throw new ApiError('ALMACENAMIENTO', { mensaje: 'Los datos guardados están dañados.' });
    return datos;
  }

  function escribir(clave, datos) {
    try {
      storage.setItem(clave, JSON.stringify(datos));
    } catch (e) {
      throw new ApiError('ALMACENAMIENTO', { causa: e });
    }
  }

  function indiceComentario(todos, id) {
    const i = todos.findIndex((c) => c.id === id);
    if (i < 0) throw new ApiError('NO_ENCONTRADO', { mensaje: 'El comentario ya no existe.' });
    return i;
  }

  /** Convierte una función síncrona en operación asíncrona que devuelve copias. */
  const operacion = (fn) => async (...args) => structuredClone(fn(...args));

  return Object.freeze({
    modo: 'local',

    /** GET /publicaciones — de la más reciente a la más antigua. */
    listPublicaciones: operacion(() => catalogo.listar()),

    /** GET /publicaciones/{publicacion_id} */
    getPublicacion: operacion((publicacionId) => catalogo.buscar(publicacionId)),

    /** GET /publicaciones/{publicacion_id}/comentarios — visibles, el más antiguo primero. */
    listComentarios: operacion((publicacionId) => {
      catalogo.buscar(publicacionId);
      return leer(CLAVES.comentarios)
        .filter((c) => c.publicacion_id === publicacionId && !c.oculto)
        .sort(porFecha('fecha_creacion', 1))
        .map(publico);
    }),

    /** POST /publicaciones/{publicacion_id}/comentarios — autor vacío → "Anónimo". */
    createComentario: operacion((publicacionId, entrada) => {
      catalogo.buscar(publicacionId);
      const datos = limpiarEntrada(entrada, OPCIONALES.comentario);
      comprobarEntrada('comentario.input.schema.json', datos);
      const comentario = {
        id: generarId(),
        publicacion_id: publicacionId,
        autor: datos.autor ?? AUTOR_ANONIMO,
        contenido: datos.contenido,
        fecha_creacion: ahora().toISOString(),
      };
      comprobarSalida('comentario.schema.json', comentario);
      const todos = leer(CLAVES.comentarios);
      todos.push(comentario);
      escribir(CLAVES.comentarios, todos);
      return comentario;
    }),

    /** GET /colaboradores — del más reciente al más antiguo. */
    listColaboradores: operacion(() => leer(CLAVES.colaboradores).sort(porFecha('fecha_registro', -1))),

    /** POST /colaboradores */
    createColaborador: operacion((entrada) => {
      const datos = limpiarEntrada(entrada, OPCIONALES.colaborador);
      comprobarEntrada('colaborador.input.schema.json', datos);
      const colaborador = { id: generarId(), ...datos, fecha_registro: ahora().toISOString() };
      comprobarSalida('colaborador.schema.json', colaborador);
      const todos = leer(CLAVES.colaboradores);
      todos.push(colaborador);
      escribir(CLAVES.colaboradores, todos);
      return colaborador;
    }),

    /** GET /admin/comentarios — todos, incluidos los ocultos, del más reciente al más antiguo. */
    listComentariosAdmin: operacion(() => leer(CLAVES.comentarios)
      .map((c) => ({ ...c, oculto: c.oculto === true }))
      .sort(porFecha('fecha_creacion', -1))),

    /** PATCH /admin/comentarios/{comentario_id} */
    moderarComentario: operacion((comentarioId, cambios) => {
      comprobarEntrada('comentario.moderacion.schema.json', cambios);
      const todos = leer(CLAVES.comentarios);
      const i = indiceComentario(todos, comentarioId);
      todos[i] = { ...todos[i], oculto: cambios.oculto };
      escribir(CLAVES.comentarios, todos);
      return todos[i];
    }),

    /** DELETE /admin/comentarios/{comentario_id} */
    deleteComentario: operacion((comentarioId) => {
      const todos = leer(CLAVES.comentarios);
      todos.splice(indiceComentario(todos, comentarioId), 1);
      escribir(CLAVES.comentarios, todos);
      return undefined;
    }),
  });
}
