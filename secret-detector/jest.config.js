const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/?(*.)+(test|spec).(ts|tsx|js)'],
};

module.exports = createJestConfig(customJestConfig);

