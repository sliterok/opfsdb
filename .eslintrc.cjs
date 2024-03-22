require("@rakkasjs/eslint-config/patch");

module.exports = {
  root: true,
  ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
  parserOptions: { project: [__dirname + "/tsconfig.json"] },
  settings: {
    "import/resolver": {
      typescript: {
        project: [__dirname + "/tsconfig.json"],
      },
    },
  },
};
