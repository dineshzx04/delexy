// eslint.config.js

import deprecation from "eslint-plugin-deprecation";

export default [
  {
    plugins: {
      deprecation,
    },
    rules: {
      "deprecation/deprecation": "warn",
    },
  },
];