import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    rules: {
      // Altre regole...
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
