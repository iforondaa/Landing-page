/** Texto enriquecido (**negritas**). */
import { describe, it, expect } from 'vitest';

// textoEnriquecido usa document.createElement: se prueba con un "document" mínimo.
globalThis.document ??= {
  createElement: (tag) => {
    const el = { tag, hijos: [], setAttribute() {}, append(...n) { this.hijos.push(...n); } };
    return el;
  },
};
globalThis.Node ??= class {};
const { textoEnriquecido } = await import('../src/js/lib/texto.js');

describe('textoEnriquecido', () => {
  const plano = (nodos) => nodos.map((n) => (typeof n === 'string' ? n : `<${n.tag}>${n.hijos.join('')}</${n.tag}>`)).join('');
  it('convierte **negritas** en <strong> y conserva el resto como texto', () => {
    expect(plano(textoEnriquecido('Hola **mundo** y **más**.'))).toBe('Hola <strong>mundo</strong> y <strong>más</strong>.');
  });
  it('no interpreta HTML: las etiquetas quedan como texto', () => {
    const nodos = textoEnriquecido('<img src=x onerror=alert(1)> **ok**');
    expect(nodos[0]).toBe('<img src=x onerror=alert(1)> ');
    expect(nodos[1].tag).toBe('strong');
  });
  it('asteriscos sueltos no rompen el texto', () => {
    expect(plano(textoEnriquecido('5 * 3 = 15 **'))).toBe('5 * 3 = 15 **');
  });
});
