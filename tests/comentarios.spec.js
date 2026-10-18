/** Pruebas de aceptación de la vista de lectura y los comentarios (Tarea 2 · Escenario BDD 2). */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';
import { IDENTIDAD } from '../src/js/identidad.js';

const PRINCIPAL = '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f';
const OTRA = 'b4c5d6e7-f809-4a1b-9c2d-3e4f5a6b7c8d'; // id de otra publicación (no existe en la semilla actual)
const CLAVE = 'landing.v1.comentarios';
const leer = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), CLAVE);
const publicar = (page) => page.getByRole('button', { name: 'Publicar comentario' }).click();
const lista = (page) => page.getByRole('list', { name: 'Comentarios publicados' }).getByRole('listitem');

test.describe('Vista de lectura', () => {
  test('al hacer clic en la publicación principal se abre la nota completa', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'El Sindicato visto por su base' }).click();
    await expect(page).toHaveURL(new RegExp(`#/publicacion/${PRINCIPAL}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('El Sindicato visto por su base');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.locator('.nota__cuerpo .bloque-seccion')).toHaveCount(8); // las 8 secciones del informe
    await expect(page).toHaveTitle(`El Sindicato visto por su base · ${IDENTIDAD.nombre}`);
  });

  test('"Volver a publicaciones" regresa al inicio', async ({ page }) => {
    await page.goto(`/#/publicacion/${PRINCIPAL}`);
    await page.getByRole('link', { name: 'Volver a publicaciones' }).click();
    await expect(page.locator('.hero-card')).toBeVisible();
  });

  test('publicación inexistente muestra "no encontrada"', async ({ page }) => {
    await page.goto('/#/publicacion/00000000-0000-4000-8000-000000000000');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Publicación no encontrada');
  });
});

