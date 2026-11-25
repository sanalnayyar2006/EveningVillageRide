// ESLint flat config must be JavaScript; everything else in the project is TypeScript.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // R3F scenes mutate Three.js objects inside useFrame by design.
      "react-hooks/immutability": "off",
      "react/no-unknown-property": "off",
      // Photos are local blob: URLs, which next/image cannot optimise.
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The *.nosync folders are the real node_modules/.next, kept out of iCloud sync.
    ignores: [
      ".next/**",
      ".next.nosync/**",
      "node_modules/**",
      "node_modules.nosync/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
