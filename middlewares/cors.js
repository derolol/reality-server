const cors = require('koa2-cors');

const corsHandler = cors({
	origin: function (ctx) {
		// if (ctx.url === '/test') {
		// 	// 这里可以配置不运行跨域的接口地址
		// 	return false;
		// }
		return 'http://localhost:8080';
	},
	exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
	maxAge: 5, // 指定本次预检请求的有效期，单位为秒
	credentials: true,
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
});

module.exports = {
	corsHandler
}