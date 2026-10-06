import { describe, it, expect } from 'vitest';
import { normalizarRuta, coincidir } from '../src/js/router.js';
import { formatearFecha, formatearFechaHora, enParrafos } from '../src/js/lib/formato.js';

const vista = () => {};
const RUTAS = [
  { patron: '/', vista },
  { patron: '/colaborar', vista, seccion: 'colaborar' },
  { patron: '/publicacion/:id', vista },
];

describe('normalizarRuta', () => {
  it.each([
    ['', '/'], ['#', '/'], ['#/', '/'], ['#/colaborar', '/colaborar'], ['#/colaborar/', '/colaborar'],
    ['#colaborar', '/colaborar'], ['#/publicacion/abc?x=1', '/publicacion/abc'],
  ])('%j → %j', (entrada, esperado) => expect(normalizarRuta(entrada)).toBe(esperado));
});

describe('coincidir', () => {
  it('resuelve rutas fijas y con parámetros', () => {
    expect(coincidir(RUTAS, '#/').ruta.patron).toBe('/');
    expect(coincidir(RUTAS, '#/colaborar').ruta.seccion).toBe('colaborar');
    expect(coincidir(RUTAS, '#/publicacion/7d2e').params).toEqual({ id: '7d2e' });
  });
  it('decodifica parámetros y rechaza codificaciones inválidas', () => {
    expect(coincidir(RUTAS, '#/publicacion/a%20b').params.id).toBe('a b');
    expect(coincidir(RUTAS, '#/publicacion/%E0%A4%A')).toBeNull();
  });
  it('devuelve null si no hay coincidencia', () => {
    expect(coincidir(RUTAS, '#/no-existe')).toBeNull();
    expect(coincidir(RUTAS, '#/publicacion')).toBeNull();
    expect(coincidir(RUTAS, '#/publicacion/a/b')).toBeNull();
  });
});

describe('formato', () => {
  it('fecha larga en español, hora de la Ciudad de México', () => {
    expect(formatearFecha('2026-09-30T12:00:00.000Z')).toBe('30 de septiembre de 2026');
    expect(formatearFecha('2026-10-01T03:00:00.000Z')).toBe('30 de septiembre de 2026'); // 21:00 del 30 en CDMX
  });
  it('fecha y hora en español, hora de la Ciudad de México', () => {
    // El conector entre fecha y hora varía según el motor ("a las" en Node, "," en Chrome).
    const texto = formatearFechaHora('2026-10-01T00:05:00.000Z').replace(/\s+/gu, ' ');
    expect(texto).toMatch(/^30 de septiembre de 2026(,| a las) 6:05 p\.m\.$/);
  });
  it('una fecha dañada se muestra tal cual en lugar de lanzar error', () => {
    expect(formatearFecha('no-es-fecha')).toBe('no-es-fecha');
    expect(formatearFechaHora(undefined)).toBe('');
  });
  it('divide en párrafos por línea en blanco', () => {
    expect(enParrafos('Uno.\n\nDos.\n  \nTres.\n')).toEqual(['Uno.', 'Dos.', 'Tres.']);
  });
});
