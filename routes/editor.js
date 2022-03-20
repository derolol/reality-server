const Route = require('koa-router');
const EditorController = require('../controllers/editorController');
const router = new Route();

router.post('/maps', EditorController.instance.listMap);

module.exports = router;