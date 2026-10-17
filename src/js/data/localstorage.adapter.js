/**
 * Adaptador de LocalStorage = servidor simulado (Fase 3 de la guía SDD).
 *
 * Implementa las operaciones de spec/openapi.yaml con los mismos operationId.
 * Cada operación es asíncrona (como una llamada HTTP), devuelve copias de los
 * datos y, ante un error, rechaza con un ApiError cuyo status coincide con el
 * contrato (400, 404 o 500).
 *
 * En V2 se reemplaza por un adaptador HTTP con la misma interfaz.
 */
import { schemas } from '../contract/schemas.generated.js';
import { crearValidador } from '../lib/validator.js';
import { ApiError } from './api-error.js';
import { limpiarEntrada, OPCIONALES } from '../lib/normalizar.js';

export const CLAVES = Object.freeze({
  colaboradores: 'landing.v1.colaboradores',
  comentarios: 'landing.v1.comentarios',
});
export const AUTOR_ANONIMO = 'Anónimo';

const porFecha = (campo, sentido) => (a, b) => sentido * (Date.parse(a[campo]) - Date.parse(b[campo]));

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
  const validar = crearValidador(schemas);

  // La semilla también debe cumplir el contrato; si no, es un error de desarrollo.
  publicaciones.forEach((p, i) => {
    const r = validar('publicacion.schema.json', p);
    if (!r.valido) throw new Error(`Publicación semilla #${i} no cumple el contrato: ${JSON.stringify(r.errores)}`);
  });
  // Reglas de negocio del contrato 2.0.0 que JSON Schema no expresa por sí solo.
  publicaciones.forEach((p, i) => {
    if (!p.cuerpo && !p.contenido?.length) throw new Error(`Publicación semilla #${i}: debe tener \`cuerpo\` o \`contenido\`.`);
    if (p.imagen_url && !p.imagen_alt) throw new Error(`Publicación semilla #${i}: \`imagen_alt\` es obligatorio cuando hay \`imagen_url\`.`);
  });
  if (publicaciones.filter((p) => p.es_principal).length !== 1) {
    throw new Error('La semilla debe tener exactamente una publicación con es_principal = true.');
  }
  if (new Set(publicaciones.map((p) => p.id)).size !== publicaciones.length) {
    throw new Error('La semilla tiene publicaciones con id repetido.');
  }
  const catalogo = structuredClone(publicaciones);

  function comprobarEntrada(schemaId, datos) {
    const r = validar(schemaId, datos);
    if (!r.valido) {
      throw new ApiError('VALIDACION', { detalles: r.errores.map(({ campo, mensaje }) => ({ campo: campo || '(datos)', mensaje })) });
    }
  }

  function comprobarSalida(schemaId, entidad) {
    const r = validar(schemaId, entidad);
    if (!r.valido) throw new Error(`Violación de contrato al construir ${schemaId}: ${JSON.stringify(r.errores)}`);
  }

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

  function buscarPublicacion(id) {
    const p = catalogo.find((x) => x.id === id);
    if (!p) throw new ApiError('NO_ENCONTRADO');
    return p;
  }

  /** Convierte una función síncrona en operación asíncrona que devuelve copias. */
  const operacion = (fn) => async (...args) => structuredClone(fn(...args));

  return Object.freeze({
    /** GET /publicaciones — de la más reciente a la más antigua. */
    listPublicaciones: operacion(() => [...catalogo].sort(porFecha('fecha_publicacion', -1))),

    /** GET /publicaciones/{publicacion_id} */
    getPublicacion: operacion((publicacionId) => buscarPublicacion(publicacionId)),

    /** GET /publicaciones/{publicacion_id}/comentarios — el más antiguo primero. */
    listComentarios: operacion((publicacionId) => {
      buscarPublicacion(publicacionId);
      return leer(CLAVES.comentarios)
        .filter((c) => c.publicacion_id === publicacionId)
        .sort(porFecha('fecha_creacion', 1));
    }),

    /** POST /publicaciones/{publicacion_id}/comentarios — autor vacío → "Anónimo". */
    createComentario: operacion((publicacionId, entrada) => {
      buscarPublicacion(publicacionId);
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
      const colaborador = {
        id: generarId(), ...datos,
        fecha_registro: ahora().toISOString(),
      };
      comprobarSalida('colaborador.schema.json', colaborador);
      const todos = leer(CLAVES.colaboradores);
      todos.push(colaborador);
      escribir(CLAVES.colaboradores, todos);
      return colaborador;
    }),
  });
}
