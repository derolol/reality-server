const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const UserService = require('../services/userService');
const checkUtil = require('../utils/checkUtil');

class UserController {

	async requestTest(ctx) {
		ctx.body = null;
	}

	async userAuthorization(ctx) {
		ctx.body = null;
	}

	/**
	 * 获取公钥
	 * @param {上下文} ctx 
	 */
	async getPublicKey(ctx) {
		let filePath = path.resolve(__dirname, "..", "lib/publickey.pem");
		const publicKey = fs.readFileSync(filePath);
		ctx.body = { key: publicKey.toString() };
	}

	static decryptText(text) {
		let filePath = path.resolve(__dirname, "..", "lib/privateKey.pem");
		const privateKey = fs.readFileSync(filePath);
		const decodeData = crypto.privateDecrypt(
			{ key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
			Buffer.from(text, 'base64')
		);
		return decodeData.toString("utf8");
	}

	/**
	 * 用户登录
	 * @param {上下文} ctx 
	 */
	async login(ctx) {
		// 参数验证
		let check = checkUtil.checkParams(ctx.request.body, true, "user_name", "user_password");
		if (!check) throw { code: 403001, message: '缺少请求参数' };
		let { user_name, user_password } = ctx.request.body;
		// 使用私钥解密
		user_password = UserController.decryptText(user_password);
		// 用户登录验证
		let res = await UserService.instance.login(user_name, user_password);
		ctx.body = { info: res.info, token: res.token };
	}

	async loginWechat(ctx) {

	}

	/**
	 * 用户注册
	 * @param {上下文} ctx 
	 */
	async register(ctx) {
		// 参数验证
		let check = checkUtil.checkParams(ctx.request.body, true, "user_name", "user_password");
		if (!check) throw { code: 412001, message: '缺少请求参数' };
		let { user_name, user_password } = ctx.request.body;
		// 使用私钥解密
		user_password = UserController.decryptText(user_password);
		// 用户登录验证
		let res = await UserService.instance.register(user_name, user_password);
		ctx.body = { info: res };
	}
}

const instance = new UserController();

module.exports = { instance };