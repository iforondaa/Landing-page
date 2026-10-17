/**
 * Integración: adaptador de Supabase ↔ PostgREST ↔ Postgres con supabase/esquema.sql.
 * Comprueba que las REGLAS DE LA BASE (no solo el navegador) protegen los datos.
 *
 * Se ejecuta solo si existe SUPABASE_PRUEBA_URL (ver scripts/supabase-local.sh):
 *   eval "$(bash scripts/supabase-local.sh iniciar)" && export SUPABASE_PRUEBA_URL SUPABASE_PRUEBA_SECRETO SUPABASE_PRUEBA_PG
 *   npx vitest run tests/integracion
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createSupabaseAdapter } from '../../src/js/data/supabase.adapter.js';
import { publicaciones } from '../../src/js/data/seed/publicaciones.seed.js';
import { crearAjv } from '../helpers/ajv.js';

const { SUPABASE_PRUEBA_URL: REST, SUPABASE_PRUEBA_SECRETO: SECRETO, SUPABASE_PRUEBA_PG: PG } = process.env;
const PRINCIPAL = publicaciones.find((p) => p.es_principal);
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const OTRO_ID = '22222222-2222-4222-8222-222222222222';
const ajv = crearAjv();
const cumple = (id, v) => expect(ajv.getSchema(id)(v), JSON.stringify(ajv.getSchema(id).errors)).toBe(true);

const sql = (consulta) => execFileSync('psql', [PG, '-v', 'ON_ERROR_STOP=1', '-qtAc', consulta], { encoding: 'utf8' }).trim();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(sub) {
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 600 })}`;
  return `${cuerpo}.${crypto.createHmac('sha256', SECRETO).update(cuerpo).digest('base64url')}`;
}

/** El adaptador apunta a /rest/v1; PostgREST local sirve en la raíz: se reescribe la ruta. */
const fetchLocal = (url, init) => fetch(String(url).replace(/^https:\/\/local\.supabase\/rest\/v1/, REST), init);
const crear = (token = null) => createSupabaseAdapter({ url: 'https://local.supabase', clave: 'sb_publishable_prueba', publicaciones, fetch: fetchLocal, obtenerToken: async () => token });
/** Llamada directa a la API (como haría alguien que se salta la página). */
const directo = (ruta, { metodo = 'GET', cuerpo, token } = {}) => fetch(`${REST}${ruta}`, {
  method: metodo, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), Prefer: 'return=representation' },
  body: cuerpo && JSON.stringify(cuerpo),
});

