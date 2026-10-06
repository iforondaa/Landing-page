/**
 * Validador ligero de JSON Schema 2020-12.
 *
 * Implementa solo el subconjunto que usan los esquemas de spec/schemas:
 * $ref (entre archivos, con puntero JSON), type, enum, required, properties,
 * additionalProperties:false, items, minLength, maxLength, pattern y format
 * (uuid, email, date-time, uri-reference).
 *
 * Las pruebas de contrato comparan este validador contra Ajv (validador de
 * referencia) para garantizar que ambos aceptan y rechazan exactamente lo mismo.
 * Si un esquema empieza a usar una palabra clave no soportada, se lanza un error
 * en lugar de ignorarla en silencio.
 */

const SOPORTADAS = new Set([
  '$schema', '$id', '$ref', 'title', 'description', 'examples', 'default',
  'type', 'enum', 'required', 'properties', 'additionalProperties', 'items',
  'minLength', 'maxLength', 'pattern', 'format',
]);

const RE_UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const RE_EMAIL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const RE_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|[+-](\d{2})(?::?(\d{2}))?)$/;
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function fechaHoraValida(s) {
  const m = RE_FECHA_HORA.exec(s);
  if (!m) return false;
  const [anio, mes, dia, hora, min, seg] = m.slice(1, 7).map(Number);
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasMes = mes === 2 && bisiesto ? 29 : DIAS_POR_MES[mes - 1];
  const tzH = m[7] === undefined ? 0 : Number(m[7]);
  const tzM = m[8] === undefined ? 0 : Number(m[8]);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasMes &&
    hora <= 23 && min <= 59 && seg <= 59 && tzH <= 23 && tzM <= 59;
}

