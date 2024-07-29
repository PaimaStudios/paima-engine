// const { getJestProjects } = require('@nx/jest');

// note: our jest setup is hopelessly broken until this issue gets resolved
//       https://github.com/jestjs/jest/issues/11563
module.exports = {
  verbose: true,
  resolver: '@nx/jest/plugins/resolver',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, }],
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
