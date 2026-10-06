/**
 * Error uniforme de la capa de datos. Su forma JSON cumple spec/schemas/error.schema.json
 * y su `status` refleja la respuesta declarada en spec/openapi.yaml.
 */
export const CODIGOS = Object.freeze({
  VALIDACION: { status: 400, mensaje: 'Revisa los campos marcados.' },
  NO_ENCONTRADO: { status: 404, mensaje: 'La publicación solicitada no existe.' },
  ALMACENAMIENTO: { status: 500, mensaje: 'No se pudo guardar o leer la información. Intenta de nuevo.' },
});

export class ApiError extends Error {
  /**
   * @param {'VALIDACION'|'NO_ENCONTRADO'|'ALMACENAMIENTO'} codigo
   * @param {{ detalles?: {campo: string, mensaje: string}[], causa?: unknown, mensaje?: string }} [opciones]
   */
  constructor(codigo, { detalles, causa, mensaje } = {}) {
    const def = CODIGOS[codigo];
    if (!def) throw new Error(`Código de error desconocido: ${codigo}`);
    super(mensaje ?? def.mensaje, causa === undefined ? undefined : { cause: causa });
    this.name = 'ApiError';
    this.codigo = codigo;
    this.status = def.status;
    if (detalles?.length) this.detalles = detalles;
  }

  /** Cuerpo de la respuesta de error, tal como lo define el contrato. */
  toJSON() {
    return { codigo: this.codigo, mensaje: this.message, ...(this.detalles && { detalles: this.detalles }) };
  }
}
