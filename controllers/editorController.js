const EditorService = require('../services/editorService');
const checkUtil = require('../utils/checkUtil');
const jsonUtil = require('../utils/jsonUtil');
const mathUtil = require('../utils/mathUtil');
const config = require('../models/editor');
const { logger } = require('../middlewares/logger');

class EditorController {

  /**
   * 罗列所有地图信息
   * @param {上下文} ctx 
   */
  async listMap(ctx) {
    let maps = await EditorService.instance.listMap(ctx.userInfo.user_id);
    ctx.body = { maps };
  }

  /**
   * 获取指定id的地图及其构件信息
   * @param {上下文} ctx 
   */
  async findMapById(ctx) {
    const check = checkUtil.checkParams(ctx.params, true, "id");
    if (!check) throw { code: 501001, message: '缺少请求参数' };
    const mapId = ctx.params.id;
    let map = await EditorService.instance.findMapById(mapId, ctx.userInfo.user_id);
    ctx.body = { map };
  }

  async listPOIRes(ctx) {
    ctx.body = await EditorService.instance.listPOIRes();
  }

  /**
   * 创建地图
   * @param {上下文} ctx 
   */
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
   * 上传地图预览图片
   * @param {上下文} ctx 
   */
  async uploadMapPreviewImage(ctx) {
    const checkMap = checkUtil.checkParams(ctx.params, true, "id");
    const checkImage = checkUtil.checkParams(ctx.request.body, true, "image");
    if (!checkMap || !checkImage) throw { code: 504001, message: '缺少请求参数' };
    const { id } = ctx.params;
    const { image } = ctx.request.body;
    const imagePath = await EditorService.instance.uploadMapPreviewImage(id, image);
    ctx.body = { path: imagePath };
  }

