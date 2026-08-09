// Jest solo cubre lógica pura de src/ (permisos, mappers de servicios) — no hay
// renderizado de componentes React Native acá, así que no hace falta el preset
// jest-expo (que además choca con la versión de React instalada en este proyecto).
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
};
