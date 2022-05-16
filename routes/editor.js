const Route = require('koa-router');
const EditorController = require('../controllers/editorController');
const router = new Route();

router.get('/maps', EditorController.instance.listMap);
router.get('/maps/:id', EditorController.instance.findMapById);
router.get('/pois/res', EditorController.instance.listPOIRes);

router.post('/maps', EditorController.instance.createMap);
router.post('/maps/:id/preview', EditorController.instance.uploadMapPreviewImage);
router.post('/maps/:id/delete', EditorController.instance.deleteMap);
router.post('/buildings', EditorController.instance.createBuilding);
router.post('/buildings/:id/update', EditorController.instance.updateBuilding);
router.post('/floors', EditorController.instance.createFloor);
router.post('/floors/:id/update', EditorController.instance.updateFloor);
router.post('/floors/:id/delete', EditorController.instance.deleteFloor);
router.post('/floors/:id/copy', EditorController.instance.copyFloor);
router.post('/walls/:id/update', EditorController.instance.updateWall);
router.post('/areas/:id/update', EditorController.instance.updateArea);
router.post('/pois', EditorController.instance.createPOI);
router.post('/pois/:id/delete', EditorController.instance.deletePOI);
router.post('/pois/:id/update', EditorController.instance.updatePOI);
router.post('/pipes/:id/update', EditorController.instance.updatePipe);
router.post('/pipes', EditorController.instance.createPipe);
router.post('/pipes/:id/delete', EditorController.instance.deletePipe);

module.exports = router;