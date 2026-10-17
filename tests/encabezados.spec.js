/**
 * Los encabezados de seguridad de src/_headers (Cloudflare Pages) no rompen el sitio:
 * se aplican aquí a cada respuesta y se recorren las páginas buscando bloqueos.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENCABEZADOS = Object.fromEntries(fs.readFileSync(path.join(RAIZ, 'src/_headers'), 'utf8')
  .split('\n').filter((l) => /^\s+\S+:/.test(l)).map((l) => l.trim().split(/:\s(.+)/).slice(0, 2)));

test('incluye política de contenido y protección contra incrustación', () => {
  expect(ENCABEZADOS['Content-Security-Policy']).toContain("script-src 'self'");
  expect(ENCABEZADOS['Content-Security-Policy']).toContain('connect-src \'self\' https://*.supabase.co');
  expect(ENCABEZADOS['X-Frame-Options']).toBe('DENY');
});

test('con la política activa, todas las páginas funcionan sin bloqueos', async ({ page }) => {
  await page.route('http://localhost:5173/**', async (r) => {
    const resp = await r.fetch();
    await r.fulfill({ response: resp, headers: { ...resp.headers(), ...ENCABEZADOS } });
  });
  const bloqueos = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) bloqueos.push(m.text()); });
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`Refused to load: ${e.violatedDirective} ${e.blockedURI}`)));

  await page.goto('/');
  await expect(page.locator('.hero-card img')).toBeVisible();
  await page.goto('/#/publicacion/7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f');
  const barra = page.locator('.caratula .grafica__barra').first();
  await expect(barra).toBeVisible();
  expect(await barra.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(20); // el ancho viene de style="--valor"
  await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Prueba con política');
  await page.getByRole('button', { name: 'Publicar comentario' }).click();
  await expect(page.getByText('Prueba con política')).toBeVisible();
  await page.goto('/#/colaborar');
  await page.getByLabel('Nombre completo').fill('Ana López');
  await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
  await page.getByRole('button', { name: 'Enviar registro' }).click();
  await expect(page.locator('.confirmacion')).toBeVisible();
  await page.goto('/#/admin');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar CSV' }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/\.csv$/);
  expect(bloqueos).toEqual([]);
});
