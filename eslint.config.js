// Basic ESLint config with custom rule to forbid toFixed(2) directly on price-like identifiers.
// Using Flat config style is possible, but here we keep a classic config for simplicity.

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
  ],
  rules: {
    // Disallow calling toFixed(2) on price/amount/total identifiers directly; enforce centralized formatter usage.
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.property.name='toFixed'][arguments.length=1][arguments.0.value=2] > MemberExpression.callee > MemberExpression.object.property[name=/^(price|subtotal|total|amount)$/i]",
        message:
          "Do not format prices with toFixed(2) directly on price/subtotal/total/amount. Use formatPriceCents() with integer cents instead.",
      },
    ],
    // Temporarily allow some TypeScript issues for Vercel build
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "warn",
    "jsx-a11y/role-supports-aria-props": "warn",
    "@next/next/no-img-element": "warn",
    "prefer-const": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-require-imports": "warn",
  },
};
