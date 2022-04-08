const { logger } = require("../middlewares/logger");

function normalize(vector) {
  const base = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
  return vector.map(d => d / base);
}

function crossProduct(v1, v2) {
  return v1[0] * v2[1] - v1[1] * v2[0];
}

/**
 * 获取不规则多边形的等距放缩多边形
 * L < 0 放大
 * L > 0 缩小
 * @param {逆时针且相邻无重叠点集} points 
 * @param {放缩的距离} L 
 * @returns 
 */
function createEqualDistPoint(points, L) {
  if (points.length <= 2) return null;

  // 去除收尾重复点
  let len = points.length;
  if (points[0][0] === points[len - 1][0] && points[0][1] === points[len - 1][1]) {
    len -= 1;
  }

  let createPoints = []
  for (let i = 0; i < len; i++) {
    let v1 = [
      points[(i - 1 + len) % len][0] - points[i][0],
      points[(i - 1 + len) % len][1] - points[i][1],
    ];
    let v2 = [
      points[(i + 1) % len][0] - points[i][0],
      points[(i + 1) % len][1] - points[i][1]
    ];
    v1 = normalize(v1);
    v2 = normalize(v2);
    let cross = crossProduct(v1, v2);
    // 处理三点在同一平面的情况
    if (cross === 0) {
      let vectorLength = L;
      let p = points[i][0] - v1[0] * vectorLength;
      let q = points[i][1] + v1[1] * vectorLength;
      createPoints.push([p, q]);
    }
    else {
      let vectorLength = - L / cross;
      let p = points[i][0] + (v1[0] + v2[0]) * vectorLength;
      let q = points[i][1] + (v1[1] + v2[1]) * vectorLength;
      createPoints.push([p, q]);
    }
  }

  // 补充收尾重复点
  createPoints.push([createPoints[0][0], createPoints[0][1]]);

  return createPoints
}

/**
 * 判断是否为顺时针
 * @param {点集} points 
 * @returns false 逆时针 true 顺时针
 */
function judgeClockwise(points) {
  if (points.length <= 2) return null;
  let len = points.length;
  let count = 0;
  for (let i = 0; i < len; i++) {
    count += crossProduct(points[i], points[(i + 1) % len]);
  }
  if (count > 0) return false;
  return true;
}

/**
 * 数组层数计数
 */
function countArrayLevel(list) {
  for (let i = 0, len = list.length; i < len; i++) {
    if (Array.isArray(list[i])) {
      return countArrayLevel(list[i]) + 1;
    }
  }
  return 1;
}

module.exports = {
  createEqualDistPoint,
  judgeClockwise,
  countArrayLevel,
}