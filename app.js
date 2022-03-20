const Koa = require('koa');
const bodyParser = require('koa-bodyparser')();
const { routers } = require('./routes');
const { corsHandler } = require('./middlewares/cors');
const { jwtHandler } = require('./middlewares/jwt');
const { loggerHandler } = require('./middlewares/logger');
const { errorHandler, responseHandler } = require('./middlewares/reponse');
const { staticResource } = require('./public');

const app = new Koa();

// CORS
app.use(corsHandler);

// Logger
app.use(loggerHandler);

// Error Handler
app.use(errorHandler);

// JWT
app.use(jwtHandler);

// Response
app.use(responseHandler);

// Body
app.use(bodyParser);

// Static
app.use(staticResource);

// Routes
app.use(routers.routes(), routers.allowedMethods());

module.exports = app;