describe.skipIf(!REST)('Supabase real (Postgres + PostgREST + supabase/esquema.sql)', () => {
  let publico; let admin; let otro;
  beforeAll(() => {
    sql(`insert into auth.users (id, email) values ('${ADMIN_ID}', 'admin@x.mx'), ('${OTRO_ID}', 'otro@x.mx') on conflict do nothing;
         insert into public.administradores (user_id) values ('${ADMIN_ID}') on conflict do nothing;`);
  });
  beforeEach(() => {
    sql('truncate public.colaboradores, public.comentarios;');
    publico = crear();
    admin = crear(jwt(ADMIN_ID));
    otro = crear(jwt(OTRO_ID)); // cuenta que inició sesión pero NO es administradora
  });

  it('Escenario 1: el público registra un colaborador; id y fecha los pone la base', async () => {
    const c = await publico.createColaborador({ nombre_completo: 'Antonio Machado Ruiz', email: 'ejemplo@banobras.gob.mx', telefono: '554-365-0920' });
    cumple('colaborador.schema.json', c);
    expect(c).toMatchObject({ nombre_completo: 'Antonio Machado Ruiz', telefono: '554-365-0920' });
    expect(sql('select count(*) from public.colaboradores')).toBe('1');
  });

  it('el público NO puede leer, cambiar ni borrar registros de colaboradores', async () => {
    await publico.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
    await expect(publico.listColaboradores()).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
    for (const [ruta, metodo, cuerpo] of [['/colaboradores', 'GET'], ['/colaboradores', 'POST', { nombre_completo: 'X Y', email: 'x@y.mx' }], ['/colaboradores?id=not.is.null', 'PATCH', { email: 'z@z.mx' }], ['/colaboradores?id=not.is.null', 'DELETE']]) {
      const r = await directo(ruta, { metodo, cuerpo });
      expect(r.status, `${metodo} ${ruta}`).toBeGreaterThanOrEqual(401);
    }
    expect(sql('select email from public.colaboradores')).toBe('ana@gmail.com');
  });

  it('una cuenta sin permiso de administración tampoco ve los registros', async () => {
    await publico.createColaborador({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
    expect(await otro.listColaboradores()).toEqual([]);
    expect((await admin.listColaboradores()).map((c) => c.email)).toEqual(['ana@gmail.com']);
  });

  it('la base rechaza datos fuera del contrato aunque se salte la validación del navegador', async () => {
    const malos = [
      { nombre_completo: 'A', email: 'ana@gmail.com' },
      { nombre_completo: 'Ana López', email: 'no-es-correo' },
      { nombre_completo: 'Ana López', email: 'ana@gmail.com', telefono: '55 4365 0920' },
      { nombre_completo: 'Ana López', email: 'ana@gmail.com', comentario_propuesta: 'x'.repeat(2001) },
      { nombre_completo: ' Ana', email: 'ana@gmail.com' },
    ];
    for (const cuerpo of malos) {
      const r = await directo('/rpc/registrar_colaborador', { metodo: 'POST', cuerpo });
      expect(r.status, JSON.stringify(cuerpo)).toBe(400);
    }
    for (const cuerpo of [{ publicacion_id: PRINCIPAL.id, contenido: '' }, { publicacion_id: PRINCIPAL.id, contenido: ' hola' }, { publicacion_id: PRINCIPAL.id, contenido: 'x'.repeat(2001) }, { publicacion_id: PRINCIPAL.id, autor: 'x'.repeat(121), contenido: 'hola' }]) {
      const r = await directo('/comentarios', { metodo: 'POST', cuerpo });
      expect(r.status, JSON.stringify(cuerpo).slice(0, 80)).toBe(400);
    }
    expect(sql('select count(*) from public.colaboradores') + sql('select count(*) from public.comentarios')).toBe('00');
  });

  it('el emoji cuenta como un carácter, igual que en el contrato', async () => {
    const c = await publico.createColaborador({ nombre_completo: '😀'.repeat(120), email: 'e@x.mx' });
    expect([...c.nombre_completo]).toHaveLength(120);
  });

  it('Escenario 2: comentario sin nombre → «Anónimo», visible al instante y en orden cronológico', async () => {
    const a = await publico.createComentario(PRINCIPAL.id, { autor: '', contenido: 'Primero' });
    const b = await publico.createComentario(PRINCIPAL.id, { autor: 'María', contenido: 'Segundo' });
    cumple('comentario.schema.json', a);
    expect(a.autor).toBe('Anónimo');
    expect((await publico.listComentarios(PRINCIPAL.id)).map((c) => c.id)).toEqual([a.id, b.id]);
  });

  it('el público no puede crear comentarios ocultos, ni poner fecha o id, ni moderar o borrar', async () => {
    const c = await publico.createComentario(PRINCIPAL.id, { contenido: 'Hola' });
    for (const cuerpo of [
      { publicacion_id: PRINCIPAL.id, contenido: 'x', oculto: true },
      { publicacion_id: PRINCIPAL.id, contenido: 'x', fecha_creacion: '2020-01-01T00:00:00Z' },
      { publicacion_id: PRINCIPAL.id, contenido: 'x', id: '33333333-3333-4333-8333-333333333333' },
    ]) expect((await directo('/comentarios', { metodo: 'POST', cuerpo })).status).toBeGreaterThanOrEqual(401);
    expect((await directo(`/comentarios?id=eq.${c.id}`, { metodo: 'PATCH', cuerpo: { oculto: true } })).status).toBeGreaterThanOrEqual(401);
    expect((await directo(`/comentarios?id=eq.${c.id}`, { metodo: 'PATCH', cuerpo: { contenido: 'cambiado' }, token: jwt(ADMIN_ID) })).status).toBeGreaterThanOrEqual(401); // ni admin cambia el texto
    expect((await directo(`/comentarios?id=eq.${c.id}`, { metodo: 'DELETE' })).status).toBeGreaterThanOrEqual(401);
    await expect(otro.moderarComentario(c.id, { oculto: true })).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' }); // RLS: 0 filas
    await expect(otro.deleteComentario(c.id)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect(sql(`select contenido || '|' || oculto from public.comentarios`)).toBe('Hola|false');
  });

  it('administración: ocultar lo saca de la vista pública (incluso por la API), mostrar lo devuelve, borrar lo elimina', async () => {
    const a = await publico.createComentario(PRINCIPAL.id, { contenido: 'Uno' });
    const b = await publico.createComentario(PRINCIPAL.id, { contenido: 'Dos' });
    const oculto = await admin.moderarComentario(a.id, { oculto: true });
    cumple('comentario.schema.json', oculto);
    expect(oculto.oculto).toBe(true);
    expect((await publico.listComentarios(PRINCIPAL.id)).map((c) => c.id)).toEqual([b.id]);
    const crudo = await (await directo(`/comentarios?select=id,oculto`)).json();
    expect(crudo.map((c) => c.id)).toEqual([b.id]);                  // ni pidiendo directo a la API
    const todos = await admin.listComentariosAdmin();
    expect(todos.map((c) => [c.id, c.oculto])).toEqual([[b.id, false], [a.id, true]]);
    todos.forEach((c) => cumple('comentario.schema.json', c));
    await admin.moderarComentario(a.id, { oculto: false });
    expect((await publico.listComentarios(PRINCIPAL.id))).toHaveLength(2);
    await admin.deleteComentario(a.id);
    await expect(admin.deleteComentario(a.id)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
    expect((await admin.listComentariosAdmin()).map((c) => c.id)).toEqual([b.id]);
  });

  it('la tabla de administradores no es legible por la API', async () => {
    for (const token of [undefined, jwt(OTRO_ID), jwt(ADMIN_ID)]) {
      expect((await directo('/administradores', { token })).status).toBeGreaterThanOrEqual(401);
    }
  });

  it('un token falsificado (otra firma) se rechaza', async () => {
    const falso = `${jwt(ADMIN_ID).split('.').slice(0, 2).join('.')}.firmaInventada`;
    await expect(crear(falso).listColaboradores()).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
  });
});
