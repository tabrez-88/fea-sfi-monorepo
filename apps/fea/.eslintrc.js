module.exports = {
  root: true,
  extends: ['@sfi-fea/eslint-config/nextjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
