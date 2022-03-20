const { logger } = require('./logger');

const responseHandler = async (ctx, next) => {
	await next();
	if ("image/png" === ctx.type) return;
	ctx.type = 'json';
	ctx.body = {
		code: 200,
		msg: ctx.msg || '',
		data: ctx.body || ''
	}
}

const errorHandler = async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (err.code == null) {
			logger.error(err.stack);
		}
		ctx.body = {
			code: err.code || 500,
			data: err.data ? err.data : null,
			msg: err.message,
		}
		ctx.status = 200 // 保证返回状态是 200, 这样前端不会抛出异常
		return Promise.resolve();
	}
}

module.exports = {
	responseHandler,
	errorHandler
}