  /**
   * 删除地图
   * @param {上下文} ctx 
   */
  async deleteMap(ctx) {
    const checkMap = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkMap) throw { code: 505001, message: '缺少请求参数' };
    const { id } = ctx.params;
    const deletedStatus = await EditorService.instance.deleteMap(id);
    ctx.body = { deletedStatus };
  }


  /**
   * 创建建筑
   * 根据建筑轮廓自动创建
   * 楼层 {一层}、墙体、功能区
   * @param {上下文} ctx 
   */
  async createBuilding(ctx) {
    const check = checkUtil.checkParams(
      ctx.request.body,
      true,
      "building_name", "building_type",
      "building_center_lng", "building_center_lat", "building_floor_height",
      "building_geometry", "building_belong_map", "building_attach_floor",
      "building_owner", "building_access_level",
      "area_geometry");
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
      wall_inside_geometry: JSON.stringify({
        type: "MultiPolygon",
        coordinates: [],
      }),
      wall_belong_floor: -1,
      wall_attach_area: -1,
      wall_owner: params.building_owner,
    };
    // 构建area数据
    let areaInfo = {
      area_geometry: params.area_geometry,
      area_belong_floor: -1,
      area_attach_wall: -1,
      area_owner: params.building_owner,
      area_access_level: params.building_access_level
    };
    // 数据持久化
    let building = await EditorService.instance.createBuilding(buildingInfo, floorInfo, wallInfo, areaInfo);
    ctx.body = { building };
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
      wall_thick: 2,
      wall_geometry: info.floor_geometry,
      wall_inside_geometry: JSON.stringify({
        type: "MultiPolygon",
        coordinates: [],
      }),
      wall_belong_floor: -1,
      wall_attach_area: -1,
      wall_owner: info.floor_owner,
    };
    let areaInfo = {
      area_geometry: info.area_geometry,
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
    // 更新楼层信息
    let updatedFloor = await EditorService.instance.updateFloor(floorId, info);
    // 若楼层结构改变则需要更新墙体、功能区结构
    if (!geometryChange) {
      ctx.body = { geometryChange: false, floor: updatedFloor };
      return;
    }
    let areaList = {};
    // 更新墙体信息
    let wallId = updatedFloor.floor_attach_wall;
    let wallInfo = {
      wall_geometry: info.floor_geometry
    };
    let updatedWall = await EditorService.instance.updateWall(wallId, wallInfo);
    // 更新功能区信息
    let areaGeometries = jsonUtil.jsonToObject(info.areaGeometries);
    // 删除和新增操作
    if (areaGeometries.hasOwnProperty("deleteAreaIdList")
      && areaGeometries.hasOwnProperty("newAreaList")) {
      // 新增功能区
      let newAreaList = areaGeometries.newAreaList.map(geometry => ({
        area_geometry: JSON.stringify(geometry),
        area_belong_floor: updatedFloor.floor_id,
        area_attach_wall: updatedWall.wall_id,
        area_owner: updatedWall.wall_owner,
        area_access_level: 1
      }));
      areaList.newAreaList = await EditorService.instance.createOrUpdateAreaList(updatedFloor.floor_id, newAreaList);
      // 删除功能区
      await EditorService.instance.deleteAreaList(updatedFloor.floor_id, areaGeometries.deleteAreaIdList);
    }
    ctx.body = { geometryChange: true, floor: updatedFloor, wall: updatedWall, area: areaList };
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

  async updateWall(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 510001, message: '缺少请求参数[id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "floor", "info", "areas");
    if (!checkBody) throw { code: 510002, message: '缺少请求参数[floor,info,areas]' };
    let { id } = ctx.params;
    let { floor, info, areas } = ctx.request.body;
    // 更新墙体
    const updatedWall = await EditorService.instance.updateWall(id, info);
    // 获取功能区，根据传递参数判断功能区操作类型
    let areaGeometryList = jsonUtil.jsonToObject(areas);
    let areaList = {};
    // 更新操作
    if (areaGeometryList.hasOwnProperty("updateAreaList")) {
      areaList.updateAreaList = await EditorService.instance.createOrUpdateAreaList(
        floor,
        areaGeometryList.updateAreaList.map(area => (
          {
            area_id: area.area_id,
            area_geometry: JSON.stringify(area.area_geometry)
          }
        ))
      );
    }
    // 删除和新增操作
    if (areaGeometryList.hasOwnProperty("deleteAreaIdList")
      && areaGeometryList.hasOwnProperty("newAreaList")) {
      // 新增功能区
      let newAreaList = areaGeometryList.newAreaList.map(geometry => ({
        area_geometry: JSON.stringify(geometry),
        area_belong_floor: floor,
        area_attach_wall: id,
        area_owner: updatedWall.wall_owner,
        area_access_level: 1
      }));
      areaList.newAreaList = await EditorService.instance.createOrUpdateAreaList(floor, newAreaList);
      // 删除功能区
      await EditorService.instance.deleteAreaList(floor, areaGeometryList.deleteAreaIdList);
    }
    ctx.body = { updatedWall, areaList };
  }

  async updateArea(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 511001, message: '缺少请求参数[id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "info");
    if (!checkBody) throw { code: 511002, message: '缺少请求参数[info]' };
    let { id } = ctx.params;
    let { info } = ctx.request.body;
    let updated = await EditorService.instance.updateArea(id, info);
    ctx.body = { area: updated };
  }

  async createPOI(ctx) {
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "floor", "poi_name", "poi_res", "poi_geometry", "poi_height", "poi_belong_area");
    if (!checkBody) throw { code: 512001, message: '缺少请求参数[floor、poi_name、poi_res、poi_geometry、poi_height、poi_belong_area]' };
    let { floor, poi_name, poi_res, poi_geometry, poi_height, poi_belong_area } = ctx.request.body;
    let info = {
      poi_name,
      poi_res,
      poi_geometry,
      poi_height,
      poi_belong_area,
      poi_belong_floor: floor
    }
    let created = await EditorService.instance.createPOI(floor, info);
    ctx.body = { poi: created };
  }

  async deletePOI(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 513001, message: '缺少请求参数[id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "floor");
    if (!checkBody) throw { code: 513002, message: '缺少请求参数[floor]' };
    let { id } = ctx.params;
    let { floor } = ctx.request.body;
    let deleted = await EditorService.instance.deletePOI(floor, id);
    ctx.body = { poi: deleted };
  }

  async updatePOI(ctx) {
    const checkParams = checkUtil.checkParams(ctx.params, true, "id");
    if (!checkParams) throw { code: 514001, message: '缺少请求参数[id]' };
    const checkBody = checkUtil.checkParams(ctx.request.body, true, "info");
    if (!checkBody) throw { code: 514002, message: '缺少请求参数[info]' };
    let { id } = ctx.params;
    let { info } = ctx.request.body;
    let updated = await EditorService.instance.updatePOI(id, info);
    ctx.body = { poi: updated };
  }

}

const instance = new EditorController();

module.exports = { instance };