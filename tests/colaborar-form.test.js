/** El formulario se deriva del contrato: mismos campos, misma obligatoriedad y límites. */
import { describe, it, expect } from 'vitest';
import { CAMPOS } from '../src/js/components/colaborar-form.js';
import { restriccionesDeCampo } from '../src/js/lib/validator.js';
import { limpiarEntrada, recortar, OPCIONALES } from '../src/js/lib/normalizar.js';
import { schemas } from '../src/js/contract/schemas.generated.js';

const ID = 'colaborador.input.schema.json';

describe('Formulario "Quiero colaborar" ↔ contrato', () => {
  it('tiene exactamente los campos de colaborador.input.schema.json, en el mismo orden', () => {
    expect(CAMPOS.map((c) => c.nombre)).toEqual(Object.keys(schemas[ID].properties));
  });

  it('los opcionales de la limpieza coinciden con los no requeridos del esquema', () => {
    const noRequeridos = Object.keys(schemas[ID].properties).filter((p) => !schemas[ID].required.includes(p));
    expect([...OPCIONALES.colaborador].sort()).toEqual(noRequeridos.sort());
  });

  it('usa los placeholders de la especificación', () => {
    expect(Object.fromEntries(CAMPOS.map((c) => [c.nombre, c.placeholder]))).toEqual({
      nombre_completo: 'ej. Antonio Machado Ruiz',
      email: 'ejemplo@banobras.gob.mx',
      telefono: 'ej. 554-365-0920',
      area_adscripcion: 'ej. Dirección de Crédito',
      comentario_propuesta: 'ej. Me gustaría proponer pláticas sobre prestaciones laborales.',
    });
  });

  it('"Comentario o propuesta" es opcional, de 2,000 caracteres y se muestra como área de texto', () => {
    expect(restriccionesDeCampo(schemas, ID, 'comentario_propuesta')).toEqual({ requerido: false, maxLength: 2000, minLength: 1 });
    const campo = CAMPOS.find((c) => c.nombre === 'comentario_propuesta');
    expect(campo).toMatchObject({ etiqueta: 'Comentario o propuesta', control: 'textarea', contador: true });
    expect(Number(campo.attrs.rows)).toBeGreaterThan(1);
  });

  it('deriva obligatoriedad y longitudes siguiendo $ref entre archivos', () => {
    expect(restriccionesDeCampo(schemas, ID, 'nombre_completo')).toEqual({ requerido: true, maxLength: 120, minLength: 2 });
    expect(restriccionesDeCampo(schemas, ID, 'email')).toEqual({ requerido: true, maxLength: 254 });
    expect(restriccionesDeCampo(schemas, ID, 'telefono')).toEqual({ requerido: false });
    expect(restriccionesDeCampo(schemas, ID, 'area_adscripcion')).toEqual({ requerido: false, maxLength: 120, minLength: 1 });
    expect(() => restriccionesDeCampo(schemas, ID, 'no_existe')).toThrow(/no existe/);
  });

  it('recortar quita espacios e invisibles solo de los extremos', () => {
    expect(recortar('\u200B\uFEFF  Ana López \u2060')).toBe('Ana López');
    expect(recortar('\u200B\u200B')).toBe('');
    expect(recortar('Ana\u200BLópez')).toBe('Ana\u200BLópez'); // en medio se respeta
  });

  it('limpiarEntrada recorta y omite opcionales vacíos', () => {
    expect(limpiarEntrada({ nombre_completo: ' Ana ', telefono: '  ', area_adscripcion: '' }, OPCIONALES.colaborador))
      .toEqual({ nombre_completo: 'Ana' });
  });
});
