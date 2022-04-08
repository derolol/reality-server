const EditorService = require('../services/editorService');
const checkUtil = require('../utils/checkUtil');
const jsonUtil = require('../utils/jsonUtil');
const mathUtil = require('../utils/mathUtil');
const config = require('../models/editor');
const { logger } = require('../middlewares/logger');

class EditorController {

  async listMap(ctx) {
    let maps = await EditorService.instance.listMap();
    ctx.body = { maps };
  }

  async findMapById(ctx) {
    const check = checkUtil.checkParams(ctx.params, true, "id");
    if (!check) throw { code: 501001, message: '缺少请求参数' };
    const mapId = ctx.params.id;
    let map = await EditorService.instance.findMapById(mapId);
    ctx.body = { map };
  }

  async createMap(ctx) {
    const check = checkUtil.checkParams(
      ctx.request.body,
      false,
      "map_name", "map_tag", "map_attach_building", "map_owner", "map_access_level");
    if (!check) throw { code: 502001, message: '缺少请求参数' };
    let params = ctx.request.body;
    let mapInfo = {
      map_name: params.map_name,
      map_tag: params.map_tag,
      map_preview_path: params.map_preview_path,
      map_geometry: params.map_geometry,
      map_attach_building: params.map_attach_building,
      map_owner: params.map_owner,
      map_access_level: params.map_access_level
    };
    let map = await EditorService.instance.createMap(mapInfo);
    ctx.body = { map };
  }

  /**
   * 创建建筑
   * 根据建筑轮廓自动创建
   * 楼层 {一层}
   * 墙体
   * 墙体切割的功能区
   * @param {上下文} ctx 
   */
  async createBuilding(ctx) {
    const check = checkUtil.checkParams(
      ctx.request.body,
      true,
      "building_name", "building_type", "building_center_lng", "building_center_lat", "building_floor_height", "building_geometry", "building_belong_map", "building_attach_floor", "building_owner", "building_access_level");
    if (!check) throw { code: 503001, message: '缺少请求参数' };
    let params = ctx.request.body;
    // 构建building数据
    let buildingInfo = {
      building_name: params.building_name,
      building_type: params.building_type,
      building_center_lng: params.building_center_lng,
      building_center_lat: params.building_center_lat,
      building_floor_height: params.building_floor_height,
      building_geometry: params.building_geometry,
      building_belong_map: params.building_belong_map,
      building_owner: params.building_owner,
      building_access_level: params.building_access_level,
    };
    let geometry = JSON.parse(params.building_geometry);
    // 构建floor数据
    // let floorGeometry = Object.assign({}, geometry);
    // floorGeometry.coordinates = JSON.parse(JSON.stringify(floorGeometry.coordinates));
    let floorInfo = {
      floor_geometry: params.building_geometry,
      floor_belong_building: -1,
      floor_attach_wall: -1,
      floor_attach_area: -1,
      floor_owner: params.building_owner,
      floor_access_level: params.building_access_level,
    };
    // 构建wall数据
    let wallInfo = {
      wall_geometry: params.building_geometry,
      wall_inside_geometry: "",
      wall_belong_floor: -1,
      wall_attach_area: -1,
      wall_owner: params.building_owner,
    };
    // 收缩墙体宽度获取area形状
    let areaGeometry = {
      type: "MultiPolygon",
      coordinates: null,
    }
    areaGeometry.coordinates = generateArea(
      geometry.coordinates,
      config.WALL_CONFIG.WALL_THICK_2
    );
    // 构建area数据
    let areaInfo = {
      area_geometry: JSON.stringify(areaGeometry),
      area_belong_floor: -1,
      area_attach_wall: -1,
      area_owner: params.building_owner,
      area_access_level: params.building_access_level
    };
    // 数据持久化
    let building = await EditorService.instance.createBuilding(buildingInfo, floorInfo, wallInfo, areaInfo);
    ctx.body = { building };
  }

  async uploadMapPreviewImage(ctx) {
    const checkMap = checkUtil.checkParams(ctx.params, true, "id");
    const checkImage = checkUtil.checkParams(ctx.request.body, true, "image");
    if (!checkMap || !checkImage) throw { code: 504001, message: '缺少请求参数' };
    const { id } = ctx.params;
    const { image } = ctx.request.body;
    const imagePath = await EditorService.instance.uploadMapPreviewImage(id, image);
    ctx.body = { path: imagePath };
  }

