/** Pruebas de aceptación de la consulta y descarga CSV (Tarea 4 · spec 6.4). */
import { test, expect } from './helpers/test-local.js';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

async function registrar(page, nombre, email, extra = {}) {
  const otra = page.getByRole('button', { name: 'Registrar a otra persona' });
  if (await otra.isVisible()) await otra.click(); // como lo haría una persona tras registrar a alguien
  else await page.goto('/#/colaborar');
  await page.getByLabel('Nombre completo').fill(nombre);
  await page.getByLabel('Correo electrónico').fill(email);
  if (extra.telefono) await page.getByLabel('Teléfono').fill(extra.telefono);
  if (extra.area) await page.getByLabel('Área de adscripción').fill(extra.area);
  if (extra.comentario) await page.getByRole('textbox', { name: 'Comentario o propuesta' }).fill(extra.comentario);
  await page.getByRole('button', { name: 'Enviar registro' }).click();
  await expect(page.locator('.confirmacion')).toBeVisible();
}

test('sin registros: aviso y botón deshabilitado', async ({ page }) => {
  await page.goto('/#/admin/exportar');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Colaboradores registrados');
  await expect(page.getByText('Aún no hay registros.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar CSV' })).toBeDisabled();
});

test('la vista no aparece en el encabezado', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link')).toHaveText(['Publicaciones', 'Quiero colaborar']);
});

test('consulta: tabla del más reciente al más antiguo y descarga CSV con el contrato', async ({ page }) => {
  await registrar(page, 'Antonio Machado Ruiz', 'ejemplo@banobras.gob.mx');
  await registrar(page, 'José "Pepe" Muñoz, Jr.', 'pepe@gmail.com', { telefono: '55-4365-0920', area: 'Dirección de Crédito', comentario: 'Propongo "pláticas", talleres.' });
  await registrar(page, '=HYPERLINK("http://malo")', 'x@x.mx');

  await page.goto('/#/admin/exportar');
  const filas = page.locator('.tabla tbody tr');
  await expect(filas).toHaveCount(3);
  await expect(filas.nth(0)).toContainText('=HYPERLINK');               // el más reciente primero
  await expect(filas.nth(1)).toContainText('José "Pepe" Muñoz, Jr.');
  await expect(filas.nth(2)).toContainText('Antonio Machado Ruiz');
  await expect(filas.nth(2)).toContainText('Sin dato');                  // teléfono vacío
  await expect(page.getByText('3 registros, del más reciente al más antiguo.')).toBeVisible();

  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar CSV' }).click(),
  ]);
  expect(descarga.suggestedFilename()).toMatch(/^colaboradores_\d{4}-\d{2}-\d{2}\.csv$/);
  const contenido = fs.readFileSync(await descarga.path(), 'utf8');
  expect(contenido.charCodeAt(0)).toBe(0xfeff);                       // BOM para Excel
  const lineas = contenido.slice(1).split('\r\n');
  expect(lineas[0]).toBe('"id","nombre_completo","email","telefono","area_adscripcion","comentario_propuesta","fecha_registro"');
  expect(lineas).toHaveLength(5);                                      // encabezado + 3 + línea final vacía
  expect(lineas[1]).toContain(`"'=HYPERLINK(""http://malo"")"`);       // fórmula neutralizada
  expect(lineas[2]).toContain('"José ""Pepe"" Muñoz, Jr.","pepe@gmail.com","55-4365-0920","Dirección de Crédito","Propongo ""pláticas"", talleres."');
  expect(lineas[3]).toMatch(/^"[0-9a-f-]{36}","Antonio Machado Ruiz","ejemplo@banobras\.gob\.mx","","","","\d{4}-\d{2}-\d{2}T[\d:.]+Z"$/);
  await expect(page.getByRole('status').filter({ hasText: 'con 3 registros' })).toHaveCount(1);
});

test('regresión: la tabla se desplaza dentro de su caja y no ensancha la página', async ({ page }) => {
  await registrar(page, 'Ana López', 'ana@gmail.com');
  await registrar(page, 'Luis Pérez', 'luis@gmail.com');
  await page.goto('/#/admin/exportar');
  await expect(page.locator('.tabla tbody tr')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('revisión C3: un registro con fecha dañada no tumba la vista', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('landing.v1.colaboradores', JSON.stringify([
    { id: '3f6c2a1e-8b4d-4c2a-9e1f-5a7b8c9d0e1f', nombre_completo: 'Ana', email: 'a@b.mx', fecha_registro: 'no-es-fecha' },
  ])));
  await page.goto('/#/admin/exportar');
  await expect(page.locator('.tabla tbody tr')).toHaveCount(1);
  await expect(page.locator('.tabla tbody tr')).toContainText('no-es-fecha');
});

test('sin violaciones de accesibilidad con tabla', async ({ page }) => {
  await registrar(page, 'Ana López', 'ana@gmail.com');
  await page.goto('/#/admin/exportar');
  await expect(page.locator('.tabla')).toBeVisible();
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
