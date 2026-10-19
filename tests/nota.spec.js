/** Nota «El Sindicato visto por su base»: portada, carátula, informe con gráficas (spec v1.3; aviso de privacidad retirado en v1.4). */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';

const ID = '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f';

test.describe('Nota con carátula e informe', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/#/publicacion/${ID}`);
    await expect(page.locator('.caratula')).toBeVisible();
  });

  test('portada con texto alternativo que describe la gráfica', async ({ page }) => {
    const img = page.locator('.nota__media img');
    await expect(img).toHaveAttribute('src', 'assets/img/consulta-portada.svg');
    await expect(img).toHaveAttribute('alt', /52%.*48%/);
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
  });

  test('carátula: título, tres cifras clave, cuatro gráficas, destacado, cita y nota', async ({ page }) => {
    const c = page.locator('.caratula');
    await expect(c.getByRole('heading', { level: 2 })).toHaveText('Los resultados de la consulta en un vistazo');
    await expect(c.locator('.cifra__valor')).toHaveText(['48%', '89%', '77%']);
    await expect(c.locator('.cifra__texto strong').first()).toHaveText('muy presente o algo presente');
    await expect(c.locator('.grafica')).toHaveCount(4);
    await expect(c.locator('.grafica').nth(3)).toContainText('33%'); // prioridad del Comité en % (versión definitiva)
    await expect(c.locator('.destacado__valor')).toHaveText('17 de 96');
    await expect(c.locator('blockquote')).toContainText('No conozco ninguna situación');
    await expect(c.locator('.caratula__nota')).toContainText('96 respuestas recibidas');
  });

  test('la dona muestra cada categoría con su valor en texto', async ({ page }) => {
    const dona = page.locator('.caratula .grafica--dona');
    await expect(dona.locator('.grafica__claves li')).toHaveText([
      /10%\s+Muy presente/, /38%\s+Algo presente/, /44%\s+Casi ausente/, /8%\s+Totalmente ausente/,
    ]);
    await expect(dona.locator('circle')).toHaveCount(4);
  });

  test('informe: 8 secciones y 8 gráficas con etiquetas y valores legibles', async ({ page }) => {
    const cuerpo = page.locator('.nota__cuerpo');
    await expect(cuerpo.locator('.bloque-seccion')).toHaveCount(8);
    await expect(cuerpo.locator('.grafica')).toHaveCount(8);
    const presencia = cuerpo.locator('.grafica').nth(1);
    await expect(presencia.locator('.grafica__titulo')).toHaveText('¿Qué tan presente has sentido al Sindicato?');
    await expect(presencia.locator('.grafica__valor')).toHaveText(['10%', '38%', '44%', '8%']);
    // barras agrupadas: leyenda de dos series y nombre de serie disponible para lectores de pantalla
    const agrupada = cuerpo.locator('.grafica--barras-agrupadas');
    await expect(agrupada.locator('.grafica__leyenda li')).toHaveText(['La menciona entre sus tres', 'La coloca en primer lugar']);
    await expect(agrupada.locator('.grafica__valor').first()).toHaveText('La menciona entre sus tres: 85%');
    // el largo de cada barra es proporcional a su valor
    const anchos = await presencia.locator('.grafica__barra').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
    expect(anchos[2]).toBeGreaterThan(anchos[1]); // 44 > 38
    expect(anchos[1]).toBeGreaterThan(anchos[0]); // 38 > 10
  });

  test('el informe conserva negritas, listas y citas', async ({ page }) => {
    const cuerpo = page.locator('.nota__cuerpo');
    await expect(cuerpo.locator('.bloque-lista').first().locator('li')).toHaveCount(5);
    await expect(cuerpo.locator('.bloque-lista li strong').first()).toHaveText('No hay rechazo al Sindicato: hay ausencia.');
    await expect(cuerpo.locator('blockquote')).toHaveCount(7);
  });

  test('sin violaciones de accesibilidad', async ({ page }) => {
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test('no hay desplazamiento horizontal', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test('la portada del sitio muestra la nota con su imagen descrita', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-card .etiqueta')).toHaveText('Publicación principal');
  await expect(page.getByRole('link', { name: 'El Sindicato visto por su base' })).toBeVisible();
  await expect(page.locator('.hero-card img')).toHaveAttribute('alt', /52%/);
  await expect(page.locator('.hero-card')).toContainText('Iván Foronda');
  await expect(page.locator('.hero-card')).toContainText('19 de octubre de 2026');
});

test.describe('Sin aviso de privacidad (v1.4)', () => {
  test('el pie aclara que no es un sitio oficial de Banobras, del Gobierno ni del Sindicato', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('No es un sitio oficial de Banobras, del Gobierno de México ni del Sindicato Único Nacional de Trabajadores de Banobras.');
  });

  test('no hay enlaces, casilla ni página del aviso', async ({ page }) => {
    await page.goto('/#/colaborar');
    await expect(page.locator('#colaborar form')).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /aviso de privacidad/i })).toHaveCount(0);
    await page.goto(`/#/publicacion/${ID}`);
    await expect(page.getByRole('button', { name: 'Publicar comentario' })).toBeVisible();
    await expect(page.getByRole('link', { name: /aviso de privacidad/i })).toHaveCount(0);
    await page.goto('/#/aviso-de-privacidad');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada');
  });
});
