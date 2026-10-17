/**
 * Adaptador de Supabase y sesión de administración, con un `fetch` simulado:
 * qué peticiones se hacen, con qué encabezados, y cómo se traducen las respuestas
 * y los errores al contrato. (Contra una base real: tests/integracion/.)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createSupabaseAdapter, errorDesdeRespuesta } from '../src/js/data/supabase.adapter.js';
import { crearSesionSupabase, CLAVE_SESION } from '../src/js/data/sesion.js';
import { publicaciones } from '../src/js/data/seed/publicaciones.seed.js';
import { MemoryStorage } from './helpers/memory-storage.js';
import { crearAjv } from './helpers/ajv.js';

const URL_P = 'https://proyecto.supabase.co';
const PRINCIPAL = publicaciones.find((p) => p.es_principal);
const ajv = crearAjv();
const cumple = (id, v) => expect(ajv.getSchema(id)(v), JSON.stringify(ajv.getSchema(id).errors)).toBe(true);

const respuesta = (status, cuerpo) => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/** fetch simulado: registra las llamadas y responde con la función dada. */
function falsoFetch(responder) {
  const llamadas = [];
  const f = async (url, init = {}) => {
    const u = new URL(url);
    const llamada = { url: u, ruta: u.pathname, query: u.searchParams, metodo: init.method ?? 'GET', headers: init.headers ?? {}, cuerpo: init.body ? JSON.parse(init.body) : undefined };
    llamadas.push(llamada);
    return responder(llamada);
  };
  return { f, llamadas };
}

const COMENTARIO = { id: '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d', publicacion_id: PRINCIPAL.id, autor: 'Anónimo', contenido: 'Hola', fecha_creacion: '2026-10-17T12:30:32.392908-06:00' };
const COLABORADOR = { id: '3f6c2a1e-8b4d-4c2a-9e1f-5a7b8c9d0e1f', nombre_completo: 'Ana López', email: 'ana@gmail.com', telefono: null, area_adscripcion: null, comentario_propuesta: null, fecha_registro: '2026-10-17T18:00:00+00:00' };

