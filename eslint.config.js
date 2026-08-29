import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import deprecation from "eslint-plugin-deprecation";

export default [
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.app.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      deprecation,
    },
    rules: {
      "deprecation/deprecation": "warn",
    },
  },
];