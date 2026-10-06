import { describe, it, expect } from 'vitest';
import { aCSV, celda, nombreArchivo } from '../src/js/lib/csv.js';
import { schemas } from '../src/js/contract/schemas.generated.js';

const COLS = Object.keys(schemas['colaborador.schema.json'].properties);

/** Lector CSV mínimo (RFC 4180) para comprobar que lo generado se puede leer de vuelta. */
function leerCSV(texto) {
  const filas = []; let fila = []; let campo = ''; let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ',') { fila.push(campo); campo = ''; }
    else if (ch === '\r' && texto[i + 1] === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; i++; }
    else campo += ch;
  }
  return filas;
}

describe('CSV de colaboradores (spec 6.4)', () => {
  it('UTF-8 con BOM, encabezado en el orden del esquema y CRLF', () => {
    const csv = aCSV([], COLS);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿"id","nombre_completo","email","telefono","area_adscripcion","comentario_propuesta","fecha_registro"\r\n');
  });

  it('opcionales ausentes quedan como celdas vacías', () => {
    const csv = aCSV([{ id: '1', nombre_completo: 'Ana', email: 'a@b.mx', fecha_registro: '2026-10-01T00:00:00.000Z' }], COLS);
    expect(leerCSV(csv.slice(1))[1]).toEqual(['1', 'Ana', 'a@b.mx', '', '', '', '2026-10-01T00:00:00.000Z']);
  });

  it('comillas, comas, saltos de línea y acentos sobreviven ida y vuelta', () => {
    const r = { id: '1', nombre_completo: 'José "Pepe" Muñoz, Jr.', email: 'a@b.mx', area_adscripcion: 'Línea 1\nLínea 2', fecha_registro: 'x' };
    const [, fila] = leerCSV(aCSV([r], COLS).slice(1));
    expect(fila[1]).toBe('José "Pepe" Muñoz, Jr.');
    expect(fila[4]).toBe('Línea 1\nLínea 2');
  });

  it.each(['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tx', '\rx'])(
    'neutraliza fórmulas: %j', (v) => {
      expect(celda(v).startsWith(`"'`)).toBe(true);
    });

  it('no altera valores normales', () => {
    expect(celda('554-365-0920')).toBe('"554-365-0920"');
    expect(celda('Ana')).toBe('"Ana"');
    expect(celda(undefined)).toBe('""');
  });

  it('nombre de archivo con la fecha de la Ciudad de México', () => {
    expect(nombreArchivo('colaboradores', new Date('2026-10-01T12:00:00Z'))).toBe('colaboradores_2026-10-01.csv');
    // 01:00 UTC del 2 de octubre = 19:00 del 1 de octubre en CDMX
    expect(nombreArchivo('colaboradores', new Date('2026-10-02T01:00:00Z'))).toBe('colaboradores_2026-10-01.csv');
  });
});
