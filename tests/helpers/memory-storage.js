/** Sustituto de LocalStorage en memoria, con opción de simular fallos. */
export class MemoryStorage {
  constructor() {
    this.datos = new Map();
    this.fallarEn = null; // 'getItem' | 'setItem' | null
  }
  getItem(clave) {
    if (this.fallarEn === 'getItem') throw new Error('SecurityError simulado');
    return this.datos.has(clave) ? this.datos.get(clave) : null;
  }
  setItem(clave, valor) {
    if (this.fallarEn === 'setItem') throw new Error('QuotaExceededError simulado');
    this.datos.set(clave, String(valor));
  }
  removeItem(clave) {
    this.datos.delete(clave);
  }
}
