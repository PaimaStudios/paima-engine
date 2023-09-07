module.exports = {
  rules: {
      'no-console': 0,
  },
  parserOptions: {
      project: './tsconfig.json',
      ecmaVersion: 'es2019',
      sourceType: 'module',
      tsconfigRootDir: __dirname,
      ecmaFeatures: {
          legacyDecorators: true,
      },
  },
};