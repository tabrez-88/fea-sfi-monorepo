module.exports = {
  root: true,
  extends: ['@sfi-fea/eslint-config/base'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
