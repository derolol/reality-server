const { User } = require('../models/user');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

class UserService {
	static cryptoPassword(pwd) {
		const hash = crypto.createHash('md5');
		hash.update(pwd);
		return hash.digest('hex');
	}

	/**
	 * 用户登录
	 * @param {上下文} ctx 
	 * @param {用户名} user_name 
	 * @param {用户密码} user_password 
	 * @returns 用户信息及token 
	 */
	async login(user_name, user_password) {
		// 用户密码md5加密
		let secret_user_password = UserService.cryptoPassword(user_password);
		// 用户信息查询
		const user = await User.findOne({
			where: {
				user_name,
				deleted_at: null,
			},
			raw: true,
		});
		if (!user) throw { code: 403002, message: '用户不存在' };
		// 用户密码验证
		if (user.user_password !== secret_user_password) throw { code: 403003, message: '用户密码错误' };
		// 返回用户信息
		const info = {
			user_id: user.user_id,
			user_name: user.user_name,
			user_image_path: user.user_image_path,
		};
		// 生成用户访问token
		const token = jwt.sign(
			info,
			config.secret, {
			expiresIn: '7d' // token有效期7天
		});
		return { info, token };
	}

	/**
	 * 用户注册
	 * @param {用户名} user_name 
	 * @param {用户密码} user_password 
	 * @returns 
	 */
	async register(user_name, user_password) {
		// 用户密码md5加密
		let secret_user_password = UserService.cryptoPassword(user_password);
		// 若用户不存在则创建
		const [userInfo, created] = await User.findOrCreate({
			where: { user_name, deleted_at: null, },
			defaults: {
				user_name,
				user_password: secret_user_password,
				user_image_path: "default.png",
			}
		});
		if (!created) {
			throw { code: 412002, message: '用户已存在' };
		}
		return userInfo.user_name;
	}
}

const instance = new UserService();

module.exports = { instance };