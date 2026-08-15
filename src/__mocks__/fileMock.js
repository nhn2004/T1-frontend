// Stub para requires de imágenes (png/jpg/etc.) en tests — Jest corre en Node puro
// (ver jest.config.js), sin el transformador de assets que usa Metro en la app real,
// así que un `require('./foto.png')` directo revienta con SyntaxError en el binario.
module.exports = 'test-file-stub';
