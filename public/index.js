const static = require('koa-static');
const path = require('path');

module.exports = {
  staticResource: static(path.join(__dirname, '.'))
}