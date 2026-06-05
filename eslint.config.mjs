import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";
import playwright from "eslint-plugin-playwright";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
  {
    // Arrow functions inside components — scoped to .tsx to avoid breaking Next.js API route exports
    files: ["src/**/*.tsx"],
    rules: {
      "func-style": ["error", "expression"],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      "react/function-component-definition": ["error", {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      }],
    },
  },
  {
    // Extra a11y rules beyond eslint-config-next defaults
    // (plugin already registered by eslint-config-next — no re-declaration needed)
    files: ["src/**/*.tsx"],
    rules: {
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      "jsx-a11y/no-autofocus": "warn",
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["error", {
        mode: "jsx-only",
        "jsx-attributes": {
          include: ["label", "placeholder", "hint", "title", "alt"],
        },
        callees: {
          exclude: [
            // next-intl translation calls (any alias of useTranslations result)
            "t", "t.rich", "tf", "useTranslations",
            // react-hook-form field registration
            "register",
            // JS number/date formatting — locale identifiers, not UI text
            "toLocaleString", "toFixed", "toLocaleDateString",
            // Next.js router
            "router.push", "router.replace",
          ],
        },
        "object-properties": {
          exclude: ["color", "bg", "className", "href", "key", "variable"],
        },
        words: {
          exclude: [
            // Locale identifiers
            "^es-AR$",
            // Unit symbols and mathematical operators used in formula display
            "^km$", "^L/km$", "^/L$", "^×$", "^=$",
            // Placeholder dash for missing values
            "^—$",
            // Pure symbols / punctuation
            "^[·\\-→✓⚠️×$/#]+$",
            // Brand name parts
            "^Bovi$", "^Trans$",
            // Purely numeric
            "^\\d+(\\.\\d+)?$",
          ],
        },
      }],
    },
  },
]);

// Playwright E2E test quality rules — separate from the main config array
// (flat/recommended must not be nested inside defineConfig)
const playwrightConfig = {
  files: ["tests/e2e/**/*.spec.ts"],
  plugins: { playwright },
  rules: {
    ...playwright.configs["flat/recommended"].rules,
    // Prefer getByTestId/getByRole/getByLabel over raw CSS selectors
    "playwright/no-raw-locators": "error",
    // Avoid arbitrary waits — use waitForResponse, waitForLoadState, or toBeVisible
    "playwright/no-wait-for-timeout": "warn",
    // Prefer web-first assertions (toBeVisible vs isVisible())
    "playwright/prefer-web-first-assertions": "error",
    // No { force: true } — fix the underlying issue instead
    "playwright/no-force-option": "error",
  },
};

export default [...eslintConfig, playwrightConfig];
