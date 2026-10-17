/**
 * Sesión de administración.
 *  - Modo Supabase: inicia sesión con correo y contraseña (Supabase Auth) y
 *    comprueba que la cuenta esté dada de alta como administradora.
 *    La sesión se guarda en sessionStorage: se cierra al cerrar la pestaña.
 *  - Modo local (prototipo): no hay contraseña; la sesión siempre está activa.
 */
import { esClaveJwt } from './supabase.adapter.js';

export const CLAVE_SESION = 'banobrino.sesion';
const MARGEN_MS = 60_000; // renovar un minuto antes de que expire

export class ErrorSesion extends Error {
  constructor(mensaje) { super(mensaje); this.name = 'ErrorSesion'; }
}

export function crearSesionLocal() {
  return Object.freeze({
    requiereContrasena: false,
    activa: () => true,
    correo: () => null,
    token: async () => null,
    iniciar: async () => {},
    cerrar: async () => {},
  });
}

/**
 * @param {object} opciones
 * @param {string} opciones.url
 * @param {string} opciones.clave
 * @param {Pick<Storage,'getItem'|'setItem'|'removeItem'>} opciones.storage
 * @param {typeof fetch} [opciones.fetch]
 * @param {() => number} [opciones.ahora]
 */
export function crearSesionSupabase({ url, clave, storage, fetch: f = globalThis.fetch.bind(globalThis), ahora = () => Date.now() }) {
  const raiz = url.replace(/\/+$/, '');
  const encabezados = (token) => ({
    apikey: clave,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : esClaveJwt(clave) ? { Authorization: `Bearer ${clave}` } : {}),
  });

  const leer = () => {
    try { return JSON.parse(storage.getItem(CLAVE_SESION) ?? 'null'); } catch { return null; }
  };
  const guardar = (s) => { try { storage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch { /* sin almacenamiento: dura lo que la página */ } };
  const borrar = () => { try { storage.removeItem(CLAVE_SESION); } catch { /* nada que borrar */ } };

  async function pedirToken(tipo, cuerpo) {
    let r;
    try {
      r = await f(`${raiz}/auth/v1/token?grant_type=${tipo}`, { method: 'POST', headers: encabezados(), body: JSON.stringify(cuerpo) });
    } catch {
      throw new ErrorSesion('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
    }
    if (!r.ok) {
      if (r.status === 400 || r.status === 401) throw new ErrorSesion('Correo o contraseña incorrectos.');
      if (r.status === 429) throw new ErrorSesion('Demasiados intentos. Espera unos minutos y vuelve a intentar.');
      throw new ErrorSesion('No se pudo iniciar sesión. Intenta de nuevo.');
    }
    const d = await r.json();
    return { token: d.access_token, renovar: d.refresh_token, expira: ahora() + (d.expires_in ?? 3600) * 1000, correo: d.user?.email ?? cuerpo.email ?? null };
  }

  async function esAdmin(token) {
    const r = await f(`${raiz}/rest/v1/rpc/es_admin`, { method: 'POST', headers: encabezados(token), body: '{}' });
    return r.ok && (await r.json()) === true;
  }

  async function token() {
    const s = leer();
    if (!s) return null;
    if (s.expira - MARGEN_MS > ahora()) return s.token;
    try {
      const nueva = await pedirToken('refresh_token', { refresh_token: s.renovar });
      guardar({ ...nueva, correo: s.correo });
      return nueva.token;
    } catch {
      borrar();
      return null;
    }
  }

  return Object.freeze({
    requiereContrasena: true,
    activa: () => Boolean(leer()),
    correo: () => leer()?.correo ?? null,
    token,
    async iniciar(email, password) {
      const s = await pedirToken('password', { email, password });
      let admin = false;
      try { admin = await esAdmin(s.token); } catch { /* se trata como no admin */ }
      if (!admin) {
        await f(`${raiz}/auth/v1/logout`, { method: 'POST', headers: encabezados(s.token) }).catch(() => {});
        throw new ErrorSesion('Esta cuenta no tiene permiso de administración.');
      }
      guardar(s);
    },
    async cerrar() {
      const s = leer();
      borrar();
      if (s?.token) await f(`${raiz}/auth/v1/logout`, { method: 'POST', headers: encabezados(s.token) }).catch(() => {});
    },
  });
}
