/**
 * Pruebas de contrato: el adaptador LocalStorage cumple spec/openapi.yaml.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalStorageAdapter, CLAVES, AUTOR_ANONIMO } from '../src/js/data/localstorage.adapter.js';
import { ApiError } from '../src/js/data/api-error.js';
import { publicaciones } from '../src/js/data/seed/publicaciones.seed.js';
import { generar, SALIDA } from '../scripts/gen-schemas.mjs';
import { MemoryStorage } from './helpers/memory-storage.js';
import { crearAjv } from './helpers/ajv.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPENAPI = fs.readFileSync(path.join(RAIZ, 'spec/openapi.yaml'), 'utf8');
const ajv = crearAjv();
const PRINCIPAL = publicaciones.find((p) => p.es_principal);
/** Segunda publicación mínima (solo para pruebas) que usa `cuerpo` en lugar de `contenido`. */
const SECUNDARIA = {
  id: 'b4c5d6e7-f809-4a1b-9c2d-3e4f5a6b7c8d', titulo: 'Publicación secundaria de prueba', resumen: 'Resumen.',
  cuerpo: 'Párrafo uno.\n\nPárrafo dos.', autor: 'Pruebas', fecha_publicacion: '2026-09-15T12:00:00.000Z', es_principal: false,
};
const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

/** Afirma que `valor` cumple el esquema según Ajv (referencia independiente del validador propio). */
function cumple(schemaId, valor) {
  const v = ajv.getSchema(schemaId);
  expect(v(valor), JSON.stringify(v.errors)).toBe(true);
}

/** Afirma que la promesa rechaza con un ApiError del código/estado indicado y forma de error válida. */
async function rechazaCon(promesa, codigo, status) {
  const e = await promesa.then(() => null, (err) => err);
  expect(e).toBeInstanceOf(ApiError);
  expect(e.codigo).toBe(codigo);
  expect(e.status).toBe(status);
  cumple('error.schema.json', JSON.parse(JSON.stringify(e)));
  return e;
}

let storage;
let api;
let reloj;

beforeEach(() => {
  storage = new MemoryStorage();
  reloj = Date.parse('2026-09-30T18:00:00.000Z');
  api = createLocalStorageAdapter({
    storage,
    publicaciones,
    ahora: () => new Date((reloj += 1000)), // cada llamada avanza 1 s
  });
});

describe('Sincronía contrato ↔ código (anti-deriva)', () => {
  it('schemas.generated.js coincide con spec/schemas', () => {
    expect(fs.readFileSync(SALIDA, 'utf8').replace(/\r\n/g, '\n')).toBe(generar());
  });

  it('el adaptador expone exactamente los operationId de openapi.yaml', () => {
    const ids = [...OPENAPI.matchAll(/operationId:\s*(\w+)/g)].map((m) => m[1]).sort();
    expect(ids).toHaveLength(6);
    expect(Object.keys(api).sort()).toEqual(ids);
    for (const id of ids) expect(typeof api[id]).toBe('function');
  });

  it('cada código de error del adaptador está declarado en openapi.yaml', () => {
    for (const status of ['400', '404', '500']) expect(OPENAPI).toContain(`'${status}':`);
  });
});

