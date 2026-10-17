/**
 * Hace una consulta mínima a Supabase para que el proyecto gratuito no se pause
 * por inactividad (se pausa tras una semana sin uso). Lo ejecuta GitHub Actions
 * dos veces por semana (.github/workflows/mantener-activo.yml); también a mano:
 *   node scripts/mantener-activo.mjs
 */
import { CONFIG } from '../src/js/config.js';

if (!CONFIG.supabaseUrl || !CONFIG.supabaseClave) {
  console.log('src/js/config.js aún no tiene los datos de Supabase: no hay nada que mantener activo.');
  process.exit(0);
}
const url = `${CONFIG.supabaseUrl.replace(/\/+$/, '')}/rest/v1/comentarios?select=id&limit=1`;
const encabezados = { apikey: CONFIG.supabaseClave, ...(/^eyJ/.test(CONFIG.supabaseClave) && { Authorization: `Bearer ${CONFIG.supabaseClave}` }) };
const r = await fetch(url, { headers: encabezados });
if (!r.ok) {
  console.error(`Supabase respondió ${r.status}. Si el proyecto está pausado, reactívalo desde el panel de Supabase («Restore project»).`);
  process.exit(1);
}
console.log(`Supabase activo (respuesta ${r.status}).`);
