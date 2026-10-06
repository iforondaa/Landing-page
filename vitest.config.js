import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pruebas unitarias y de contrato. Las de aceptación (Playwright) usan *.spec.js.
    include: ['tests/**/*.test.js'],
  },
});
