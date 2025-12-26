/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    headless: false,
    channel: 'chrome',
    launchOptions: { slowMo: 50 },
    baseURL: 'http://localhost:5174',
  },
  webServer: {
    command: 'npm run dev -- --port 5174',
    port: 5174,
    reuseExistingServer: true,
    timeout: 60_000,
  },
}
export default config