  async deleteMap(ctx) {
    const checkMap = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkMap) throw { code: 505001, message: '缺少请求参数' };
    const { id } = ctx.params;
    const deletedStatus = await EditorService.instance.deleteMap(id);
    ctx.body = { deletedStatus };
  }

  async updateBuilding(ctx) {
    const check = checkUtil.checkParams(ctx.params, true, "id");
    if (!check) throw { code: 506001, message: '缺少请求参数' };
    const buildingId = ctx.params.id;
    const record = ctx.request.body;
    const updatedBuilding = await EditorService.instance.updateBuilding(buildingId, record);
    ctx.body = { building: updatedBuilding };
  }

  async createFloor(ctx) {
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "info");
    if (!checkBody) throw { code: 507002, message: '缺少请求参数[info]' };
    const { info } = ctx.request.body;
    let wallInfo = {
      wall_geometry: info.floor_geometry,
      wall_inside_geometry: "",
      wall_belong_floor: -1,
      wall_attach_area: -1,
      wall_owner: info.floor_owner,
    };
    let geometry = jsonUtil.jsonToObject(info.floor_geometry);
    // 收缩墙体宽度获取area形状
    let areaGeometry = {
      type: "MultiPolygon",
      coordinates: null,
    }
    areaGeometry.coordinates = generateArea(
      geometry.coordinates,
      config.WALL_CONFIG.WALL_THICK_2
    );
    let areaInfo = {
      area_geometry: JSON.stringify(areaGeometry),
      area_belong_floor: -1,
      area_attach_wall: -1,
      area_owner: info.floor_owner,
      area_access_level: info.floor_access_level
    };
    let createdFloor = await EditorService.instance.createFloor(info, wallInfo, areaInfo);
    ctx.body = createdFloor;
  }

  async updateFloor(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 507001, message: '缺少请求参数[floor_id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "info", "geometryChange");
    if (!checkBody) throw { code: 507002, message: '缺少请求参数[floor_info,floor_geometryChange]' };
    const floorId = ctx.params.id;
    const { info, geometryChange } = ctx.request.body;
    let updatedFloor = await EditorService.instance.updateFloor(floorId, info);
    if (geometryChange) {
      let wallId = updatedFloor.floor_attach_wall;
      let wallInfo = {
        wall_geometry: info.floor_geometry,
      };
      let updatedWall = await EditorService.instance.updateWall(wallId, wallInfo);
      let geometry = jsonUtil.jsonToObject(updatedFloor.floor_geometry);
      let areaIdList = jsonUtil.jsonToObject(updatedFloor.floor_attach_area);
      // 收缩墙体宽度获取area形状
      let areaGeometry = {
        type: "MultiPolygon",
        coordinates: null,
      }
      areaGeometry.coordinates = generateArea(
        geometry.coordinates,
        config.WALL_CONFIG[`WALL_THICK_${+updatedWall.wall_thick}`]
      );
      let areaInfo = {
        area_geometry: JSON.stringify(areaGeometry),
      };
      let updatedArea = await EditorService.instance.updateArea(areaIdList[0], areaInfo);
      ctx.body = { geometryChange: true, floor: updatedFloor, wall: updatedWall, area: updatedArea };
      return;
    }
    ctx.body = { geometryChange: false, floor: updatedFloor };
  }

  async deleteFloor(ctx) {
    const check = checkUtil.checkParams(ctx.params, true, "id");
    if (!check) throw { code: 508001, message: '缺少请求参数' };
    const { id } = ctx.params;
    const deletedStatus = await EditorService.instance.deleteFloor(id);
    ctx.body = { deletedStatus };
  }

  async copyFloor(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 509001, message: '缺少请求参数[id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "target");
    if (!checkBody) throw { code: 509002, message: '缺少请求参数[target]' };
    const { id } = ctx.params;
    const { target } = ctx.request.body;
    const copied = await EditorService.instance.copyFloor(id, target);
    ctx.body = { copied };
  }

}

function generateArea(coordinates, wallThick) {
  if (mathUtil.countArrayLevel(coordinates) === 3) {
    return [handleAreaShape(coordinates, wallThick)];
  }
  let areaShape = [];
  for (let i = 0, len = coordinates.length; i < len; i++) {
    areaShape.push(handleAreaShape(coordinates[i], wallThick));
  }
  return areaShape;
}

function handleAreaShape(points, wallThick) {
  let areaShape = [];
  for (let i = 0; i < points.length; i++) {
    let newShape = null;
    let shape = points[i];
    // 判断点集是否为顺时针
    if (mathUtil.judgeClockwise(shape)) {
      shape.reverse();
    }
    // 外墙收缩
    if (i === 0) {
      newShape = mathUtil.createEqualDistPoint(
        shape,
        wallThick  // L > 0 收缩墙体宽度
      );
      areaShape.push(newShape);
      continue;
    }
    // 内墙扩张
    newShape = mathUtil.createEqualDistPoint(
      shape,
      - wallThick
    );
    areaShape.push(newShape);
  }
  return areaShape;
}

const instance = new EditorController();

module.exports = { instance };