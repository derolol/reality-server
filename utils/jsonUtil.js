const { logger } = require("../middlewares/logger");

function jsonToObject(str) {
  if (typeof (str) !== "string" || str === "") return [];
  try {
    let res = JSON.parse(str);
    if (res === null || typeof (res) !== "object") return [];
    return res;
  } catch (err) {
    return [];
  }
}

module.exports = {
  jsonToObject,
}