/**
 * El sitio en modo Supabase, de punta a punta en el navegador, contra el
 * «Supabase mínimo» local (scripts/supabase-local.sh). Solo corre si existe
 * SUPABASE_PRUEBA_URL. El inicio de sesión (Supabase Auth) se simula aquí y
 * entrega un token firmado que la base de datos verifica de verdad.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const { SUPABASE_PRUEBA_URL: REST, SUPABASE_PRUEBA_SECRETO: SECRETO, SUPABASE_PRUEBA_PG: PG } = process.env;
const FALSO = 'https://local.supabase';
const ID = '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f';
const ADMIN = { id: '11111111-1111-4111-8111-111111111111', email: 'ivan@banobrino.mx', password: 'Contraseña-de-prueba-1' };
const OTRA = { id: '22222222-2222-4222-8222-222222222222', email: 'otra@x.mx', password: 'Otra-contraseña-2' };

const sql = (q) => execFileSync('psql', [PG, '-v', 'ON_ERROR_STOP=1', '-qtAc', q], { encoding: 'utf8' }).trim();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(sub) {
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 600 })}`;
  return `${cuerpo}.${crypto.createHmac('sha256', SECRETO).update(cuerpo).digest('base64url')}`;
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' };

test.skip(!REST, 'Requiere SUPABASE_PRUEBA_URL (scripts/supabase-local.sh iniciar).');
test.describe.configure({ mode: 'serial' }); // comparten la misma base de datos
test.skip(({ isMobile }) => isMobile, 'Una sola vez: todas las pruebas comparten la base de datos.');

test.beforeAll(() => {
  sql(`insert into auth.users (id, email) values ('${ADMIN.id}', '${ADMIN.email}'), ('${OTRA.id}', '${OTRA.email}') on conflict do nothing;
       insert into public.administradores (user_id) values ('${ADMIN.id}') on conflict do nothing;`);
});

test.beforeEach(async ({ page }) => {
  sql('truncate public.colaboradores, public.comentarios;');
  // 1) El sitio se configura con Supabase (sin tocar src/js/config.js).
  await page.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: `export const CONFIG = Object.freeze({ supabaseUrl: '${FALSO}', supabaseClave: 'sb_publishable_prueba' });` }));
  // 2) La API REST se reenvía al PostgREST local (las reglas RLS son las reales).
  await page.route(`${FALSO}/rest/v1/**`, async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    const resp = await r.fetch({ url: r.request().url().replace(`${FALSO}/rest/v1`, REST) });
    return r.fulfill({ response: resp, headers: { ...resp.headers(), ...CORS } });
  });
  // 3) Supabase Auth simulado.
  await page.route(`${FALSO}/auth/v1/**`, async (r) => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    if (r.request().url().includes('/logout')) return r.fulfill({ status: 204, headers: CORS });
    const { email, password } = r.request().postDataJSON() ?? {};
    const cuenta = [ADMIN, OTRA].find((c) => c.email === email && c.password === password);
    if (!cuenta) return r.fulfill({ status: 400, headers: CORS, json: { error: 'invalid_grant' } });
    return r.fulfill({ headers: CORS, json: { access_token: jwt(cuenta.id), refresh_token: 'r', expires_in: 600, user: { email } } });
  });
});

async function entrar(page, { email, password } = ADMIN) {
  await page.goto('/#/admin');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test('Escenario 1 en real: el registro llega a la base de datos', async ({ page }) => {
  await page.goto('/#/colaborar');
  await page.getByLabel('Nombre completo').fill('Antonio Machado Ruiz');
  await page.getByLabel('Correo electrónico').fill('ejemplo@banobras.gob.mx');
  await page.getByLabel('Teléfono').fill('554-365-0920');
  await page.getByRole('button', { name: 'Enviar registro' }).click();
  await expect(page.locator('.confirmacion')).toBeVisible();
  expect(sql('select nombre_completo || \'|\' || telefono from public.colaboradores')).toBe('Antonio Machado Ruiz|554-365-0920');
  expect(await page.evaluate(() => localStorage.getItem('landing.v1.colaboradores'))).toBeNull(); // nada se queda en el navegador
});

test('Escenario 2 en real: el comentario anónimo se guarda y otra persona lo ve', async ({ page }) => {
  await page.goto(`/#/publicacion/${ID}`);
  await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Muy buena nota');
  await page.getByRole('button', { name: 'Publicar comentario' }).click();
  const lista = page.getByRole('list', { name: 'Comentarios publicados' });
  await expect(lista.getByRole('listitem')).toHaveCount(1);
  await expect(lista).toContainText('Anónimo');
  expect(sql('select autor from public.comentarios')).toBe('Anónimo');
});

test('administración: pide sesión; contraseña incorrecta o cuenta sin permiso no entran', async ({ page }) => {
  await page.goto('/#/admin');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Administración');
  await expect(page.locator('table')).toHaveCount(0);
  await entrar(page, { email: ADMIN.email, password: 'equivocada' });
  await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.');
  await expect(page.getByLabel('Contraseña')).toHaveValue('');
  await entrar(page, OTRA);
  await expect(page.getByRole('alert')).toHaveText('Esta cuenta no tiene permiso de administración.');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test('administración: ve registros y comentarios, oculta uno (desaparece de la nota) y cierra sesión', async ({ page }) => {
  sql(`select public.registrar_colaborador('Ana López', 'ana@gmail.com');
       insert into public.comentarios (publicacion_id, autor, contenido) values ('${ID}', 'María', 'Hola a todas'), ('${ID}', 'X', 'Comentario fuera de lugar');`);
  await entrar(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Colaboradores registrados');
  await expect(page.getByText(`Sesión iniciada como ${ADMIN.email}.`)).toBeVisible();
  await expect(page.getByText('Modo prototipo:')).toHaveCount(0);
  await expect(page.locator('.tabla tbody tr')).toHaveCount(1);
  await expect(page.locator('.tabla')).toContainText('ana@gmail.com');

  await page.getByRole('button', { name: 'Ocultar el comentario de X' }).click();
  await expect(page.getByRole('button', { name: 'Mostrar el comentario de X' })).toBeVisible();
  expect(sql('select oculto from public.comentarios where autor = \'X\'')).toBe('t');

  await page.goto(`/#/publicacion/${ID}`);
  await expect(page.getByRole('list', { name: 'Comentarios publicados' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Comentario fuera de lugar')).toHaveCount(0);

  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible(); // la sesión no vuelve sola
});

test('si la sesión deja de ser válida, vuelve a pedir inicio de sesión', async ({ page }) => {
  await entrar(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Colaboradores registrados');
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('banobrino.sesion'));
    sessionStorage.setItem('banobrino.sesion', JSON.stringify({ ...s, token: `${s.token.slice(0, -4)}xxxx` }));
  });
  await page.reload();
  await expect(page.getByRole('alert')).toHaveText('Tu sesión expiró. Vuelve a iniciar sesión.');
});
