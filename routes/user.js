const Route = require('koa-router');
const UserController = require('../controllers/userController');
const router = new Route();

router.get('/test', UserController.instance.requestTest);
router.get('/check', UserController.instance.userAuthorization);
router.get('/key', UserController.instance.getPublicKey);
router.post('/login', UserController.instance.login);
router.post('/login/wechat', UserController.instance.loginWechat);
router.post('/register', UserController.instance.register);

module.exports = router;