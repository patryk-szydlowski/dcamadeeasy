import javascript from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import importSort from "eslint-plugin-simple-import-sort";

export default [
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: true,
    },
  },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      "import-sort": importSort,
    },
    rules: {
      ...javascript.configs.recommended.rules,
      ...typescript.configs["recommended"]?.rules,
      ...typescript.configs["recommended-requiring-type-checking"]?.rules,
      ...typescript.configs["strict"]?.rules,

      "import-sort/imports": "error",
      "import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-undef": "off",
      "no-redeclare": "off",
    },
  },
];
