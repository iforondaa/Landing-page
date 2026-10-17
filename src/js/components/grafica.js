/**
 * Gráficas de la nota, dibujadas con HTML/CSS y SVG a partir de datos (spec: $defs/grafica).
 *
 * Accesibilidad: cada gráfica es una <figure> con título; los valores siempre se muestran
 * como texto junto a su etiqueta (lista), así que la información no depende del color.
 * Paleta validada (guía de visualización): ver tokens --viz-* en tokens.css.
 *  - barras: una serie → un solo tono (rosa) o, si hay `tono`, escala divergente rosa/azul.
 *  - barras-agrupadas: dos series (rosa y azul) con leyenda.
 *  - apilada: categorías ordenadas → rampa de un tono (claro → oscuro), etiquetas debajo.
 *  - dona: escala divergente con leyenda y valores.
 */
import { h } from '../lib/dom.js';

const fmt = (valor, unidad) => (unidad === 'menciones' ? `${valor}` : `${valor}%`);
const sufijoLector = (unidad) => (unidad === 'menciones' ? ' menciones' : '');

function encabezado(g) {
  return h('figcaption', { class: 'grafica__encabezado' },
    h('span', { class: 'grafica__titulo' }, g.titulo),
    g.nota ? h('span', { class: 'grafica__nota' }, g.nota) : null);
}

function leyenda(series) {
  return h('ul', { class: 'grafica__leyenda' },
    series.map((s, i) => h('li', {}, h('span', { class: `grafica__muestra grafica__muestra--s${i + 1}`, 'aria-hidden': 'true' }), s)));
}

function barras(g) {
  const unidad = g.unidad ?? '%';
  const series = g.series ?? [];
  const todos = g.datos.flatMap((d) => d.valores);
  const escala = unidad === '%' ? 100 : Math.max(...todos, 1);
  const filas = g.datos.map((d) => h('li', { class: 'grafica__fila' },
    h('span', { class: 'grafica__etiqueta' }, d.etiqueta),
    h('span', { class: 'grafica__barras' },
      d.valores.map((v, i) => h('span', { class: 'grafica__barra-fila' },
        h('span', {
          class: `grafica__barra grafica__barra--s${i + 1}${d.tono ? ` grafica__barra--${d.tono}` : ''}`,
          style: `--valor: ${Math.min(100, (v / escala) * 100).toFixed(2)}%`,
          'aria-hidden': 'true',
        }),
        h('span', { class: 'grafica__valor' },
          series[i] ? h('span', { class: 'visualmente-oculto' }, `${series[i]}: `) : null,
          fmt(v, unidad),
          h('span', { class: 'visualmente-oculto' }, sufijoLector(unidad))))))));
  return h('figure', { class: `grafica grafica--${g.variante}` },
    encabezado(g),
    series.length > 1 ? leyenda(series) : null,
    h('ul', { class: 'grafica__lista' }, filas));
}

function apilada(g) {
  const unidad = g.unidad ?? '%';
  const total = g.datos.reduce((s, d) => s + d.valores[0], 0) || 1;
  return h('figure', { class: 'grafica grafica--apilada' },
    encabezado(g),
    h('div', { class: 'grafica__pila', 'aria-hidden': 'true' },
      g.datos.map((d, i) => h('span', {
        class: `grafica__segmento grafica__segmento--o${Math.min(i + 1, 4)}`,
        style: `--valor: ${((d.valores[0] / total) * 100).toFixed(2)}%`,
      }))),
    h('ul', { class: 'grafica__claves' },
      g.datos.map((d, i) => h('li', {},
        h('span', { class: `grafica__muestra grafica__muestra--o${Math.min(i + 1, 4)}`, 'aria-hidden': 'true' }),
        h('strong', {}, fmt(d.valores[0], unidad)), ' ', d.etiqueta))));
}

function dona(g) {
  const unidad = g.unidad ?? '%';
  const total = g.datos.reduce((s, d) => s + d.valores[0], 0) || 1;
  const hueco = 0.8; // separación entre segmentos (en unidades de 100)
  let acumulado = 0;
  const segmentos = g.datos.map((d) => {
    const largo = (d.valores[0] / total) * 100;
    const inicio = acumulado;
    acumulado += largo;
    return { d, largo, inicio };
  });
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'grafica__dona');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const { d, largo, inicio } of segmentos) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', '38');
    c.setAttribute('pathLength', '100');
    c.setAttribute('class', `grafica__arco grafica__barra--${d.tono ?? 'positivo'}`);
    const visible = Math.max(0, largo - hueco);
    c.setAttribute('stroke-dasharray', `${visible} ${100 - visible}`);
    c.setAttribute('stroke-dashoffset', `${-inicio}`);
    svg.append(c);
  }
  return h('figure', { class: 'grafica grafica--dona' },
    encabezado(g),
    h('div', { class: 'grafica__dona-cuerpo' },
      svg,
      h('ul', { class: 'grafica__claves grafica__claves--columna' },
        g.datos.map((d) => h('li', {},
          h('span', { class: `grafica__muestra grafica__barra--${d.tono ?? 'positivo'}`, 'aria-hidden': 'true' }),
          h('strong', {}, fmt(d.valores[0], unidad)), ' ', d.etiqueta)))));
}

export function grafica(g) {
  switch (g.variante) {
    case 'apilada': return apilada(g);
    case 'dona': return dona(g);
    default: return barras(g); // 'barras' y 'barras-agrupadas'
  }
}
