/** Ajustes de identidad y texto (spec 1.2): nombre, lema, texto de "Quiero colaborar" y paleta rosa. */
import { test, expect } from '@playwright/test';
import { IDENTIDAD } from '../src/js/identidad.js';

test('ajuste 5: el encabezado muestra el nombre y el lema del sitio', async ({ page }) => {
  await page.goto('/');
  const marca = page.locator('header .marca');
  await expect(marca.locator('.marca__nombre')).toHaveText('El Banobrino');
  await expect(marca.locator('.marca__nombre')).toHaveCSS('text-transform', 'uppercase'); // se ve en mayúsculas
  await expect(marca.locator('.marca__sub')).toHaveText('Acercando el Sindicato a las y los trabajadores');
  await expect(page).toHaveTitle(`Inicio · ${IDENTIDAD.nombre}`);
  await expect(page.locator('footer')).toContainText(IDENTIDAD.nombre);
});

test('ajuste 1: nuevo texto de "Quiero colaborar"', async ({ page }) => {
  await page.goto('/#/colaborar');
  await expect(page.locator('#colaborar .seccion__intro')).toHaveText(
    'Si tienes un comentario, propuesta o te interesa participar en iniciativas a favor de la base trabajadora, déjanos tus datos y nos pondremos en contacto contigo.');
});

test('ajuste 4: la paleta principal es rosa (sin guinda)', async ({ page }) => {
  await page.goto('/#/colaborar');
  await expect(page.getByRole('button', { name: 'Enviar registro' })).toHaveCSS('background-color', 'rgb(184, 60, 116)');
  await expect(page.locator('footer')).toHaveCSS('background-color', 'rgb(138, 39, 82)');
  const css = await page.evaluate(() => [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join(' '));
  expect(css).not.toMatch(/rgb\(155, 34, 71|rgb\(97, 18, 50|#9b2247|#611232/i);
});
