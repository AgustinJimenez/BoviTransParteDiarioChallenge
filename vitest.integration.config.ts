import { defineConfig } from "vitest/config";
import path from "path";

const TEST_DB_URL = "postgresql://bovitrans:bovitrans_pass@localhost:5432/bovitrans_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/integration/**/*.integration.test.ts"],
    globalSetup: "./src/integration/globalSetup.ts",
    setupFiles: ["./src/integration/testSetup.ts"],
    env: {
      DATABASE_URL: TEST_DB_URL,
    },
    // Single forked process so all tests share one Prisma connection and sequential DB access
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