test.describe('Comentarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/#/publicacion/${PRINCIPAL}`);
    await expect(page.getByRole('button', { name: 'Publicar comentario' })).toBeVisible();
  });

  test('Escenario 2: comentario sin nombre se publica al instante como "Anónimo"', async ({ page }) => {
    // GIVEN el lector está en el detalle de la nota
    await expect(page.getByText('Aún no hay comentarios.')).toBeVisible();
    // WHEN escribe un comentario dejando el nombre vacío y publica
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Excelente nota, muy clara.');
    await publicar(page);
    // THEN se guarda…
    const [guardado, ...resto] = await leer(page);
    expect(resto).toHaveLength(0);
    expect(guardado).toMatchObject({ publicacion_id: PRINCIPAL, autor: 'Anónimo', contenido: 'Excelente nota, muy clara.' });
    // …y se muestra con autor "Anónimo", sin recargar
    await expect(lista(page)).toHaveCount(1);
    await expect(lista(page).first()).toContainText('Anónimo');
    await expect(lista(page).first()).toContainText('Excelente nota, muy clara.');
    await expect(page.getByText('Aún no hay comentarios.')).toBeHidden();
    await expect(page.getByRole('heading', { name: /Comentarios/ , level: 2 })).toContainText('(1)');
    await expect(page.getByRole('status').filter({ hasText: 'Tu comentario se publicó como Anónimo.' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Comentario', exact: true })).toHaveValue('');
  });

  test('con nombre: se muestra el nombre; orden del más antiguo al más reciente; persiste al recargar', async ({ page }) => {
    await page.getByLabel('Tu nombre').fill('María Pérez');
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Primero');
    await publicar(page);
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Segundo');
    await publicar(page);
    await expect(lista(page)).toHaveCount(2);
    await expect(lista(page).nth(0)).toContainText('María Pérez');
    await expect(lista(page).nth(0)).toContainText('Primero');
    await expect(lista(page).nth(1)).toContainText('Anónimo');
    await page.reload();
    await expect(lista(page)).toHaveCount(2);
    await expect(lista(page).nth(1)).toContainText('Segundo');
  });

  test('comentario vacío o solo espacios no se publica', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Comentario', exact: true });
    await campo.fill('    ');
    await publicar(page);
    await expect(campo).toBeFocused();
    await expect(campo).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#comentario-contenido-error')).toHaveText('Este campo es obligatorio.');
    expect(await leer(page)).toHaveLength(0);
    await campo.fill('Ya escribí algo');
    await expect(campo).toHaveAttribute('aria-invalid', 'false');
  });

  test('límite de 2,000 caracteres con contador', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Comentario', exact: true });
    await campo.fill('x'.repeat(1900));
    await expect(page.locator('#comentario-contenido-contador')).toHaveText('1,900 / 2,000 caracteres');
    await campo.fill('x'.repeat(2001));
    await expect(campo).toHaveAttribute('aria-invalid', 'true'); // aviso en vivo al pasar el límite
    await expect(page.locator('#comentario-contenido-error')).toHaveText('No debe exceder 2000 caracteres.');
    await campo.fill('x'.repeat(2000));
    await expect(campo).toHaveAttribute('aria-invalid', 'false');
  });

  test('revisión D1: los emojis cuentan como 1 carácter, igual que el contrato', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Comentario', exact: true });
    await campo.fill('😀'.repeat(2000));
    expect([...(await campo.inputValue())].length).toBe(2000); // el navegador no lo recorta a 1,000
    await expect(page.locator('#comentario-contenido-contador')).toHaveText('2,000 / 2,000 caracteres');
    await publicar(page);
    await expect(lista(page)).toHaveCount(1);
  });

  test('revisión C1: un comentario de solo caracteres invisibles no se publica', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('\u200B\u200B\uFEFF');
    await publicar(page);
    await expect(page.locator('#comentario-contenido-error')).toHaveText('Este campo es obligatorio.');
    expect(await leer(page)).toHaveLength(0);
  });

  test('nombre de más de 120 caracteres muestra su error y no se publica', async ({ page }) => {
    await page.getByLabel('Tu nombre').fill('N'.repeat(121));
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Hola');
    await publicar(page);
    await expect(page.getByLabel('Tu nombre')).toBeFocused();
    await expect(page.locator('#comentario-autor-error')).toHaveText('No debe exceder 120 caracteres.');
    expect(await leer(page)).toHaveLength(0);
  });

  test('revisión D2: la inicial del avatar no parte un emoji', async ({ page }) => {
    await page.getByLabel('Tu nombre').fill('😀Ana');
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Hola');
    await publicar(page);
    await expect(lista(page).first().locator('.comentario__avatar')).toHaveText('😀');
  });

  test('el texto de los usuarios no se interpreta como HTML', async ({ page }) => {
    let dialogo = false;
    page.on('dialog', async (d) => { dialogo = true; await d.dismiss(); });
    const ataque = '<img src=x onerror="alert(1)"><b>negritas</b>';
    await page.getByLabel('Tu nombre').fill('<script>alert(2)</script>');
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill(ataque);
    await publicar(page);
    await expect(lista(page).first()).toContainText(ataque);
    await expect(lista(page).first().locator('img, b, script')).toHaveCount(0);
    await page.reload();
    await expect(lista(page).first()).toContainText(ataque);
    expect(dialogo).toBe(false);
  });

  test('regresión: un nombre o una palabra muy largos no desbordan la página', async ({ page }) => {
    await page.getByLabel('Tu nombre').fill('N'.repeat(120));
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill(`https://ejemplo.mx/${'a'.repeat(300)}`);
    await publicar(page);
    await expect(lista(page)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('conserva los saltos de línea del comentario', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Línea 1\n\nLínea 2');
    await publicar(page);
    const texto = await lista(page).first().locator('.comentario__contenido').innerText();
    expect(texto).toBe('Línea 1\n\nLínea 2');
  });

  test('los comentarios son de cada publicación', async ({ page }) => {
    // Un comentario guardado para otra publicación no debe aparecer en esta.
    await page.evaluate(([k, otra]) => localStorage.setItem(k, JSON.stringify([{
      id: '11111111-1111-4111-8111-111111111111', publicacion_id: otra, autor: 'X', contenido: 'De otra nota', fecha_creacion: '2026-10-01T00:00:00.000Z',
    }])), [CLAVE, OTRA]);
    await page.reload();
    await expect(page.getByText('Aún no hay comentarios.')).toBeVisible();
    await expect(page.getByText('De otra nota')).toHaveCount(0);
  });

  test('si el almacenamiento falla al publicar, avisa y conserva el texto', async ({ page }) => {
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('lleno', 'QuotaExceededError'); }; });
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('No se va a guardar');
    await publicar(page);
    await expect(page.getByRole('alert')).toContainText('No se pudo guardar o leer la información');
    await expect(page.getByRole('textbox', { name: 'Comentario', exact: true })).toHaveValue('No se va a guardar');
    await expect(lista(page)).toHaveCount(0);
  });

  test('si los comentarios guardados están dañados, la nota se sigue leyendo', async ({ page }) => {
    await page.evaluate((k) => localStorage.setItem(k, '{dañado'), CLAVE);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('No pudimos cargar los comentarios');
  });

  test('sin violaciones de accesibilidad (con comentarios y con error)', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Comentario', exact: true }).fill('Comentario de prueba');
    await publicar(page);
    await publicar(page); // vacío → muestra error
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
