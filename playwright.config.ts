import { defineConfig, devices } from "@playwright/test";

const E2E_DB_URL = "postgresql://bovitrans:bovitrans_pass@localhost:5432/bovitrans_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/globalSetup.ts",
  globalTeardown: "./tests/e2e/globalSetup.ts",

  // Run tests serially to avoid DB conflicts
  workers: 1,
  fullyParallel: false,

  reporter: "list",

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // next start (production) doesn't conflict with a running next dev instance
    // Requires a prior build: npm run build
    command: `DATABASE_URL="${E2E_DB_URL}" next start -p 3001`,
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
