/**
 * Punto de entrada único de la UI a la capa de datos.
 * Las vistas importan `api` y llaman a los operationId de spec/openapi.yaml.
 * Para migrar a un backend real (V2) solo cambia el adaptador creado aquí.
 */
import { createLocalStorageAdapter } from './localstorage.adapter.js';
import { publicaciones } from './seed/publicaciones.seed.js';

export { ApiError } from './api-error.js';

/** LocalStorage puede no existir o lanzar SecurityError (modo privado, cookies bloqueadas). */
function obtenerStorage() {
  try {
    const s = window.localStorage;
    const prueba = '__landing_prueba__';
    s.setItem(prueba, '1');
    s.removeItem(prueba);
    return s;
  } catch {
    const noDisponible = () => { throw new Error('LocalStorage no disponible en este navegador.'); };
    return { getItem: noDisponible, setItem: noDisponible };
  }
}

export const api = createLocalStorageAdapter({ storage: obtenerStorage(), publicaciones });
