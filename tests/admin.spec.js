/** Administración en modo prototipo (LocalStorage): revisión previa de comentarios (contrato 3.0.0). */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';

const ID = '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f';
const CLAVE = 'landing.v1.comentarios';
const UUID = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const item = (page, n) => page.locator(`#moderar-${UUID(n)}`);
const pendientes = (page) => page.getByRole('list', { name: 'Comentarios pendientes de revisión' }).getByRole('listitem');
const revisados = (page) => page.getByRole('list', { name: 'Comentarios revisados' }).getByRole('listitem');
const leer = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), CLAVE);
const publicados = async (page) => {
  await page.goto(`/#/publicacion/${ID}`);
  return page.getByRole('list', { name: 'Comentarios publicados' }).getByRole('listitem');
};

async function sembrar(page) {
  await page.goto('/');
  await page.evaluate(([k, id, u]) => localStorage.setItem(k, JSON.stringify([
    { id: u[1], publicacion_id: id, autor: 'María', contenido: 'Comentario ya publicado', fecha_creacion: '2026-11-10T15:00:00.000Z', estado: 'aprobado' },
    { id: u[2], publicacion_id: id, autor: 'Anónimo', contenido: 'Comentario por revisar', fecha_creacion: '2026-11-15T16:00:00.000Z', estado: 'pendiente' },
    { id: u[3], publicacion_id: id, autor: 'Jorge', contenido: 'Otro por revisar', fecha_creacion: '2026-11-16T17:00:00.000Z', estado: 'pendiente' },
    { id: u[4], publicacion_id: id, autor: 'X', contenido: 'Comentario rechazado', fecha_creacion: '2026-11-12T10:00:00.000Z', estado: 'rechazado' },
  ])), [CLAVE, ID, [null, UUID(1), UUID(2), UUID(3), UUID(4)]]);
}

test.describe('Revisión de comentarios', () => {
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

  test('avisa cuántos hay por revisar y «Revisar ahora» lleva a la sección', async ({ page }) => {
    await expect(page.getByText('Tienes 2 comentarios pendientes de revisión.')).toBeVisible();
    await page.getByRole('button', { name: 'Revisar ahora' }).click();
    await expect(page.getByRole('heading', { name: /Pendientes de revisión/ })).toBeFocused();
    await expect(page.getByRole('heading', { name: /Pendientes de revisión/ })).toContainText('(2)');
  });

  test('separa pendientes (más reciente primero) de revisados, con su estado y su publicación', async ({ page }) => {
    await expect(pendientes(page)).toHaveCount(2);
    await expect(pendientes(page).nth(0)).toContainText('Otro por revisar');
    await expect(pendientes(page).nth(1)).toContainText('Comentario por revisar');
    await expect(pendientes(page).nth(0)).toContainText('Pendiente');
    await expect(revisados(page)).toHaveCount(2);
    await expect(revisados(page).nth(0)).toContainText('Rechazado');
    await expect(revisados(page).nth(1)).toContainText('Publicado');
    await expect(item(page, 2).getByRole('link', { name: 'El Sindicato visto por su base' })).toHaveAttribute('href', `#/publicacion/${ID}`);
    // Botones según el estado
    await expect(item(page, 2).getByRole('button')).toHaveText(['Aprobar', 'Rechazar', 'Borrar']);
    await expect(item(page, 1).getByRole('button')).toHaveText(['Rechazar', 'Borrar']);
    await expect(item(page, 4).getByRole('button')).toHaveText(['Aprobar', 'Borrar']);
  });

  test('aprobar lo publica en la nota y lo pasa a revisados; el foco va al siguiente pendiente', async ({ page }) => {
    await expect(await publicados(page)).toHaveCount(1);
    await page.goto('/#/admin');
    await page.getByRole('button', { name: 'Aprobar el comentario de Jorge' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Se publicó el comentario de Jorge.' })).toHaveCount(1);
    await expect(pendientes(page)).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Pendientes de revisión/ })).toContainText('(1)');
    await expect(page.getByRole('button', { name: 'Aprobar el comentario de Anónimo' })).toBeFocused();
    await expect(item(page, 3)).toContainText('Publicado');
    expect((await leer(page)).find((c) => c.autor === 'Jorge').estado).toBe('aprobado');
    const lista = await publicados(page);
    await expect(lista).toHaveCount(2);
    await expect(lista.nth(1)).toContainText('Otro por revisar');
  });

  test('rechazar no lo publica; un publicado se puede retirar y un rechazado volver a aprobar', async ({ page }) => {
    await page.getByRole('button', { name: 'Rechazar el comentario de Anónimo' }).click();
    await expect(item(page, 2)).toContainText('Rechazado');
    await page.getByRole('button', { name: 'Rechazar el comentario de María' }).click();   // retirar uno publicado
    await page.getByRole('button', { name: 'Aprobar el comentario de X' }).click();       // aprobar uno rechazado
    const lista = await publicados(page);
    await expect(lista).toHaveCount(1);
    await expect(lista.first()).toContainText('Comentario rechazado');
    await expect(page.getByText('Comentario por revisar')).toHaveCount(0);
  });

  test('borrar pide confirmación; «Cancelar» no borra y «Sí, borrar» sí', async ({ page }) => {
    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    await expect(item(page, 2).getByText('¿Borrar este comentario para siempre?')).toBeVisible();
    await expect(item(page, 2).getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await item(page, 2).getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('button', { name: 'Borrar el comentario de Anónimo' })).toBeFocused();
    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    await item(page, 2).getByRole('button', { name: 'Sí, borrar' }).click();
    await expect(page.getByText('Comentario por revisar')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: 'Se borró el comentario de Anónimo.' })).toHaveCount(1);
    expect(await leer(page)).toHaveLength(3);
  });

  test('sin violaciones de accesibilidad ni desplazamiento horizontal (también con la confirmación abierta)', async ({ page }) => {
    await page.getByRole('button', { name: 'Borrar el comentario de Anónimo' }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test('sin comentarios: mensajes vacíos y sin aviso de pendientes', async ({ page }) => {
  await page.goto('/#/admin/exportar');
  await expect(page.getByRole('heading', { level: 2, name: /Pendientes de revisión/ })).toContainText('(0)');
  await expect(page.getByText('No hay comentarios por revisar.')).toBeVisible();
  await expect(page.getByText('Aún no hay comentarios revisados.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revisar ahora' })).toHaveCount(0);
});

test('un comentario enviado desde la nota llega a «Pendientes de revisión»', async ({ page }) => {
  await page.goto(`/#/publicacion/${ID}`);
  await page.getByLabel('Tu nombre').fill('Laura');
  await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Me parece muy útil.');
  await page.getByRole('button', { name: 'Enviar comentario' }).click();
  await expect(page.getByText('¡Gracias por tu comentario!')).toBeVisible();
  await page.goto('/#/admin');
  await expect(page.getByText('Tienes 1 comentario pendiente de revisión.')).toBeVisible();
  await expect(pendientes(page)).toHaveCount(1);
  await expect(pendientes(page).first()).toContainText('Laura');
});
