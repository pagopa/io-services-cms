import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["**/.scripts/*", "**/node_modules/*", "**/__tests__/*"],
  },
];