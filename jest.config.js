module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(jpg|ico|jpeg|png|gif|svg|eot|ttf|otf|webp|woff|woff2|mp4|css|less)$': '<rootDir>/src/__mocks__/fileMock.ts',
  },
  snapshotSerializers: [],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  reporters: ['default', 'jest-junit'],
  // commonsense option to reset mocks between test runs so no
  // mock invocations carry over
  clearMocks: true,
};
