import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["dist/**", "public/sw.js", "vite.config.js", "vite.config.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-explicit-any": "error", "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] },
  },
  { files: ["vite.config.ts", "scripts/**/*.mjs"], languageOptions: { globals: { process: "readonly", console: "readonly", URL: "readonly" } } },
);
