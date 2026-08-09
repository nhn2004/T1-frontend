// Config de Babel exclusiva para Jest (ver jest.config.js). Deliberadamente NO se
// llama "babel.config.js": Metro (el bundler de Expo) usa ese nombre por convención y
// si existiera lo tomaría también para compilar la app real — pisando el preset
// interno de Expo (babel-preset-expo) que Metro aplica por defecto cuando no hay
// babel.config.js propio. Este archivo solo transforma ESM a CommonJS para que Jest
// (que corre en Node, no en Metro) pueda ejecutar los módulos bajo test.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
