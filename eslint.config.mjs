import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

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
            // next-intl translation calls
            "t", "t.rich", "useTranslations",
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
            "^[·\\-→✓⚠️×$/]+$",
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

export default eslintConfig;