describe('Adaptador de Supabase', () => {
  it('lee comentarios visibles con la clave pública y sin sesión; normaliza la fecha a UTC', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(200, [COMENTARIO]));
    const api = createSupabaseAdapter({ url: `${URL_P}/`, clave: 'sb_publishable_abc', publicaciones, fetch: f, obtenerToken: async () => 'token-admin' });
    const lista = await api.listComentarios(PRINCIPAL.id);
    expect(lista).toEqual([{ ...COMENTARIO, fecha_creacion: '2026-10-17T18:30:32.392Z' }]);
    lista.forEach((c) => cumple('comentario.schema.json', c));
    const [l] = llamadas;
    expect(l.ruta).toBe('/rest/v1/comentarios');
    expect(l.query.get('publicacion_id')).toBe(`eq.${PRINCIPAL.id}`);
    expect(l.query.get('oculto')).toBe('is.false');          // nunca ocultos al público…
    expect(l.query.get('select')).not.toContain('oculto');
    expect(l.headers.apikey).toBe('sb_publishable_abc');
    expect(l.headers.Authorization).toBeUndefined();          // …aunque haya sesión de admin abierta
  });

  it('con clave «anon» (JWT) también la envía como Authorization', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(200, []));
    const api = createSupabaseAdapter({ url: URL_P, clave: 'eyJhbGciOi.anon.clave', publicaciones, fetch: f });
    await api.listComentarios(PRINCIPAL.id);
    expect(llamadas[0].headers.Authorization).toBe('Bearer eyJhbGciOi.anon.clave');
  });

  it('publicar comentario: recorta, omite autor vacío (la base pone «Anónimo») y devuelve el creado', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(201, [COMENTARIO]));
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: f });
    const c = await api.createComentario(PRINCIPAL.id, { autor: '   ', contenido: '  Hola  ' });
    expect(c.autor).toBe('Anónimo');
    const [l] = llamadas;
    expect([l.metodo, l.ruta]).toEqual(['POST', '/rest/v1/comentarios']);
    expect(l.cuerpo).toEqual({ publicacion_id: PRINCIPAL.id, contenido: 'Hola' });
    expect(l.headers.Prefer).toBe('return=representation');
  });

  it('valida antes de enviar: datos inválidos no llegan al servidor', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(201, [COMENTARIO]));
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: f });
    await expect(api.createComentario(PRINCIPAL.id, { contenido: '' })).rejects.toMatchObject({ codigo: 'VALIDACION', status: 400 });
    await expect(api.createColaborador({ nombre_completo: 'A', email: 'malo' })).rejects.toMatchObject({ codigo: 'VALIDACION' });
    await expect(api.listComentarios('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO', status: 404 });
    expect(llamadas).toHaveLength(0);
  });

  it('registrar colaborador usa la función segura y quita los campos vacíos', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(200, COLABORADOR));
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: f });
    const c = await api.createColaborador({ nombre_completo: ' Ana López ', email: 'ana@gmail.com', telefono: '' });
    expect(c).toEqual({ id: COLABORADOR.id, nombre_completo: 'Ana López', email: 'ana@gmail.com', fecha_registro: '2026-10-17T18:00:00.000Z' });
    cumple('colaborador.schema.json', c);
    expect([llamadas[0].metodo, llamadas[0].ruta]).toEqual(['POST', '/rest/v1/rpc/registrar_colaborador']);
    expect(llamadas[0].cuerpo).toEqual({ nombre_completo: 'Ana López', email: 'ana@gmail.com' });
  });

  it('operaciones de administración: sin sesión → NO_AUTORIZADO sin llamar al servidor; con sesión envían el token', async () => {
    const { f, llamadas } = falsoFetch(() => respuesta(200, [COLABORADOR]));
    let token = null;
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: f, obtenerToken: async () => token });
    for (const op of [() => api.listColaboradores(), () => api.listComentariosAdmin(), () => api.moderarComentario(COMENTARIO.id, { oculto: true }), () => api.deleteComentario(COMENTARIO.id)]) {
      await expect(op()).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO', status: 401 });
    }
    expect(llamadas).toHaveLength(0);
    token = 'token-admin';
    await api.listColaboradores();
    expect(llamadas[0].headers.Authorization).toBe('Bearer token-admin');
    expect(llamadas[0].query.get('order')).toBe('fecha_registro.desc');
  });

  it('moderar y borrar: 0 filas afectadas → NO_ENCONTRADO', async () => {
    const { f, llamadas } = falsoFetch((l) => respuesta(200, l.metodo === 'PATCH' ? [{ ...COMENTARIO, oculto: true }] : []));
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: f, obtenerToken: async () => 't' });
    expect(await api.moderarComentario(COMENTARIO.id, { oculto: true })).toMatchObject({ oculto: true });
    expect(llamadas[0].cuerpo).toEqual({ oculto: true });
    expect(llamadas[0].query.get('id')).toBe(`eq.${COMENTARIO.id}`);
    await expect(api.deleteComentario(COMENTARIO.id)).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });

  it('traduce errores del servidor al contrato', async () => {
    const casos = [
      [respuesta(401, { code: 'PGRST301', message: 'JWT expired' }), 'NO_AUTORIZADO'],
      [respuesta(403, { code: '42501', message: 'permission denied' }), 'NO_AUTORIZADO'],
      [respuesta(400, { code: '23514', message: 'check constraint' }), 'VALIDACION'],
      [respuesta(500, { code: 'XX000' }), 'ALMACENAMIENTO'],
      [new Response('no es json', { status: 502 }), 'ALMACENAMIENTO'],
    ];
    for (const [r, codigo] of casos) expect((await errorDesdeRespuesta(r)).codigo).toBe(codigo);
  });

  it('sin conexión → ALMACENAMIENTO con mensaje claro', async () => {
    const api = createSupabaseAdapter({ url: URL_P, clave: 'k', publicaciones, fetch: async () => { throw new TypeError('Failed to fetch'); } });
    await expect(api.listComentarios(PRINCIPAL.id)).rejects.toMatchObject({ codigo: 'ALMACENAMIENTO', message: expect.stringMatching(/conexión/) });
  });

  it('exige URL y clave', () => {
    expect(() => createSupabaseAdapter({ url: '', clave: 'k', publicaciones })).toThrow(/Faltan/);
  });
});

