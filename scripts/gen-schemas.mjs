/**
 * Generador de esquemas para el navegador (Fase 4 de la guía SDD, versión mínima).
 *
 * Lee spec/schemas/*.schema.json (fuente única de verdad) y escribe
 * src/js/contract/schemas.generated.js para que el código del navegador
 * los importe sin paso de build y sin depender de rutas fuera de src/.
 *
 *   node scripts/gen-schemas.mjs           → regenera el archivo
 *   node scripts/gen-schemas.mjs --check   → falla si el archivo está desfasado
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR_SCHEMAS = path.join(RAIZ, 'spec', 'schemas');
export const SALIDA = path.join(RAIZ, 'src', 'js', 'contract', 'schemas.generated.js');

export function generar() {
  const archivos = fs.readdirSync(DIR_SCHEMAS).filter((f) => f.endsWith('.schema.json')).sort();
  const schemas = {};
  for (const archivo of archivos) {
    const schema = JSON.parse(fs.readFileSync(path.join(DIR_SCHEMAS, archivo), 'utf8'));
    if (schema.$id !== archivo) {
      throw new Error(`El $id de ${archivo} debe ser igual al nombre del archivo (encontrado: ${schema.$id}).`);
    }
    schemas[schema.$id] = schema;
  }
  return [
    '// ARCHIVO GENERADO — NO EDITAR A MANO.',
    '// Fuente: spec/schemas/*.schema.json · Regenerar con: npm run gen:schemas',
    '',
    `export const schemas = ${JSON.stringify(schemas, null, 2)};`,
    '',
  ].join('\n');
}

const esEjecucionDirecta = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esEjecucionDirecta) {
  const contenido = generar();
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, 'utf8').replace(/\r\n/g, '\n') : '';
    if (actual !== contenido) {
      console.error('✖ schemas.generated.js está desfasado respecto a spec/schemas. Ejecuta: npm run gen:schemas');
      process.exit(1);
    }
    console.log('✔ schemas.generated.js está sincronizado con spec/schemas.');
  } else {
    fs.writeFileSync(SALIDA, contenido);
    console.log(`✔ Generado ${path.relative(RAIZ, SALIDA)}`);
  }
}
