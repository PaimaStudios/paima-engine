/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    verbose: true,
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    transform: {
      '^.+\\.(t)s$': ['ts-jest', { useESM: true, }],
      '^.+\\.(j)s$': 'babel-jest',
    },
    transformIgnorePatterns: [
      '<rootDir>/node_modules/',
    ],
    moduleNameMapper: {
      '^(\\.\\.?\\/.+)\\.jsx?$': '$1'
    },
    modulePathIgnorePatterns: ['<rootDir>/build/'],
  };
  