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
    },
  },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
