/** «¿Quiénes somos?» (spec v2.1 §8.6): pestaña del menú y página de presentación. */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';
import { QUIENES_SOMOS } from '../src/js/contenido/quienes-somos.js';

const menu = (page) => page.getByRole('navigation', { name: 'Principal' });

test('el menú tiene la pestaña entre «Publicaciones» y «Quiero colaborar», con el estilo de «Publicaciones»', async ({ page }) => {
  await page.goto('/');
  await expect(menu(page).getByRole('link')).toHaveText(['Publicaciones', '¿Quiénes somos?', 'Quiero colaborar']);
  const quienes = menu(page).getByRole('link', { name: '¿Quiénes somos?' });
  const publicaciones = menu(page).getByRole('link', { name: 'Publicaciones' });
  for (const prop of ['background-color', 'color', 'font-weight', 'font-size']) {
    expect(await quienes.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop))
      .toBe(await publicaciones.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop));
  }
  await expect(menu(page).getByRole('link', { name: 'Quiero colaborar' })).toHaveCSS('background-color', 'rgb(184, 60, 116)'); // sigue siendo botón
});

test('al hacer clic se abre la página y la pestaña queda marcada', async ({ page }) => {
  await page.goto('/');
  await menu(page).getByRole('link', { name: '¿Quiénes somos?' }).click();
  await expect(page).toHaveURL(/#\/quienes-somos$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Quiénes somos?');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle(/^¿Quiénes somos\? · /);
  await expect(menu(page).getByRole('link', { name: '¿Quiénes somos?' })).toHaveAttribute('aria-current', 'page');
  await expect(menu(page).getByRole('link', { name: 'Publicaciones' })).not.toHaveAttribute('aria-current', 'page');
});

test('muestra todo el texto, con sus tres secciones, la aclaración y la invitación a colaborar', async ({ page }) => {
  await page.goto('/#/quienes-somos');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['¿Qué hacemos?', 'Nuestro compromiso', 'Nuestro derecho a participar']);
  const main = page.locator('main');
  const sinNegritas = (t) => t.replace(/\*\*/g, '');
  const textos = [QUIENES_SOMOS.entrada, ...QUIENES_SOMOS.presentacion, QUIENES_SOMOS.aclaracion,
    ...QUIENES_SOMOS.secciones.flatMap((s) => [...s.parrafos, s.invitacion ?? ''])].filter(Boolean).map(sinNegritas);
  expect(textos).toHaveLength(16); // los 16 párrafos del texto entregado
  for (const t of textos) await expect(main).toContainText(t);
  await expect(page.getByRole('complementary', { name: 'Aclaración' })).toContainText('no forma parte de la dirigencia sindical');
  await expect(main.locator('strong')).toHaveText(['artículos 6.º y 7.º', 'artículo 9.º']);
  await page.locator('.quienes__invitacion').getByRole('link', { name: 'Quiero colaborar' }).click();
  await expect(page).toHaveURL(/#\/colaborar$/);
  await expect(page.getByLabel('Nombre completo')).toBeVisible();
});

test('en celular: pestañas de texto en la primera fila y el botón abajo, sin desbordes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo aplica en celular.');
  await page.goto('/#/quienes-somos');
  const caja = async (n) => menu(page).getByRole('link', { name: n }).boundingBox();
  const [pub, qs, cta] = [await caja('Publicaciones'), await caja('¿Quiénes somos?'), await caja('Quiero colaborar')];
  expect(Math.abs(pub.y - qs.y)).toBeLessThan(2);       // misma fila
  expect(cta.y).toBeGreaterThan(pub.y + pub.height);     // el botón va debajo
  for (const b of [pub, qs, cta]) expect(b.height).toBeGreaterThanOrEqual(24); // área táctil (WCAG 2.5.8)
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('sin violaciones de accesibilidad', async ({ page }) => {
  await page.goto('/#/quienes-somos');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
