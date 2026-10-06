/**
 * Crea elementos del DOM de forma segura: los hijos de texto se insertan como
 * nodos de texto (nunca como HTML), así el contenido de los usuarios no puede
 * inyectar código.
 *
 *   h('a', { href: '#/', class: 'enlace' }, 'Inicio')
 */
export function h(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos ?? {})) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (clave === 'class') el.className = valor;
    else if (clave.startsWith('on') && typeof valor === 'function') el.addEventListener(clave.slice(2).toLowerCase(), valor);
    else el.setAttribute(clave, valor === true ? '' : String(valor));
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : String(hijo));
  }
  return el;
}

/** Agrupa varios nodos sin un contenedor adicional. */
export function fragmento(...hijos) {
  const f = document.createDocumentFragment();
  for (const hijo of hijos.flat(Infinity)) if (hijo) f.append(hijo);
  return f;
}