describe('Sesión de administración (Supabase Auth)', () => {
  let storage; let ahora;
  beforeEach(() => { storage = new MemoryStorage(); ahora = 1_000_000; });

  const tokenOk = (extra = {}) => respuesta(200, { access_token: 'acceso-1', refresh_token: 'renovar-1', expires_in: 3600, user: { email: 'ivan@x.mx' }, ...extra });

  it('inicia sesión, comprueba que sea admin y guarda el token en sessionStorage', async () => {
    const { f, llamadas } = falsoFetch((l) => (l.ruta === '/auth/v1/token' ? tokenOk() : respuesta(200, true)));
    const s = crearSesionSupabase({ url: URL_P, clave: 'k', storage, fetch: f, ahora: () => ahora });
    expect(s.activa()).toBe(false);
    await s.iniciar('ivan@x.mx', 'secreta');
    expect(llamadas[0].query.get('grant_type')).toBe('password');
    expect(llamadas[0].cuerpo).toEqual({ email: 'ivan@x.mx', password: 'secreta' });
    expect(llamadas[1].ruta).toBe('/rest/v1/rpc/es_admin');
    expect(llamadas[1].headers.Authorization).toBe('Bearer acceso-1');
    expect(s.activa()).toBe(true);
    expect(s.correo()).toBe('ivan@x.mx');
    expect(await s.token()).toBe('acceso-1');
    expect(JSON.stringify(storage.getItem(CLAVE_SESION))).not.toContain('secreta'); // nunca se guarda la contraseña
  });

  it('cuenta sin permiso de administración: rechaza y no deja sesión', async () => {
    const { f } = falsoFetch((l) => (l.ruta === '/auth/v1/token' ? tokenOk() : l.ruta === '/rest/v1/rpc/es_admin' ? respuesta(200, false) : respuesta(204)));
    const s = crearSesionSupabase({ url: URL_P, clave: 'k', storage, fetch: f });
    await expect(s.iniciar('otro@x.mx', 'x')).rejects.toThrow('Esta cuenta no tiene permiso de administración.');
    expect(s.activa()).toBe(false);
  });

  it('contraseña incorrecta y demasiados intentos dan mensajes claros', async () => {
    let status = 400;
    const { f } = falsoFetch(() => respuesta(status, { error: 'invalid_grant' }));
    const s = crearSesionSupabase({ url: URL_P, clave: 'k', storage, fetch: f });
    await expect(s.iniciar('a@b.mx', 'mal')).rejects.toThrow('Correo o contraseña incorrectos.');
    status = 429;
    await expect(s.iniciar('a@b.mx', 'mal')).rejects.toThrow(/Demasiados intentos/);
  });

  it('renueva el token cuando está por expirar; si no puede, cierra la sesión', async () => {
    let renovarOk = true;
    const { f, llamadas } = falsoFetch((l) => {
      if (l.query.get('grant_type') === 'refresh_token') return renovarOk ? tokenOk({ access_token: 'acceso-2', refresh_token: 'renovar-2' }) : respuesta(400, {});
      return l.ruta === '/auth/v1/token' ? tokenOk() : respuesta(200, true);
    });
    const s = crearSesionSupabase({ url: URL_P, clave: 'k', storage, fetch: f, ahora: () => ahora });
    await s.iniciar('ivan@x.mx', 'secreta');
    ahora += 3600 * 1000; // ya expiró
    expect(await s.token()).toBe('acceso-2');
    expect(llamadas.at(-1).cuerpo).toEqual({ refresh_token: 'renovar-1' });
    ahora += 3600 * 1000;
    renovarOk = false;
    expect(await s.token()).toBeNull();
    expect(s.activa()).toBe(false);
  });

  it('cerrar sesión borra el token y avisa al servidor', async () => {
    const { f, llamadas } = falsoFetch((l) => (l.ruta === '/auth/v1/token' ? tokenOk() : respuesta(l.ruta === '/auth/v1/logout' ? 204 : 200, l.ruta === '/auth/v1/logout' ? undefined : true)));
    const s = crearSesionSupabase({ url: URL_P, clave: 'k', storage, fetch: f });
    await s.iniciar('ivan@x.mx', 'secreta');
    await s.cerrar();
    expect(s.activa()).toBe(false);
    expect(llamadas.at(-1).ruta).toBe('/auth/v1/logout');
  });
});
