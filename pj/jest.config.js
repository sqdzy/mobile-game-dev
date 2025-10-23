module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/pj/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};