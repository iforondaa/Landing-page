/**
 * Pruebas de aceptación (Playwright) — escenarios BDD de spec/landing-spec.md.
 * Ejecutar: npx playwright install chromium (una vez) y luego npm run test:e2e
 */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';

const CLAVE = 'landing.v1.colaboradores';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const leerRegistros = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), CLAVE);

test.describe('Formulario "Quiero colaborar"', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/colaborar');
    await expect(page.getByRole('button', { name: 'Enviar registro' })).toBeVisible();
  });

  test('Escenario 1: registro válido se persiste y muestra confirmación', async ({ page }) => {
    // GIVEN el usuario está en el formulario · WHEN completa nombre y correo válidos y envía
    await page.getByLabel('Nombre completo').fill('Antonio Machado Ruiz');
    await page.getByLabel('Correo electrónico').fill('ejemplo@banobras.gob.mx');
    await page.getByRole('button', { name: 'Enviar registro' }).click();

    // THEN se muestra la confirmación en pantalla…
    const confirmacion = page.locator('.confirmacion');
    await expect(confirmacion).toBeVisible();
    await expect(confirmacion).toContainText('¡Registro recibido!');
    await expect(confirmacion).toContainText('Antonio Machado Ruiz');
    await expect(confirmacion).toBeFocused();

    // …y los datos se persisten con la forma del contrato
    const [registro, ...resto] = await leerRegistros(page);
    expect(resto).toHaveLength(0);
    expect(registro).toMatchObject({ nombre_completo: 'Antonio Machado Ruiz', email: 'ejemplo@banobras.gob.mx' });
    expect(registro.id).toMatch(UUID);
    expect(Number.isNaN(Date.parse(registro.fecha_registro))).toBe(false);
    expect(Object.keys(registro).sort()).toEqual(['email', 'fecha_registro', 'id', 'nombre_completo']);

    // Los datos sobreviven a recargar la página
    await page.reload();
    expect(await leerRegistros(page)).toHaveLength(1);
  });

  test('guarda los campos opcionales cuando se llenan', async ({ page }) => {
    await page.getByLabel('Nombre completo').fill('Ana López');
    await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
    await page.getByLabel('Teléfono').fill('554-365-0920');
    await page.getByLabel('Área de adscripción').fill('Dirección de Crédito');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(page.locator('.confirmacion')).toBeVisible();
    expect((await leerRegistros(page))[0]).toMatchObject({ telefono: '554-365-0920', area_adscripcion: 'Dirección de Crédito' });
  });

  test('envío vacío: marca los obligatorios, enfoca el primero y no guarda nada', async ({ page }) => {
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    const nombre = page.getByLabel('Nombre completo');
    await expect(nombre).toBeFocused();
    await expect(nombre).toHaveAttribute('aria-invalid', 'true');
    await expect(nombre).toHaveAccessibleDescription('Este campo es obligatorio.');
    await expect(page.getByLabel('Correo electrónico')).toHaveAccessibleDescription('Este campo es obligatorio.');
    await expect(page.getByLabel('Teléfono')).toHaveAttribute('aria-invalid', 'false');
    await expect(page.getByRole('status').filter({ hasText: 'Revisa los 2 campos marcados.' })).toHaveCount(1);
    expect(await leerRegistros(page)).toHaveLength(0);
  });

  test('formatos inválidos muestran mensajes claros y se corrigen en vivo', async ({ page }) => {
    const email = page.getByLabel('Correo electrónico');
    const tel = page.getByLabel('Teléfono');
    await page.getByLabel('Nombre completo').fill('Ana López');
    await email.fill('ana@');
    await tel.fill('5543');
    await tel.blur();
    await expect(email).toHaveAccessibleDescription('Escribe un correo válido, ej. nombre@dominio.com.');
    await expect(tel).toHaveAccessibleDescription('Escribe 10 dígitos; puedes separarlos con guiones, ej. 55-4365-0920.');
    await email.fill('ana@gmail.com');
    await expect(email).toHaveAttribute('aria-invalid', 'false');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(tel).toBeFocused();
    expect(await leerRegistros(page)).toHaveLength(0);
  });

  test('regresión: clic en "Enviar" mientras el campo activo tiene un error sí se procesa', async ({ page }) => {
    // Al salir del teléfono aparece su error y desplaza el botón; el clic no debe perderse.
    await page.getByLabel('Teléfono').fill('5543');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(page.getByLabel('Nombre completo')).toBeFocused();
    await expect(page.getByLabel('Nombre completo')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Teléfono')).toHaveAttribute('aria-invalid', 'true');
  });

  test('nombre de 1 carácter se rechaza; 120 emojis se aceptan (cuentan como caracteres)', async ({ page }) => {
    const nombre = page.getByLabel('Nombre completo');
    await nombre.fill('A');
    await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(nombre).toHaveAccessibleDescription('Debe tener al menos 2 caracteres.');
    await nombre.fill('😀'.repeat(120));
    expect([...(await nombre.inputValue())].length).toBe(120);
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(page.locator('.confirmacion')).toBeVisible();
  });

  test('"Publicaciones" del encabezado lleva a la publicación principal', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Publicaciones' }).click();
    await expect(page).toHaveURL(/#\/publicaciones$/);
    await expect(page.locator('.hero-card')).toBeInViewport();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Publicaciones' })).toHaveAttribute('aria-current', 'page');
  });

  test('ajuste 3: teléfono con guiones en cualquier posición (10 dígitos) se acepta', async ({ page }) => {
    for (const tel of ['55-4365-0920', '55-43-65-09-20']) {
      const otra = page.getByRole('button', { name: 'Registrar a otra persona' });
      if (await otra.isVisible()) await otra.click();
      await page.getByLabel('Nombre completo').fill('Ana López');
      await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
      await page.getByLabel('Teléfono').fill(tel);
      await page.getByRole('button', { name: 'Enviar registro' }).click();
      await expect(page.locator('.confirmacion')).toBeVisible();
    }
    expect((await leerRegistros(page)).map((r) => r.telefono).sort()).toEqual(['55-43-65-09-20', '55-4365-0920']);
  });

  test('ajuste 2: "Comentario o propuesta" es opcional, más alto que los demás campos y se guarda', async ({ page }) => {
    const campo = page.getByRole('textbox', { name: 'Comentario o propuesta' });
    await expect(campo).toHaveAttribute('placeholder', /^ej\. /);
    await expect(page.locator('label[for="colaborar-comentario_propuesta"]')).toContainText('(opcional)');
    const alto = async (loc) => (await loc.boundingBox()).height;
    expect(await alto(campo)).toBeGreaterThan(2 * (await alto(page.getByLabel('Teléfono')))); // espacio para explayarse
    await campo.fill('Propongo pláticas sobre prestaciones.\n\nGracias.');
    await expect(page.locator('#colaborar-comentario_propuesta-contador')).toHaveText('47 / 2,000 caracteres');
    await page.getByLabel('Nombre completo').fill('Ana López');
    await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(page.locator('.confirmacion')).toBeVisible();
    expect((await leerRegistros(page))[0].comentario_propuesta).toBe('Propongo pláticas sobre prestaciones.\n\nGracias.');
  });

  test('solo pasar por un campo vacío no muestra error', async ({ page }) => {
    const nombre = page.getByLabel('Nombre completo');
    await nombre.focus();
    await page.keyboard.press('Tab');
    await expect(nombre).toHaveAttribute('aria-invalid', 'false');
  });

  test('el texto de ejemplo desaparece al recibir foco (spec 2.3)', async ({ page }) => {
    const nombre = page.getByLabel('Nombre completo');
    await expect(nombre).toHaveAttribute('placeholder', 'ej. Antonio Machado Ruiz');
    const color = () => nombre.evaluate((el) => getComputedStyle(el, '::placeholder').color);
    expect(await color()).not.toBe('rgba(0, 0, 0, 0)');
    await nombre.focus();
    await expect.poll(color).toBe('rgba(0, 0, 0, 0)');
  });

  test('"Registrar a otra persona" deja el formulario limpio', async ({ page }) => {
    await page.getByLabel('Nombre completo').fill('Ana López');
    await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await page.getByRole('button', { name: 'Registrar a otra persona' }).click();
    await expect(page.getByLabel('Nombre completo')).toHaveValue('');
    await expect(page.getByLabel('Nombre completo')).toBeFocused();
  });

  test('si el almacenamiento falla, avisa y conserva lo escrito', async ({ page }) => {
    await page.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException('lleno', 'QuotaExceededError'); };
    });
    await page.getByLabel('Nombre completo').fill('Ana López');
    await page.getByLabel('Correo electrónico').fill('ana@gmail.com');
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    await expect(page.getByRole('alert')).toContainText('No se pudo guardar o leer la información');
    await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana López');
    await expect(page.getByRole('button', { name: 'Enviar registro' })).toBeEnabled();
  });

  test('"Quiero colaborar" del encabezado lleva al formulario', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Quiero colaborar' }).click();
    await expect(page.getByLabel('Nombre completo')).toBeInViewport();
  });

  test('sin violaciones de accesibilidad, también con errores visibles', async ({ page }) => {
    await page.getByRole('button', { name: 'Enviar registro' }).click();
    const r = await new AxeBuilder({ page }).include('#colaborar').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
