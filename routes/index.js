const Route = require('koa-router');
const routers = Route();

const home = require('./home');
const user = require('./user');
const editor = require('./editor');

routers.prefix('/api');

routers.use('/', home.routes(), home.allowedMethods());
routers.use('/user', user.routes(), user.allowedMethods());
routers.use('/editor', editor.routes(), editor.allowedMethods());

module.exports = { routers };