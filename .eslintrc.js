module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    commonjs: true
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended"],
  rules: {
    strict: 0,
    "no-console": 0,
    "max-len": [
      "error",
      {
        code: 120,
        ignoreComments: true
      }
    ],
    "prettier/prettier": [
      "warn",
      {
        printWidth: 120,
        tabWidth: 2,
        bracketSpacing: false,
        trailingComma: "none",
        arrowParens: "avoid"
      }
    ]
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020
  }
};
