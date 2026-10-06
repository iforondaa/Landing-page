/** El nombre y el lema del sitio viven en un solo lugar (src/js/identidad.js). */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDENTIDAD } from '../src/js/identidad.js';

const HTML = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/index.html'), 'utf8');

describe('Identidad del sitio', () => {
  it('nombre y lema vigentes', () => {
    expect(IDENTIDAD.nombre).toBe('Manos a la obra');
    expect(IDENTIDAD.lema).toBe('Información · diálogo · participación');
  });

  it('el texto de respaldo de index.html coincide con identidad.js (anti-deriva)', () => {
    for (const [clave, texto] of Object.entries(IDENTIDAD)) {
      const marcas = [...HTML.matchAll(new RegExp(`data-identidad="${clave}">([^<]*)<`, 'g'))].map((m) => m[1]);
      expect(marcas.length, `elementos data-identidad="${clave}"`).toBeGreaterThan(0);
      for (const m of marcas) expect(m).toBe(texto);
    }
    expect(HTML).toContain(`<title>${IDENTIDAD.nombre}</title>`);
    expect(HTML).toContain(`aria-label="${IDENTIDAD.nombre}, ir al inicio"`);
  });
});
