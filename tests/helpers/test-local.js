/**
 * Fixture de Playwright para las pruebas de prototipo (modo LocalStorage).
 *
 * Estas suites (acceptance, admin, comentarios, exportar, encabezados, nota, identidad) verifican
 * el comportamiento del sitio en «modo prototipo»: los datos se guardan en el
 * navegador, no en Supabase. El sitio decide el modo según `src/js/config.js`,
 * que en producción lleva la URL y la clave reales de Supabase.
 *
 * Para que estas pruebas no dependan de lo que haya commiteado en `config.js`
 * (ni escriban datos de prueba en la base real), este fixture intercepta la
 * petición de `config.js` y devuelve valores vacíos → modo local.
 *
 * Se importa como:  import { test, expect } from './helpers/test-local.js';
 * (mismo patrón que usa tests/supabase.spec.js para forzar el modo Supabase).
 */
import { test as base, expect } from '@playwright/test';

const CONFIG_LOCAL = 'export const CONFIG = Object.freeze({ supabaseUrl: "", supabaseClave: "" });';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route('**/js/config.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: CONFIG_LOCAL }),
    );
    await use(context);
  },
});

export { expect };
