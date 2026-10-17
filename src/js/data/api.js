/**
 * Punto de entrada único de la UI a la capa de datos.
 * Las vistas importan `api` y llaman a los operationId de spec/openapi.yaml.
 * El adaptador se elige según src/js/config.js: Supabase (V2) o LocalStorage (prototipo).
 */
import { CONFIG } from '../config.js';
import { createLocalStorageAdapter } from './localstorage.adapter.js';
import { createSupabaseAdapter } from './supabase.adapter.js';
import { crearSesionLocal, crearSesionSupabase } from './sesion.js';
import { publicaciones } from './seed/publicaciones.seed.js';

export { ApiError } from './api-error.js';

/** Un Storage que puede no existir o lanzar SecurityError (modo privado, cookies bloqueadas). */
function obtenerStorage(nombre) {
  try {
    const s = window[nombre];
    const prueba = '__landing_prueba__';
    s.setItem(prueba, '1');
    s.removeItem(prueba);
    return s;
  } catch {
    const noDisponible = () => { throw new Error(`${nombre} no disponible en este navegador.`); };
    return { getItem: noDisponible, setItem: noDisponible, removeItem: noDisponible };
  }
}

export const MODO = CONFIG.supabaseUrl && CONFIG.supabaseClave ? 'supabase' : 'local';

export const sesion = MODO === 'supabase'
  ? crearSesionSupabase({ url: CONFIG.supabaseUrl, clave: CONFIG.supabaseClave, storage: obtenerStorage('sessionStorage') })
  : crearSesionLocal();

export const api = MODO === 'supabase'
  ? createSupabaseAdapter({ url: CONFIG.supabaseUrl, clave: CONFIG.supabaseClave, publicaciones, obtenerToken: () => sesion.token() })
  : createLocalStorageAdapter({ storage: obtenerStorage('localStorage'), publicaciones });
