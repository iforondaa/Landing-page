/**
 * Identidad del sitio: ÚNICO lugar para cambiar el nombre y el lema (definitivos desde la v1.4).
 * Al arrancar, main.js copia estos textos en todos los elementos marcados con
 * data-identidad="nombre" | "lema" y en el título de la pestaña.
 * index.html conserva el mismo texto como respaldo (una prueba verifica que coincidan).
 */
export const IDENTIDAD = Object.freeze({
  nombre: 'El Banobrino',
  lema: 'Acercando el Sindicato a las y los trabajadores',
});

export function aplicarIdentidad(doc = document) {
  for (const el of doc.querySelectorAll('[data-identidad]')) {
    const texto = IDENTIDAD[el.dataset.identidad];
    if (texto !== undefined) el.textContent = texto;
  }
  doc.querySelector('.marca')?.setAttribute('aria-label', `${IDENTIDAD.nombre}, ir al inicio`);
  doc.title = IDENTIDAD.nombre;
}
