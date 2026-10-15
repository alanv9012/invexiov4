import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTypeScript,
  {
    name: "invexio/next-15-compatibility",
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unsafe-function-type": "off"
    }
  }
];
