const AccessService = require('../services/accessService');
const checkUtil = require('../utils/checkUtil');

class AccessController {
  async getSocietyMapList(ctx) {
    await AccessService.getSocietyMapList();
  }
}

const instance = new AccessController();

module.exports = { instance };