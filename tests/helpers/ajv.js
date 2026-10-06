/** Ajv (validador de referencia de JSON Schema 2020-12) cargado con spec/schemas. */
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIR_SCHEMAS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../spec/schemas');

export function cargarSchemasSpec() {
  return Object.fromEntries(
    fs.readdirSync(DIR_SCHEMAS)
      .filter((f) => f.endsWith('.schema.json'))
      .map((f) => [f, JSON.parse(fs.readFileSync(path.join(DIR_SCHEMAS, f), 'utf8'))]),
  );
}

export function crearAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const s of Object.values(cargarSchemasSpec())) ajv.addSchema(s);
  return ajv;
}

/** Convierte un error de Ajv al formato de campo del validador propio (ej. "detalles[0].campo"). */
export function campoAjv(e) {
  let ptr = e.instancePath;
  if (e.keyword === 'required') ptr += `/${e.params.missingProperty}`;
  if (e.keyword === 'additionalProperties') ptr += `/${e.params.additionalProperty}`;
  return ptr.split('/').filter(Boolean)
    .reduce((acc, p) => (/^\d+$/.test(p) ? `${acc}[${p}]` : acc ? `${acc}.${p}` : p), '');
}
