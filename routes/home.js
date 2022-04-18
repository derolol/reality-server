const Route = require('koa-router');
const AccessController = require('../controllers/accessController');
const router = new Route();

router.get('/society/maps', AccessController.instance.getSocietyMapList);

module.exports = router;