function uriReferenciaValida(s) {
  // RFC 3986: solo ASCII visible; ñ, acentos o espacios deben ir codificados (%C3%B1).
  if (!/^[\x21-\x7e]*$/.test(s) || /[<>"{}|\\^`]/.test(s)) return false;
  if (/%(?![0-9a-f]{2})/i.test(s)) return false;
  try { new URL(s, 'http://base.invalid/'); return true; } catch { return false; }
}

const FORMATOS = {
  uuid: (s) => RE_UUID.test(s),
  email: (s) => RE_EMAIL.test(s),
  'date-time': fechaHoraValida,
  'uri-reference': uriReferenciaValida,
};

/** Mensajes por campo para la regla `pattern` (el patrón no es legible para el usuario). */
const MENSAJES_PATRON = {
  telefono: 'Escribe 10 dígitos; puedes separarlos con guiones, ej. 55-4365-0920.',
};

const MENSAJES_FORMATO = {
  email: 'Escribe un correo válido, ej. nombre@dominio.com.',
  uuid: 'Identificador no válido.',
  'date-time': 'Fecha y hora no válidas.',
  'uri-reference': 'Dirección no válida.',
};

function nombreCampo(ruta) {
  const partes = ruta.split('.');
  return partes[partes.length - 1].replace(/\[\d+\]$/, '');
}

function mensaje(regla, ruta, param) {
  switch (regla) {
    case 'required': return 'Este campo es obligatorio.';
    case 'minLength': return param <= 1 ? 'Este campo es obligatorio.' : `Debe tener al menos ${param} caracteres.`;
    case 'maxLength': return `No debe exceder ${param} caracteres.`;
    case 'pattern': return MENSAJES_PATRON[nombreCampo(ruta)] ?? 'Formato no válido.';
    case 'format': return MENSAJES_FORMATO[param] ?? 'Formato no válido.';
    case 'additionalProperties': return 'Campo no permitido.';
    case 'enum': return 'Valor no permitido.';
    default: return 'Tipo de dato no válido.';
  }
}

function tipoCorrecto(tipo, valor) {
  switch (tipo) {
    case 'string': return typeof valor === 'string';
    case 'boolean': return typeof valor === 'boolean';
    case 'number': return typeof valor === 'number' && Number.isFinite(valor);
    case 'integer': return Number.isInteger(valor);
    case 'array': return Array.isArray(valor);
    case 'object': return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
    case 'null': return valor === null;
    default: throw new Error(`Tipo de JSON Schema no soportado: ${tipo}`);
  }
}

const unir = (ruta, clave) => (ruta ? `${ruta}.${clave}` : clave);

/**
 * @param {Record<string, object>} schemas  Mapa $id → esquema (ver schemas.generated.js).
 * @returns {(schemaId: string, valor: unknown) => { valido: boolean, errores: {campo: string, regla: string, mensaje: string}[] }}
 */
export function crearValidador(schemas) {
  const registro = new Map(Object.values(schemas).map((s) => [s.$id, s]));
  const regexCache = new Map();

  function resolver(ref, baseId) {
    const [archivo, puntero = ''] = ref.split('#');
    const id = archivo || baseId;
    let nodo = registro.get(id);
    for (const parte of puntero.split('/').filter(Boolean)) {
      nodo = nodo?.[decodeURIComponent(parte).replace(/~1/g, '/').replace(/~0/g, '~')];
    }
    if (nodo === undefined) throw new Error(`$ref no resuelto: "${ref}" (desde ${baseId})`);
    return { nodo, baseId: id };
  }

  function regex(patron) {
    if (!regexCache.has(patron)) regexCache.set(patron, new RegExp(patron, 'u'));
    return regexCache.get(patron);
  }

  function validarNodo(schema, valor, ruta, baseId, errores) {
    for (const clave of Object.keys(schema)) {
      if (!SOPORTADAS.has(clave)) throw new Error(`Palabra clave no soportada por el validador: "${clave}"`);
    }
    const agregar = (regla, param, campo = ruta) =>
      errores.push({ campo, regla, mensaje: mensaje(regla, campo, param) });

    if (schema.$ref) {
      const r = resolver(schema.$ref, baseId);
      validarNodo(r.nodo, valor, ruta, r.baseId, errores);
    }
    if (schema.type && !tipoCorrecto(schema.type, valor)) {
      agregar('type', schema.type);
      return;
    }
    if (schema.enum && !schema.enum.includes(valor)) agregar('enum');

    if (typeof valor === 'string') {
      const inicio = errores.length;
      const largo = [...valor].length; // cuenta caracteres Unicode, como JSON Schema
      if (schema.minLength !== undefined && largo < schema.minLength) agregar('minLength', schema.minLength);
      if (schema.maxLength !== undefined && largo > schema.maxLength) agregar('maxLength', schema.maxLength);
      if (schema.pattern && !regex(schema.pattern).test(valor)) agregar('pattern');
      if (schema.format) {
        const comprobar = FORMATOS[schema.format];
        if (!comprobar) throw new Error(`Formato no soportado: ${schema.format}`);
        if (!comprobar(valor)) agregar('format', schema.format);
      }
      // Un texto vacío que no pasa las reglas se explica como "obligatorio", no como formato o longitud.
      if (valor === '') for (let i = inicio; i < errores.length; i++) errores[i].mensaje = mensaje('required');
    }

    if (Array.isArray(valor) && schema.items) {
      valor.forEach((item, i) => validarNodo(schema.items, item, `${ruta}[${i}]`, baseId, errores));
    }

    if (tipoCorrecto('object', valor)) {
      for (const req of schema.required ?? []) {
        if (!Object.hasOwn(valor, req)) agregar('required', undefined, unir(ruta, req));
      }
      const props = schema.properties ?? {};
      for (const [clave, sub] of Object.entries(props)) {
        if (Object.hasOwn(valor, clave)) validarNodo(sub, valor[clave], unir(ruta, clave), baseId, errores);
      }
      if (schema.additionalProperties === false) {
        for (const clave of Object.keys(valor)) {
          if (!Object.hasOwn(props, clave)) agregar('additionalProperties', undefined, unir(ruta, clave));
        }
      }
    }
  }

  return function validar(schemaId, valor) {
    const schema = registro.get(schemaId);
    if (!schema) throw new Error(`Esquema desconocido: ${schemaId}`);
    const errores = [];
    validarNodo(schema, valor, '', schemaId, errores);
    return { valido: errores.length === 0, errores };
  };
}

/**
 * Restricciones de un campo de primer nivel, siguiendo $ref. Sirve para derivar
 * atributos HTML (maxlength, aria-required) directamente del contrato.
 * @returns {{ requerido: boolean, maxLength?: number, minLength?: number }}
 */
export function restriccionesDeCampo(schemas, schemaId, campo) {
  const raiz = schemas[schemaId];
  if (!raiz?.properties?.[campo]) throw new Error(`El campo "${campo}" no existe en ${schemaId}`);
  let nodo = raiz.properties[campo];
  let base = schemaId;
  const vistos = new Set();
  while (nodo.$ref) {
    if (vistos.has(nodo.$ref)) throw new Error(`$ref circular: ${nodo.$ref}`);
    vistos.add(nodo.$ref);
    const [archivo, puntero = ''] = nodo.$ref.split('#');
    base = archivo || base;
    nodo = puntero.split('/').filter(Boolean).reduce((n, p) => n?.[p], schemas[base]);
    if (!nodo) throw new Error(`$ref no resuelto en ${schemaId}.${campo}`);
  }
  return {
    requerido: (raiz.required ?? []).includes(campo),
    ...(nodo.maxLength !== undefined && { maxLength: nodo.maxLength }),
    ...(nodo.minLength !== undefined && { minLength: nodo.minLength }),
  };
}
