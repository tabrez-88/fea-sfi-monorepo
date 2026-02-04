module.exports = {
  root: true,
  extends: ['@sfi-fea/eslint-config/nestjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
