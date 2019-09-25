const { resolve } = require('path');

module.exports = function module (moduleOptions) {
  const options = Object.assign({
    debug: this.options.dev,
    onPageChange: true,
    blockByDefault: true,
    headerBlockerKey: ''
  }, moduleOptions);

  this.addPlugin({
    src: resolve(__dirname, 'templates/plugin.js'),
    fileName: 'nuxt-axios-duplicate-blocker.js',
    ssr: true,
    options
  })
};
