const { logger } = require('./logger');

const passFileType = ["image/png", "image/jpeg", "image/jpg", "application/javascript"];

const responseHandler = async (ctx, next) => {
	await next();
	if (passFileType.indexOf(ctx.type) !== -1 || "") return;
	logger.info(ctx.type);
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
			msg: err.message
		}
		ctx.status = 200 // 保证返回状态是 200, 这样前端不会抛出异常
		return Promise.resolve();
	}
}

module.exports = {
	responseHandler,
	errorHandler
}