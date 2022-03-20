/**
 * 校验工具类
 */
class CheckUtil {
  checkParams(data, checkEmpty, ...params) {
    for (let param of params) {
      let d = data[param];
      if (!d) return false;
      if (checkEmpty && d === "") return false;
    }
    return true;
  }
}

const checkUtil = new CheckUtil();

module.exports = checkUtil;