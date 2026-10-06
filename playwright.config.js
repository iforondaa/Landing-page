import { defineConfig, devices } from '@playwright/test';

const PUERTO = 5173;

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.js',
  // En GitHub Actions (CI) también se genera un reporte HTML para revisar fallas.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: 'es-MX',
    // Permite usar un Chromium ya instalado: CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx --yes serve@14 src -l ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
  },
});
