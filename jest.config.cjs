module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(png|jpg|jpeg|gif|svg|mp3|wav|ttf|otf)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
};