/**
 * Prueba diferencial: el validador propio debe aceptar y rechazar EXACTAMENTE
 * lo mismo que Ajv, y señalar los mismos campos, para cada esquema del contrato.
 */
import { describe, it, expect } from 'vitest';
import { crearValidador } from '../src/js/lib/validator.js';
import { schemas } from '../src/js/contract/schemas.generated.js';
import { crearAjv, campoAjv, cargarSchemasSpec } from './helpers/ajv.js';

const ajv = crearAjv();
const validar = crearValidador(schemas);

// Valores con los que se sustituye cada propiedad del ejemplo de cada esquema.
const VARIANTES = [
  undefined, null, true, 0, 42, [], {}, '', ' ', 'a', 'ab', ' ab', 'ab ', 'Ana López',
  'x'.repeat(119), 'x'.repeat(120), 'x'.repeat(121), 'x'.repeat(200), 'x'.repeat(201),
  'x'.repeat(254), 'x'.repeat(255), 'x'.repeat(400), 'x'.repeat(401), 'x'.repeat(2000), 'x'.repeat(2001),
  '😀'.repeat(120), '😀'.repeat(121), 'ñ'.repeat(2000), 'línea 1\n\nlínea 2', '\nhola', 'hola\n',
  'ejemplo@banobras.gob.mx', 'ana@gmail.com', 'a@b', 'a@b.c', 'sin-arroba', 'a@@b.mx', 'a b@c.mx', 'a@b..mx', '.a@b.mx', 'a@-b.mx',
  '554-365-0920', '5543650920', '554-3650920', '554 365 0920', '55436509201', '554-365-092', '(55) 4365-0920', 'abc-def-ghij',
  '3f6c2a1e-8b4d-4c2a-9e1f-5a7b8c9d0e1f', '3F6C2A1E-8B4D-4C2A-9E1F-5A7B8C9D0E1F', 'urn:uuid:3f6c2a1e-8b4d-4c2a-9e1f-5a7b8c9d0e1f',
  '3f6c2a1e8b4d4c2a9e1f5a7b8c9d0e1f', 'no-es-uuid',
  '2026-09-30T18:00:00.000Z', '2026-09-30T18:00:00Z', '2026-09-30t18:00:00z', '2026-09-30 18:00:00Z', '2026-09-30T18:00:00-06:00',
  '2026-09-30T18:00:00', '2026-09-30', '2026-02-29T00:00:00Z', '2024-02-29T00:00:00Z', '2026-13-01T00:00:00Z', '2026-09-31T00:00:00Z',
  '2026-09-30T24:00:00Z', '2026-09-30T18:60:00Z',
  'assets/img/a.jpg', 'https://www.ejemplo.mx/img/a.png', '/img/a.png', '../a.png', 'con espacio.jpg', 'a<b>.png',
  'VALIDACION', 'NO_ENCONTRADO', 'OTRO', [{ campo: 'email', mensaje: 'x' }], [{ campo: 'email' }], [{ campo: 1, mensaje: 'x' }],
];

function casos() {
  const lista = [];
  for (const [id, schema] of Object.entries(cargarSchemasSpec())) {
    for (const ejemplo of schema.examples ?? []) {
      lista.push([id, 'ejemplo', ejemplo]);
      lista.push([id, 'con propiedad extra', { ...ejemplo, extra: 1 }]);
      lista.push([id, 'objeto vacío', {}]);
      lista.push([id, 'no es objeto', 'texto']);
      for (const prop of Object.keys(schema.properties ?? {})) {
        VARIANTES.forEach((v, i) => {
          const caso = { ...ejemplo };
          if (v === undefined) delete caso[prop]; else caso[prop] = v;
          lista.push([id, `${prop} = variante #${i}`, caso]);
        });
      }
    }
  }
  return lista;
}

const CASOS = casos();

describe('Validador propio vs Ajv (referencia)', () => {
  it(`genera un corpus amplio (${CASOS.length} casos)`, () => {
    expect(CASOS.length).toBeGreaterThan(1000);
  });

  it.each(CASOS)('%s · %s', (id, _desc, dato) => {
    const ref = ajv.getSchema(id);
    const esperado = ref(dato);
    const camposEsperados = [...new Set((ref.errors ?? []).map(campoAjv))].sort();
    const obtenido = validar(id, dato);
    expect(obtenido.valido).toBe(esperado);
    expect([...new Set(obtenido.errores.map((e) => e.campo))].sort()).toEqual(camposEsperados);
  });
});

describe('Mensajes para el usuario', () => {
  const msj = (dato) => Object.fromEntries(validar('colaborador.input.schema.json', dato).errores.map((e) => [e.campo, e.mensaje]));

  it('explica cada error en español', () => {
    expect(msj({ email: 'malo' })).toEqual({
      nombre_completo: 'Este campo es obligatorio.',
      email: 'Escribe un correo válido, ej. nombre@dominio.com.',
    });
    expect(msj({ nombre_completo: 'A', email: 'a@b.mx', telefono: '123' })).toEqual({
      nombre_completo: 'Debe tener al menos 2 caracteres.',
      telefono: 'Escribe 10 dígitos; puedes separarlos con guiones, ej. 55-4365-0920.',
    });
    expect(msj({ nombre_completo: 'x'.repeat(121), email: 'a@b.mx' })).toEqual({
      nombre_completo: 'No debe exceder 120 caracteres.',
    });
  });

  it('un campo obligatorio enviado vacío dice "obligatorio", no formato ni longitud', () => {
    expect(msj({ nombre_completo: '', email: '' })).toEqual({
      nombre_completo: 'Este campo es obligatorio.',
      email: 'Este campo es obligatorio.',
    });
  });

  it.each([
    ['5543650920', true], ['554-365-0920', true], ['55-4365-0920', true], ['55-43-65-09-20', true], ['5-5-4-3-6-5-0-9-2-0', true],
    ['-5543650920', false], ['5543650920-', false], ['55--4365-0920', false], ['554365092', false], ['55436509201', false],
    ['55 4365 0920', false], ['(55) 4365-0920', false],
  ])('teléfono %j → %s (10 dígitos, guiones entre dígitos en cualquier posición)', (tel, valido) => {
    expect(validar('colaborador.input.schema.json', { nombre_completo: 'Ana López', email: 'a@b.mx', telefono: tel }).valido).toBe(valido);
  });

  it('falla de forma explícita ante palabras clave no soportadas', () => {
    const v = crearValidador({ 'x.json': { $id: 'x.json', type: 'number', minimum: 1 } });
    expect(() => v('x.json', 0)).toThrow(/no soportada/);
  });
});
