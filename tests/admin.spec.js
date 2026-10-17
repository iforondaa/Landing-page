/** Administración en modo prototipo (LocalStorage): moderación de comentarios (spec v2.0). */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ID = '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f';
const CLAVE = 'landing.v1.comentarios';
const item = (page, n) => page.locator(`#moderar-${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`);

async function sembrar(page) {
  await page.goto('/');
  await page.evaluate(([k, id]) => localStorage.setItem(k, JSON.stringify([
    { id: '11111111-1111-4111-8111-111111111111', publicacion_id: id, autor: 'María', contenido: 'Primer comentario', fecha_creacion: '2026-10-19T15:00:00.000Z' },
    { id: '22222222-2222-4222-8222-222222222222', publicacion_id: id, autor: 'Anónimo', contenido: 'Comentario inapropiado', fecha_creacion: '2026-10-19T16:00:00.000Z' },
  ])), [CLAVE, ID]);
}

test.describe('Moderación de comentarios', () => {
  test.beforeEach(async ({ page }) => {
    await sembrar(page);
    await page.goto('/#/admin');
  });

  test('en modo prototipo no pide contraseña y avisa dónde se guardan los datos', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Colaboradores registrados');
    await expect(page.getByText('Modo prototipo:')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toHaveCount(0);
    await expect(page).toHaveTitle(/^Administración · /);
  });

  test('lista todos los comentarios, del más reciente al más antiguo, con su publicación', async ({ page }) => {
    const items = page.getByRole('list', { name: 'Comentarios para moderar' }).getByRole('listitem');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Comentario inapropiado');
    await expect(items.nth(1)).toContainText('María');
    await expect(items.nth(0).getByRole('link', { name: 'El Sindicato visto por su base' })).toHaveAttribute('href', `#/publicacion/${ID}`);
    await expect(page.getByText('2 comentarios, del más reciente al más antiguo.')).toBeVisible();
  });

  test('ocultar lo quita de la nota; mostrar lo devuelve', async ({ page }) => {
    await page.getByRole('button', { name: 'Ocultar el comentario de Anónimo' }).click();
    await expect(item(page, 2).getByText('Oculto al público')).toBeVisible();
    await expect(item(page, 1).getByText('Oculto al público')).toBeHidden();
    await expect(page.getByText('· 1 oculto al público.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mostrar el comentario de Anónimo' })).toBeFocused();

    await page.goto(`/#/publicacion/${ID}`);
    const publicados = page.getByRole('list', { name: 'Comentarios publicados' }).getByRole('listitem');
    await expect(publicados).toHaveCount(1);
    await expect(page.getByText('Comentario inapropiado')).toHaveCount(0);

    await page.goto('/#/admin');
    await page.getByRole('button', { name: 'Mostrar el comentario de Anónimo' }).click();
    await page.goto(`/#/publicacion/${ID}`);
    await expect(publicados).toHaveCount(2);
  });

  test('borrar pide confirmación; «Cancelar» no borra y «Sí, borrar» sí', async ({ page }) => {
    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    await expect(item(page, 2).getByText('¿Borrar este comentario para siempre?')).toBeVisible();
    await expect(item(page, 1).getByText('¿Borrar este comentario para siempre?')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('button', { name: 'Borrar el comentario de Anónimo' })).toBeFocused();

    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    await page.getByRole('button', { name: 'Sí, borrar' }).click();
    await expect(page.getByText('Comentario inapropiado')).toHaveCount(0);
    await expect(page.getByText('1 comentario, del más reciente al más antiguo.')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Se borró el comentario de Anónimo.' })).toHaveCount(1);
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).length, CLAVE)).toBe(1);
  });

  test('sin violaciones de accesibilidad ni desplazamiento horizontal (también con la confirmación abierta)', async ({ page }) => {
    await page.getByRole('button', { name: 'Ocultar el comentario de María' }).click();
    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test('sin comentarios: mensaje vacío', async ({ page }) => {
  await page.goto('/#/admin/exportar');
  await expect(page.getByRole('heading', { level: 2, name: 'Comentarios' })).toBeVisible();
  await expect(page.getByText('Aún no hay comentarios en ninguna publicación.')).toBeVisible();
});
