import pagopa from "@pagopa/eslint-config";

export default [
  {
    ignores: ["dist/**", "docker/**", "*.js"],
  },
  ...pagopa,
];
