/**
 * Piezas comunes a todos los adaptadores de datos (LocalStorage y Supabase):
 * catálogo de publicaciones (semilla validada) y validación de entrada/salida.
 */
import { schemas } from '../contract/schemas.generated.js';
import { crearValidador } from '../lib/validator.js';
import { ApiError } from './api-error.js';

export const AUTOR_ANONIMO = 'Anónimo';

export const porFecha = (campo, sentido) => (a, b) => sentido * (Date.parse(a[campo]) - Date.parse(b[campo]));

export function crearValidacion() {
  const validar = crearValidador(schemas);
  return {
    validar,
    /** Entrada del usuario inválida → ApiError VALIDACION (400) con detalle por campo. */
    comprobarEntrada(schemaId, datos) {
      const r = validar(schemaId, datos);
      if (!r.valido) {
        throw new ApiError('VALIDACION', { detalles: r.errores.map(({ campo, mensaje }) => ({ campo: campo || '(datos)', mensaje })) });
      }
    },
    /** Lo que devuelve la capa de datos debe cumplir el contrato; si no, es un error de desarrollo. */
    comprobarSalida(schemaId, entidad) {
      const r = validar(schemaId, entidad);
      if (!r.valido) throw new Error(`Violación de contrato al construir ${schemaId}: ${JSON.stringify(r.errores)}`);
    },
  };
}

/**
 * Valida la semilla de publicaciones (contrato + reglas de negocio) y devuelve
 * un catálogo de solo lectura.
 */
export function crearCatalogo(publicaciones, validar) {
  publicaciones.forEach((p, i) => {
    const r = validar('publicacion.schema.json', p);
    if (!r.valido) throw new Error(`Publicación semilla #${i} no cumple el contrato: ${JSON.stringify(r.errores)}`);
  });
  // Reglas del contrato 2.0.0 que JSON Schema no expresa por sí solo.
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
  return {
    listar: () => structuredClone([...catalogo].sort(porFecha('fecha_publicacion', -1))),
    buscar(id) {
      const p = catalogo.find((x) => x.id === id);
      if (!p) throw new ApiError('NO_ENCONTRADO');
      return structuredClone(p);
    },
  };
}
