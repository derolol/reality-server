const jwt = require('jsonwebtoken')
const config = require('../config');
const checkUtil = require('../utils/checkUtil');

const passlist = ["api/user/key", "api/user/login", "static"];

function checkPassList(url) {
  for (let pass of passlist) {
    if (url.indexOf(pass) !== -1) return true;
  }
  return false;
}

const jwtHandler = async (ctx, next) => {
  if (!checkPassList(ctx.request.url)) {
    let checkBefore = checkUtil.checkParams(ctx.request.query, true, "before");
    let data = checkBefore ? { before: ctx.request.query.before } : null;
    let check = checkUtil.checkParams(ctx.request.headers, true, "authorization");
    if (!check || typeof ctx.request.headers.authorization !== 'string') {
      throw { code: 401001, data, message: '该用户无访问权限' };
    }
    const token = ctx.request.headers.authorization.slice(7);
    try {
      ctx.userInfo = jwt.verify(token, config.secret);
    } catch (err) {
      throw { code: 401002, data, message: 'token鉴权失败' };
    }
  }
  await next();
}

module.exports = {
  jwtHandler
}