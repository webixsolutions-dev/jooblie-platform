import sharedConfig from "@jooblie/config/eslint";

export default [
  ...sharedConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
