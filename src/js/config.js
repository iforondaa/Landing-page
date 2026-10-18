/**
 * Conexión con Supabase (V2). ÚNICO lugar donde se configura.
 *
 * Con los dos valores vacíos el sitio funciona en «modo prototipo»: los datos se
 * guardan solo en el navegador (LocalStorage) y la administración no pide contraseña.
 *
 * Dónde encontrarlos: Supabase → tu proyecto → Project Settings → API Keys / Data API.
 *  - supabaseUrl:   la «Project URL», ej. 'https://abcdefghijkl.supabase.co'
 *  - supabaseClave: la clave pública («Publishable key», empieza con sb_publishable_,
 *                   o la «anon public» si tu proyecto usa las claves anteriores).
 * Ambas son públicas por diseño (viajan a todos los navegadores). NUNCA pongas aquí
 * la «secret key» ni la «service_role».
 */
export const CONFIG = Object.freeze({
  supabaseUrl: 'https://tahiygeuvffmkxbgzwjn.supabase.co',
  supabaseClave: 'sb_publishable_BkmyH9eCpV1X3Wb4xsT9aA_Tt2GDUCa',
});