describe('Semilla de publicaciones', () => {
  it('cumple el esquema y tiene exactamente una principal', () => {
    publicaciones.forEach((p) => cumple('publicacion.schema.json', p));
    expect(publicaciones.filter((p) => p.es_principal)).toHaveLength(1);
  });

  it('reglas del contrato 2.0.0: `cuerpo` o `contenido`, e `imagen_alt` si hay imagen', () => {
    const { contenido, ...sinContenido } = PRINCIPAL;
    expect(() => createLocalStorageAdapter({ storage, publicaciones: [sinContenido] })).toThrow(/cuerpo.*contenido/);
    const { imagen_alt, ...sinAlt } = PRINCIPAL;
    expect(() => createLocalStorageAdapter({ storage, publicaciones: [sinAlt] })).toThrow(/imagen_alt/);
    expect(() => createLocalStorageAdapter({ storage, publicaciones: [{ ...PRINCIPAL }, SECUNDARIA] })).not.toThrow();
  });

  it('cada gráfica de la semilla es coherente: un valor por serie y porcentajes ≤ 100', () => {
    const graficas = [...(PRINCIPAL.caratula?.graficas ?? []), ...(PRINCIPAL.contenido ?? []).filter((b) => b.tipo === 'grafica').map((b) => b.grafica)];
    expect(graficas.length).toBeGreaterThan(0);
    for (const g of graficas) {
      const nSeries = g.variante === 'barras-agrupadas' ? g.series.length : 1;
      for (const d of g.datos) {
        expect(d.valores, `${g.titulo} · ${d.etiqueta}`).toHaveLength(nSeries);
        if ((g.unidad ?? '%') === '%') d.valores.forEach((v) => expect(v).toBeLessThanOrEqual(100));
      }
      if (g.variante === 'dona' || g.variante === 'apilada') {
        const suma = g.datos.reduce((s, d) => s + d.valores[0], 0);
        expect(Math.abs(suma - 100), `${g.titulo} suma ${suma}`).toBeLessThanOrEqual(2); // redondeo
      }
    }
  });

  it('el adaptador rechaza semillas inválidas al arrancar', () => {
    const sinPrincipal = publicaciones.map((p) => ({ ...p, es_principal: false }));
    expect(() => createLocalStorageAdapter({ storage, publicaciones: sinPrincipal })).toThrow(/exactamente una/);
    const invalida = [{ ...PRINCIPAL, titulo: '' }];
    expect(() => createLocalStorageAdapter({ storage, publicaciones: invalida })).toThrow(/no cumple el contrato/);
  });
});

