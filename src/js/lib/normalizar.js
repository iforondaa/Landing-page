/**
 * Regla transversal del contrato (spec/openapi.yaml): antes de validar se recortan
 * espacios y se omiten los campos opcionales vacíos. La usan el adaptador de datos
 * y los formularios, para que ambos validen exactamente lo mismo.
 */
export const OPCIONALES = Object.freeze({
  colaborador: Object.freeze(['telefono', 'area_adscripcion', 'comentario_propuesta']),
  comentario: Object.freeze(['autor']),
});

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Espacios y caracteres invisibles (espacio de ancho cero, unión, BOM) al inicio y al final. */
const EXTREMOS_INVISIBLES = /^[\s\u200B-\u200D\u2060\uFEFF]+|[\s\u200B-\u200D\u2060\uFEFF]+$/gu;

/** Recorta espacios e invisibles de los extremos; "​​" (solo invisibles) queda vacío. */
export const recortar = (texto) => texto.replace(EXTREMOS_INVISIBLES, '');

export function limpiarEntrada(entrada, opcionales = []) {
  if (!esObjeto(entrada)) return entrada;
  const limpio = {};
  for (const [clave, valor] of Object.entries(entrada)) {
    const v = typeof valor === 'string' ? recortar(valor) : valor;
    if (opcionales.includes(clave) && (v === '' || v === null || v === undefined)) continue;
    limpio[clave] = v;
  }
  return limpio;
}
