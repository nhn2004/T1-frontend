// Jest solo cubre lógica pura de src/ (permisos, mappers de servicios) — no hay
// renderizado de componentes React Native acá, así que no hace falta el preset
// jest-expo (que además choca con la versión de React instalada en este proyecto).
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
  // Sin esto, cualquier módulo que (directa o transitivamente) haga `require('*.png')`
  // revienta el parseo del binario en Node — Metro sabe manejar esos requires en la app
  // real, Jest no. Necesario desde que los servicios empezaron a requerir avatares por
  // defecto (src/utils/defaultImages.js).
  moduleNameMapper: {
    '\\.(png|jpe?g|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
};