describe('listPublicaciones / getPublicacion', () => {
  it('lista publicaciones válidas, de la más reciente a la más antigua', async () => {
    const lista = await api.listPublicaciones();
    lista.forEach((p) => cumple('publicacion.schema.json', p));
    const fechas = lista.map((p) => Date.parse(p.fecha_publicacion));
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  it('obtiene una publicación por id', async () => {
    const p = await api.getPublicacion(PRINCIPAL.id);
    cumple('publicacion.schema.json', p);
    expect(p.id).toBe(PRINCIPAL.id);
  });

  it('id inexistente → NO_ENCONTRADO (404)', async () => {
    await rechazaCon(api.getPublicacion(ID_INEXISTENTE), 'NO_ENCONTRADO', 404);
  });

  it('devuelve copias: modificar el resultado no altera el catálogo', async () => {
    const p = await api.getPublicacion(PRINCIPAL.id);
    p.titulo = 'alterado';
    expect((await api.getPublicacion(PRINCIPAL.id)).titulo).toBe(PRINCIPAL.titulo);
  });
});

describe('createColaborador / listColaboradores', () => {
  it('Escenario BDD 1: registro válido con solo los obligatorios se persiste', async () => {
    const c = await api.createColaborador({ nombre_completo: 'Antonio Machado Ruiz', email: 'ejemplo@banobras.gob.mx' });
    cumple('colaborador.schema.json', c);
    expect(c).toMatchObject({ nombre_completo: 'Antonio Machado Ruiz', email: 'ejemplo@banobras.gob.mx' });
    expect(JSON.parse(storage.getItem(CLAVES.colaboradores))).toEqual([c]);
  });

  it('acepta correos de cualquier dominio y todos los campos opcionales', async () => {
    const c = await api.createColaborador({
      nombre_completo: 'Ana López', email: 'ana@gmail.com', telefono: '5543650920', area_adscripcion: 'Dirección de Crédito',
    });
    cumple('colaborador.schema.json', c);
  });

  it('teléfono con guiones en cualquier posición y comentario o propuesta (contrato 1.1.0)', async () => {
    const c = await api.createColaborador({
      nombre_completo: 'Ana López', email: 'ana@gmail.com', telefono: '55-4365-0920',
      comentario_propuesta: '  Propongo pláticas sobre prestaciones.\n\nGracias.  ',
    });
    cumple('colaborador.schema.json', c);
    expect(c.telefono).toBe('55-4365-0920');
    expect(c.comentario_propuesta).toBe('Propongo pláticas sobre prestaciones.\n\nGracias.');
    const sinComentario = await api.createColaborador({ nombre_completo: 'Luis Pérez', email: 'l@x.mx', comentario_propuesta: '   ' });
    expect(sinComentario).not.toHaveProperty('comentario_propuesta');
    await rechazaCon(api.createColaborador({ nombre_completo: 'Eva Ruiz', email: 'e@x.mx', comentario_propuesta: 'x'.repeat(2001) }), 'VALIDACION', 400);
  });

  it('recorta espacios y omite opcionales vacíos', async () => {
    const c = await api.createColaborador({
      nombre_completo: '  Ana López  ', email: ' ana@gmail.com ', telefono: '   ', area_adscripcion: '',
    });
    expect(c.nombre_completo).toBe('Ana López');
    expect(c.email).toBe('ana@gmail.com');
    expect(c).not.toHaveProperty('telefono');
    expect(c).not.toHaveProperty('area_adscripcion');
  });

  it('datos inválidos → VALIDACION (400) con detalle por campo, sin persistir nada', async () => {
    const e = await rechazaCon(api.createColaborador({ nombre_completo: 'A', email: 'malo', telefono: '123' }), 'VALIDACION', 400);
    expect(e.detalles.map((d) => d.campo).sort()).toEqual(['email', 'nombre_completo', 'telefono']);
    expect(storage.getItem(CLAVES.colaboradores)).toBeNull();
  });

  it('rechaza que el cliente envíe id o fecha_registro (los asigna la capa de datos)', async () => {
    const e = await rechazaCon(
      api.createColaborador({ id: ID_INEXISTENTE, nombre_completo: 'Ana López', email: 'ana@gmail.com' }),
      'VALIDACION', 400,
    );
    expect(e.detalles).toEqual([{ campo: 'id', mensaje: 'Campo no permitido.' }]);
  });

  it('entrada que no es objeto → VALIDACION (400)', async () => {
    await rechazaCon(api.createColaborador(null), 'VALIDACION', 400);
  });

  it('lista del más reciente al más antiguo; asigna ids únicos', async () => {
    const a = await api.createColaborador({ nombre_completo: 'Primero Uno', email: 'a@x.mx' });
    const b = await api.createColaborador({ nombre_completo: 'Segundo Dos', email: 'b@x.mx' });
    const lista = await api.listColaboradores();
    lista.forEach((c) => cumple('colaborador.schema.json', c));
    expect(lista.map((c) => c.id)).toEqual([b.id, a.id]);
    expect(a.id).not.toBe(b.id);
  });

  it('permite registrar el mismo correo más de una vez (decisión 6.3.1 del plan)', async () => {
    const a = await api.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
    const b = await api.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
    expect(a.id).not.toBe(b.id);
    expect(await api.listColaboradores()).toHaveLength(2);
  });

  it('los registros sobreviven a una nueva instancia (recarga de página)', async () => {
    const c = await api.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
    const otra = createLocalStorageAdapter({ storage, publicaciones });
    expect(await otra.listColaboradores()).toEqual([c]);
  });
});

describe('createComentario / listComentarios', () => {
  it('Escenario BDD 2: comentario sin nombre se guarda como "Anónimo"', async () => {
    for (const autor of [undefined, '', '   ']) {
      const c = await api.createComentario(PRINCIPAL.id, { autor, contenido: 'Excelente nota.' });
      cumple('comentario.schema.json', c);
      expect(c.autor).toBe(AUTOR_ANONIMO);
    }
  });

  it('respeta el nombre cuando se proporciona y conserva saltos de línea internos', async () => {
    const c = await api.createComentario(PRINCIPAL.id, { autor: ' María ', contenido: '  Línea 1\n\nLínea 2  ' });
    expect(c.autor).toBe('María');
    expect(c.contenido).toBe('Línea 1\n\nLínea 2');
    expect(c.publicacion_id).toBe(PRINCIPAL.id);
  });

  it('se muestra al instante: aparece en listComentarios, del más antiguo al más reciente', async () => {
    const a = await api.createComentario(PRINCIPAL.id, { contenido: 'Primero' });
    const b = await api.createComentario(PRINCIPAL.id, { contenido: 'Segundo' });
    const lista = await api.listComentarios(PRINCIPAL.id);
    lista.forEach((c) => cumple('comentario.schema.json', c));
    expect(lista.map((c) => c.id)).toEqual([a.id, b.id]);
  });

  it('los comentarios se filtran por publicación', async () => {
    const otra = SECUNDARIA;
    api = createLocalStorageAdapter({ storage, publicaciones: [...publicaciones, SECUNDARIA] });
    await api.createComentario(PRINCIPAL.id, { contenido: 'En la principal' });
    expect(await api.listComentarios(otra.id)).toEqual([]);
  });

  it('contenido vacío, solo espacios o de 2,001 caracteres → VALIDACION (400)', async () => {
    for (const contenido of ['', '    ', 'x'.repeat(2001)]) {
      const e = await rechazaCon(api.createComentario(PRINCIPAL.id, { contenido }), 'VALIDACION', 400);
      expect(e.detalles[0].campo).toBe('contenido');
    }
    expect(storage.getItem(CLAVES.comentarios)).toBeNull();
  });

  it('contenido formado solo por caracteres invisibles → VALIDACION (400)', async () => {
    await rechazaCon(api.createComentario(PRINCIPAL.id, { contenido: '\u200B\u200B\uFEFF' }), 'VALIDACION', 400);
  });

  it('2,000 caracteres sí se aceptan', async () => {
    await expect(api.createComentario(PRINCIPAL.id, { contenido: 'x'.repeat(2000) })).resolves.toBeTruthy();
  });

  it('publicación inexistente → NO_ENCONTRADO (404) al listar y al comentar', async () => {
    await rechazaCon(api.listComentarios(ID_INEXISTENTE), 'NO_ENCONTRADO', 404);
    await rechazaCon(api.createComentario(ID_INEXISTENTE, { contenido: 'Hola' }), 'NO_ENCONTRADO', 404);
  });
});

describe('Fallos de almacenamiento → ALMACENAMIENTO (500)', () => {
  it('LocalStorage lleno al escribir', async () => {
    storage.fallarEn = 'setItem';
    await rechazaCon(api.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' }), 'ALMACENAMIENTO', 500);
  });

  it('LocalStorage bloqueado al leer', async () => {
    storage.fallarEn = 'getItem';
    await rechazaCon(api.listColaboradores(), 'ALMACENAMIENTO', 500);
  });

  it('datos dañados en LocalStorage no se sobrescriben en silencio', async () => {
    storage.setItem(CLAVES.colaboradores, '{no es json');
    await rechazaCon(api.listColaboradores(), 'ALMACENAMIENTO', 500);
    await rechazaCon(api.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' }), 'ALMACENAMIENTO', 500);
    expect(storage.getItem(CLAVES.colaboradores)).toBe('{no es json');
    storage.setItem(CLAVES.comentarios, '{"no":"arreglo"}');
    await rechazaCon(api.listComentarios(PRINCIPAL.id), 'ALMACENAMIENTO', 500);
  });
});
