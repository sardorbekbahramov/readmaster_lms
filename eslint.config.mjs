import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  // Eski qoidalarni Flat Config formatiga moslashtirib yuklaymiz
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Siz xohlagan globalIgnores (fayllarni lint-dan chetlab o'tish) qismi
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;