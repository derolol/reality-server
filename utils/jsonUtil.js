const { logger } = require("../middlewares/logger");

/**
 * 解析JSON字符串为数组
 * @param {JSON字符串} str 
 * @returns 数组
 */
function jsonToObject(str) {
  // 若传入参数类型为非字符串或为空
  if (typeof (str) !== "string" || str === "") return [];
  try {
    let res = JSON.parse(str);
    // 若解析结果异常
    if (res === null || typeof (res) !== "object") return [];
    return res;
  } catch (err) {
    return [];
  }
}

module.exports = {
  jsonToObject,
}