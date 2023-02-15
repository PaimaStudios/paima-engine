const ignorePaths = ['/node_modules/', '/build/', '/integration-testing/'];
/** @type {import('jest').Config} */
module.exports = {
  verbose: true,
  preset: 'ts-jest/presets/default-esm-legacy',
  moduleFileExtensions: ['js', 'json', 'ts'],
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  rootDir: '.',
  transformIgnorePatterns: ['node_modules'],
  transform: {
    '.+\\.(j|t)sx?$': ['ts-jest', { useESM: true }],
  },
  coveragePathIgnorePatterns: [...ignorePaths],
  testPathIgnorePatterns: [...ignorePaths],
};
