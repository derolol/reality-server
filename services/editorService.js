const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');
const { Map, Building, Floor, Wall, Area, WALL_CONFIG, Component, Pipe, POI, POIResource } = require('../models/editor');
const jsonUtil = require('../utils/jsonUtil');
const ImageUtil = require('../utils/imageUtil');

class EditorService {

	/**
	 * 罗列所有地图信息
	 * @returns 地图列表
	 */
	async listMap() {
		const maps = await Map.findAll({
			where: { deleted_at: null }, raw: true
		});
		return maps;
	}

	/**
	 * 获取指定地图的所有构成元素信息
	 * 
	 * 地图 [1]
	 * └───建筑 [n]
	 *     ├───楼层 [n]
	 *     │   ├───墙体 [1]
	 *     │   ├───功能区 [n]
	 *     │   │   └───组件 [n]
	 *     │   ├───POI [n]
	 *     │   └───连通区域 [n]
	 *     └───连通区域 [n]
	 * 
	 * @param {地图id} mapId 
	 * @returns 地图信息
	 */
	async findMapById(mapId) {
		let mapObject = null;
		let buildingObjects = [];
		let floorObjects = [];
		let wallObjects = [];
		let areaObjects = [];
		let poiObjects = [];
		// 获取map信息
		const mapInfo = await Map.findByPk(mapId, { where: { deleted_at: null }, raw: true });
		mapObject = this.generateMap(mapInfo);
		// 获取building信息
		let buildings = jsonUtil.jsonToObject(mapInfo.map_attach_building);
		const buildingInfo = await Building.findAll({ where: { building_id: { [Op.in]: buildings }, deleted_at: null }, raw: true });
		// 遍历所有building
		for (let b of buildingInfo) {
			// 获取floor信息
			let floors = jsonUtil.jsonToObject(b.building_attach_floor);
			const floorInfo = await Floor.findAll({ where: { floor_id: { [Op.in]: floors }, deleted_at: null }, raw: true });
			let floorLevelMap = {};
			// 遍历所有floor
			for (let f of floorInfo) {
				floorLevelMap[f.floor_level] = f.floor_id;
				floorObjects.push(this.generateFloor(f, b.building_floor_height));
				// 获取wall信息
				let wall = f.floor_attach_wall;
				const wallInfo = await Wall.findByPk(wall, { where: { deleted_at: null }, raw: true });
				wallObjects.push(this.generateWall(wallInfo, b.building_floor_height, f.floor_level));
				// 获取area信息
				let areas = jsonUtil.jsonToObject(f.floor_attach_area);
				const areaInfo = await Area.findAll({ where: { area_id: { [Op.in]: areas }, deleted_at: null }, raw: true });
				// 遍历area
				for (let a of areaInfo) {
					areaObjects.push(this.generateArea(a));
				}
				// 获取POI信息
				let pois = jsonUtil.jsonToObject(f.floor_attach_poi);
				const poiInfo = await POI.findAll({ where: { poi_id: { [Op.in]: pois }, deleted_at: null }, raw: true });
				// 遍历POI
				for (let p of poiInfo) {
					poiObjects.push(this.generatePOI(p));
				}
			}
			let floorLevelList = Object.keys(floorLevelMap).map(v => +v);
			floorLevelList.sort((a, b) => b - a);
			buildingObjects.push(this.generateBuilding(b, floorLevelList[0], floorLevelList[floorLevelList.length - 1], floorLevelList, floorLevelMap));
		}
		return { mapObject, buildingObjects, floorObjects, wallObjects, areaObjects, poiObjects };
	}

	async listPOIRes() {
		const row = 6;
		let res = {};
		let imagePathList = new Set();
		// 加载所有的POI资源
		let records = await POIResource.findAll({ where: { poi_res_belong_user: -1 }, raw: true });
		for (let record of records) {
			let no = +("" + record.poi_res_type)[0];
			let sort = +("" + record.poi_res_type).substring(3);
			if (!res.hasOwnProperty(no)) {
				res[no] = {
					no,
					label: record.poi_res_label_level_1,
					types: {}
				}
			}
			res[no].types[record.poi_res_type] = {
				no: +record.poi_res_type,
				label: record.poi_res_label_level_2,
				path: record.poi_res_image_level_2,
				offsetX: (sort - 1) % row,
				offsetY: Math.floor((sort - 1) / row),
			};
			imagePathList.add(record.poi_res_image_level_2);
		}
		// 加载所有的图片资源
		let images = {};
		imagePathList = [...imagePathList];
		for (let path of imagePathList) {
			// 读取图片并转换为base64编码
			let base64 = ImageUtil.instance.readImageBase64(path, ImageUtil.IMAGE_TYPE.POI_LOGO, "png");
			if (base64 !== "") images[path] = base64;
		}
		return { resList: res, resImageList: images };
	}

	/**
	 * 创建地图
	 * @param {地图信息} mapInfo 
	 * @returns 创建的地图信息 
	 */
	async createMap(mapInfo) {
		const map = await Map.create(mapInfo, { raw: true });
		return map;
	}

	/**
 * 更新地图预览图片路径
 * @param {map id} mapId 
 * @param {图片存储路径} imagePath 
 * @returns 
 */
	async uploadMapPreviewImage(mapId, image) {
		let map = await Map.findByPk(mapId, { where: { deleted_at: null } });
		// 存储图片到本地
		let imagePath = ImageUtil.instance.uploadImage(
			image,
			map.map_preview_path,
			ImageUtil.IMAGE_TYPE.MAP_PREVIEW,
			"jpg");
		// 判断记录的图片地址是否需要更新
		if (imagePath !== map.map_preview_path) {
			let updatedMap = await map.set("map_preview_path", imagePath).save({ raw: true });
			imagePath = updatedMap.map_preview_path;
		}
		return imagePath;
	}

	/**
	 * 删除地图及其相关构件
	 * @param {地图id} mapId 
	 * @returns 删除状态
	 */
	async deleteMap(mapId) {
		// 删除地图
		let map = await Map.findByPk(mapId, { where: { deleted_at: null } });
		let deletedMap = await map.set("deleted_at", Date.now()).save({ raw: true });

		// 删除关联建筑
		let buildingIdList = jsonUtil.jsonToObject(map.map_attach_building);
		await Building.update(
			{ deleted_at: Date.now() },
			{ where: { building_id: { [Op.in]: buildingIdList } } }
		);
		let floorIdList = [];
		let pipeIdList = [];

		// 获取所有关联楼层
		for (let id of buildingIdList) {
			let building = await Building.findByPk(id);
			let floors = jsonUtil.jsonToObject(building.building_attach_floor);
			floorIdList.push(...floors);
			let pipes = jsonUtil.jsonToObject(building.building_attach_pipe);
			pipeIdList.push(...pipes);
		}

		// 删除楼层
		await Floor.update(
			{ deleted_at: Date.now() },
			{ where: { floor_id: { [Op.in]: floorIdList } } }
		);
		let wallIdList = [];
		let areaIdList = [];
		let poiIdList = [];

		// 遍历楼层获取楼层相关的功能区、墙体、POI和连通区域
		for (let id of floorIdList) {
			let floor = await Floor.findByPk(id);
			wallIdList.push(floor.floor_attach_wall);
			let areas = jsonUtil.jsonToObject(floor.floor_attach_area);
			areaIdList.push(...areas);
			let pois = jsonUtil.jsonToObject(floor.floor_attach_poi);
			poiIdList.push(...pois);
			let pipes = jsonUtil.jsonToObject(floor.floor_attach_pipe);
			pipeIdList.push(...pipes);
		}

		// 删除关联墙体
		await Wall.update(
			{ deleted_at: Date.now() },
			{ where: { wall_id: { [Op.in]: wallIdList } } }
		);

		// 删除关联功能区
		await Area.update(
			{ deleted_at: Date.now() },
			{ where: { area_id: { [Op.in]: areaIdList } } }
		);

		// 删除关联POI
		await POI.update(
			{ deleted_at: Date.now() },
			{ where: { poi_id: { [Op.in]: poiIdList } } }
		);

		// 删除关联连通区域
		await Pipe.update(
			{ deleted_at: Date.now() },
			{ where: { pipe_id: { [Op.in]: pipeIdList } } }
		);
		let componentIdList = [];
		for (let id of areaIdList) {
			let area = await Area.findByPk(id);
			let components = jsonUtil.jsonToObject(area.area_attach_component);
			componentIdList.push(...components);
		}

		// 删除关联组件
		await Component.update(
			{ deleted_at: Date.now() },
			{ where: { component_id: { [Op.in]: componentIdList } } }
		);
		return null !== deletedMap.deleted_at;
	}

	/**
	 * 创建建筑
	 * 自动初始化一层楼层信息
	 * @param {建筑信息} buildingInfo 
	 * @param {楼层信息} floorInfo 
	 * @param {墙体信息} wallInfo 
	 * @param {功能区信息} areaInfo 
	 * @returns 建筑相关信息
	 */
	async createBuilding(buildingInfo, floorInfo, wallInfo, areaInfo) {
		// 新增building记录
		let building = await Building.create(buildingInfo);
		// 修改map的关联建筑记录
		let map = await Map.findByPk(building.building_belong_map, { where: { deleted_at: null } });
		let buildings = jsonUtil.jsonToObject(map.map_attach_building);
		buildings.push(building.building_id);
		map = await map.set("map_attach_building", JSON.stringify(buildings)).save();
		// 新增floor记录
		floorInfo.floor_belong_building = building.building_id;
		let floor = await Floor.create(floorInfo);
		// 新增wall记录
		wallInfo.wall_belong_floor = floor.floor_id;
		let wall = await Wall.create(wallInfo);
		// 新增area记录
		areaInfo.area_belong_floor = floor.floor_id;
		areaInfo.area_attach_wall = wall.wall_id;
		let area = await Area.create(areaInfo, { raw: true });
		// 设置building关联floor信息
		building = await building.set(
			"building_attach_floor",
			JSON.stringify([floor.floor_id])).save({ raw: true });
		// 设置floor关联area和wall的信息
		floor = await floor.set({
			floor_attach_wall: wall.wall_id,
			floor_attach_area: JSON.stringify([area.area_id]),
		}).save({ raw: true });
		// 设置wall关联area的信息
		wall = await wall.set(
			"wall_attach_area",
			JSON.stringify([area.area_id])).save({ raw: true });
		return { building, floor, wall, area };
	}

	/**
	 * 更新建筑信息
	 * @param {建筑id} buildingId 
	 * @param {建筑信息} record 
	 * @returns 更新后的建筑信息
	 */
	async updateBuilding(buildingId, record) {
		let building = await Building.findByPk(buildingId);
		const updated = await building.set(record).save({ raw: true });
		return updated;
	}

	/**
	 * 上传楼层信息
	 * @param {楼层信息} floorInfo 
	 * @param {墙体信息} wallInfo 
	 * @param {功能区信息} areaInfo 
	 * @returns 新增的记录
	 */
	async createFloor(floorInfo, wallInfo, areaInfo) {
		// 新增floor记录
		let floor = await Floor.create(floorInfo);

		// 新增wall记录
		wallInfo.wall_belong_floor = floor.floor_id;
		let wall = await Wall.create(wallInfo);

		// 新增area记录
		areaInfo.area_belong_floor = floor.floor_id;
		areaInfo.area_attach_wall = wall.wall_id;
		let area = await Area.create(areaInfo, { raw: true });

		// 设置building关联floor信息
		let buildingId = floor.floor_belong_building;
		let building = await Building.findByPk(buildingId);
		let floorList = jsonUtil.jsonToObject(building.building_attach_floor);
		floorList.push(floor.floor_id);
		await building.set({ building_attach_floor: JSON.stringify(floorList) }).save();

		// 设置floor关联area和wall的信息
		floor = await floor.set({
			floor_attach_wall: wall.wall_id,
			floor_attach_area: JSON.stringify([area.area_id]),
		}).save({ raw: true });

		// 设置wall关联area的信息
		wall = await wall.set(
			"wall_attach_area",
			JSON.stringify([area.area_id])).save({ raw: true });

		return {
			floor: this.generateFloor(floor, building.building_floor_height),
			wall: this.generateWall(wall, building.building_floor_height, floor.floor_level),
			area: this.generateArea(area)
		};
	}

	/**
	 * 更新楼层信息
	 * @param {楼层id} floorId 
	 * @param {楼层信息} record 
	 * @returns 更新后的楼层信息
	 */
	async updateFloor(floorId, record) {
		let floor = await Floor.findByPk(floorId);
		const updated = await floor.set(record).save({ raw: true });
		return updated;
	}

	/**
	 * 删除楼层信息
	 * @param {楼层id} floorId 
	 * @returns 删除状态
	 */
	async deleteFloor(floorId) {
		// 楼层信息删除
		let deletedFloor = await Floor.update(
			{ deleted_at: Date.now() },
			{ where: { floor_id: floorId } }
		);
		let floor = await Floor.findByPk(floorId);

		// 删除建筑中相关楼层的数据
		let buildingId = floor.floor_belong_building;
		let building = await Building.findByPk(buildingId);
		let buildingAttachFloor = jsonUtil.jsonToObject(building.building_attach_floor);
		let index = buildingAttachFloor.findIndex(v => v == floorId);
		buildingAttachFloor.splice(index, 1);
		await building.set({ building_attach_floor: JSON.stringify(buildingAttachFloor) }).save();

		// 删除关联墙体
		let wall = floor.floor_attach_wall;
		await Wall.update(
			{ deleted_at: Date.now() },
			{ where: { wall_id: wall } }
		);

		// 删除关联功能区
		let areas = jsonUtil.jsonToObject(floor.floor_attach_area);
		await Area.update(
			{ deleted_at: Date.now() },
			{ where: { area_id: { [Op.in]: areas } } }
		);
		let componentIdList = [];
		for (let id of areas) {
			let area = await Area.findByPk(id);
			let components = jsonUtil.jsonToObject(area.area_attach_component);
			componentIdList.push(...components);
		}

		// 删除关联组件
		await Component.update(
			{ deleted_at: Date.now() },
			{ where: { component_id: { [Op.in]: componentIdList } } }
		);

		// 删除楼层关联POI
		let floorPOIs = jsonUtil.jsonToObject(floor.floor_attach_poi);
		await POI.update(
			{ deleted_at: Date.now() },
			{ where: { poi_id: { [Op.in]: floorPOIs } } }
		);

		// 删除楼层关联连通区域
		let floorPipes = jsonUtil.jsonToObject(floor.floor_attach_pipe);
		await Pipe.update(
			{ deleted_at: Date.now() },
			{ where: { pipe_id: { [Op.in]: floorPipes } } }
		);

		// 删除建筑关联连通区域
		// let buildingPipes = jsonUtil.jsonToObject(building.building_attach_pipe);
		// await Pipe.update(
		// 	{ deleted_at: Date.now() },
		// 	{ where: { pipe_id: { [Op.in]: buildingPipes } } }
		// );
		return null !== deletedFloor.deleted_at;
	}

	/**
	 * 指定楼层号复制楼层
	 * @param {楼层id} floorId 
	 * @param {复制后的楼层层号} targetLevel 
	 * @returns 复制楼层信息
	 */
	async copyFloor(floorId, targetLevel) {
		// 获取源楼层信息
		let sourceFloor = await Floor.findByPk(floorId, { raw: true });

		// 创建复制楼层信息并新增记录
		delete sourceFloor.floor_id;
		sourceFloor.floor_level = targetLevel;
		let targetFloor = await Floor.create(sourceFloor);

		// 新建建筑关联建筑记录
		let buildingId = sourceFloor.floor_belong_building;
		let building = await Building.findByPk(buildingId);
		let buildingAttachFloor = jsonUtil.jsonToObject(building.building_attach_floor);
		buildingAttachFloor.push(targetFloor.floor_id);
		await building.set({ building_attach_floor: JSON.stringify(buildingAttachFloor) }).save();

		// 复制楼层关联墙体
		let sourceWallId = sourceFloor.floor_attach_wall;
		let sourceWall = await Wall.findByPk(sourceWallId, { raw: true });
		delete sourceWall.wall_id;
		sourceWall.wall_belong_floor = targetFloor.floor_id;
		let targetWall = await Wall.create(sourceWall, { raw: true });

		// 获取楼层关联功能区
		let sourceAreaIdList = jsonUtil.jsonToObject(sourceFloor.floor_attach_area);
		let targetAreaList = [];
		let targetComponentList = [];
		for (let i = 0, len1 = sourceAreaIdList.length; i < len1; i++) {
			// 复制功能区信息
			let sourceArea = await Area.findByPk(sourceAreaIdList[i], { raw: true });
			delete sourceArea.area_id;
			sourceArea.area_belong_floor = targetFloor.floor_id;
			sourceArea.area_attach_wall = targetWall.wall_id;
			let targetArea = await Area.create(sourceArea);

			// 获取关联组件信息
			let sourceComponentIdList = jsonUtil.jsonToObject(sourceArea.area_attach_component);

			for (let j = 0, len2 = sourceComponentIdList.length; j < len2; j++) {
				// 复制组件实例
				let sourceComponent = await Component.findByPk(sourceComponentIdList[j], { raw: true });
				delete sourceComponent.component_id;
				sourceComponent.component_belong_area = targetArea.area_id;
				let targetComponent = await Component.create(sourceComponent, { raw: true });
				targetComponentList.push(targetComponent);
			}
			let targetComponentIdList = JSON.stringify(targetComponentList.map(v => v.component_id));

			// 设置功能区关联组件列表
			targetArea = await targetArea.set(
				{ area_attach_component: targetComponentIdList },
				{ raw: true }
			).save();
			targetAreaList.push(targetArea);
		}
		// 获取楼层关联POI
		let floorPOIIdList = jsonUtil.jsonToObject(sourceFloor.floor_attach_poi);
		let sourcePOIList = [];
		let targetPOIList = [];
		for (let i = 0, len = floorPOIIdList.length; i < len; i++) {
			let sourcePOI = await POI.findByPk(floorPOIIdList[i], { raw: true });
			delete sourcePOI.poi_id;
			sourcePOI.poi_belong_floor = targetFloor.floor_id;
			sourcePOIList.push(sourcePOI);
			let targetPOI = await POI.create(sourcePOI, { raw: true });
			targetPOIList.push(targetPOI);
		}
		// 获取楼层关联连通区域
		let floorPipeIdList = jsonUtil.jsonToObject(sourceFloor.floor_attach_pipe);
		let sourcePipeList = [];
		let targetPipeList = [];
		for (let i = 0, len1 = floorPipeIdList.length; i < len1; i++) {
			let sourcePipe = await Pipe.findByPk(floorPipeIdList[i], { raw: true });
			delete sourcePipe.pipe_id;
			sourcePipe.pipe_belong_floor = targetFloor.floor_id;
			sourcePipeList.push(sourcePipe);
			let targetPOI = await POI.create(sourcePipe, { raw: true });
			targetPipeList.push(targetPOI);
		}

		// 设置 floor 关联 墙体、功能区、POI、连通区域 
		await targetFloor.set(
			{
				floor_attach_wall: targetWall.wall_id,
				floor_attach_area: JSON.stringify(targetAreaList.map(v => v.area_id)),
				floor_attach_poi: JSON.stringify(targetPOIList.map(v => v.poi_id)),
				floor_attach_pipe: JSON.stringify(targetPipeList.map(v => v.pipe_id)),
			}
		).save();

		return {
			floor: this.generateFloor(targetFloor, building.building_floor_height),
			wall: this.generateWall(targetWall, building.building_floor_height, targetFloor.floor_level),
			area: targetAreaList.map(v => this.generateArea(v)),
			component: targetComponentList.map(v => this.generateComponent(v)),
			poi: targetPOIList.map(v => this.generatePOI(v)),
			pipe: targetPipeList.map(v => this.generatePipe(v)),
		}
	}

	/**
	 * 重置楼层的所有的功能区
	 * @param {楼层id} floorId 
	 * @param {功能区信息列表} areaInfoList 
	 * @returns 功能区信息
	 */
	async resetFloorAreas(floorId, areaInfoList) {
		let floor = await Floor.findByPk(floorId);
		let areaIdList = jsonUtil.jsonToObject(floor.floor_attach_area);
		// 删除现有功能区
		await Area.update(
			{ deleted_at: Date.now() },
			{ where: { area_id: { [Op.in]: areaIdList } } }
		);
		await Area.bulkCreate(areaInfoList);
		let areas = await Area.findAll(
			{
				where: {
					area_belong_floor: floorId, deleted_at: null
				},
				raw: true
			}
		);
		// 更新楼层关联功能区
		let floor_attach_area = areas.map(area => area.area_id);
		await floor.update(
			{ floor_attach_area: JSON.stringify(floor_attach_area) },
			{ where: { floor_id: floorId } }
		);
		return areas.map(area => this.generateArea(area))
	}

	/**
	 * 更新墙体信息
	 * @param {墙体id} wallId 
	 * @param {墙体信息} record 
	 * @returns 更新后的墙体信息
	 */
	async updateWall(wallId, record) {
		let wall = await Wall.findByPk(wallId);
		const updated = await wall.set(record).save({ raw: true });
		return updated;
	}

	async updateArea(areaId, info) {
		let area = await Area.findByPk(areaId);
		return await area.set(info).save({ raw: true });
	}

	/**
	 * 插入更新功能区信息
	 * @param {功能区id} areaId 
	 * @param {功能区信息} record 
	 * @returns 更新后的功能区信息
	 */
	async createOrUpdateAreaList(floorId, records) {
		// 根据 area_id 更新或新增功能区
		let areas = await Area.bulkCreate(
			records,
			{
				updateOnDuplicate: ["area_id"]
			}
		);
		// 更新楼层中相关功能区的记录
		let floor = await Floor.findByPk(floorId);
		let floorAttachArea = jsonUtil.jsonToObject(floor.floor_attach_area);
		let newIdList = areas.map(area => area.area_id);
		newIdList.push(...floorAttachArea);
		newIdList = [...new Set(newIdList)];
		await floor.set({ floor_attach_area: JSON.stringify(newIdList) }).save();

		return areas.map(area => this.generateArea(area));
	}

	/**
	 * 批量删除功能区
	 * @param {功能区列表} areaIdList 
	 * @returns 是否删除
	 */
	async deleteAreaList(floorId, areaIdList) {
		// 删除关联功能区
		let deleteNumber = await Area.update(
			{ deleted_at: Date.now() },
			{ where: { area_id: { [Op.in]: areaIdList } } }
		);

		let componentIdList = [];
		for (let id of areaIdList) {
			let area = await Area.findByPk(id);
			let components = jsonUtil.jsonToObject(area.area_attach_component);
			componentIdList.push(...components);
		}

		// 删除关联组件
		await Component.update(
			{ deleted_at: Date.now() },
			{ where: { component_id: { [Op.in]: componentIdList } } }
		);

		// 剔除楼层中相关功能区的记录
		let floor = await Floor.findByPk(floorId);
		let floorAttachArea = jsonUtil.jsonToObject(floor.floor_attach_area);
		floorAttachArea = floorAttachArea.filter(id => areaIdList.indexOf(id) === -1);
		await floor.set({ floor_attach_area: JSON.stringify(floorAttachArea) }).save();

		return deleteNumber[0] > 0;
	}

	async createPOI(floorId, info) {
		let poi = await POI.create(info, { raw: true });
		// 记录楼层对应的POI
		let floor = await Floor.findByPk(floorId);
		let pois = jsonUtil.jsonToObject(floor.floor_attach_poi);
		pois.push(poi.poi_id);
		await floor.set({ floor_attach_poi: JSON.stringify(pois) }).save();
		// 更新功能区相关POI为当前POI
		if (typeof (+info.poi_belong_area) === "number" && +info.poi_belong_area !== -1) {
			let areaId = +info.poi_belong_area;
			await Area.update({ area_attach_poi: poi.poi_id }, { where: { area_id: areaId } });
		}
		return this.generatePOI(poi);
	}

	async deletePOI(floorId, poiId) {
		let poi = await POI.findByPk(poiId);
		await poi.set({ deleted_at: Date.now() }).save({ raw: true });
		// 删除楼层对应的POI的记录
		let floor = await Floor.findByPk(floorId);
		let pois = jsonUtil.jsonToObject(floor.floor_attach_poi);
		let index = pois.findIndex(v => +v === +poiId);
		pois.splice(index, 1);
		await floor.set({ floor_attach_poi: JSON.stringify(pois) }).save();
		// 设置功能区关联POI为空
		if (typeof (+poi.poi_belong_area) === "number" && +poi.poi_belong_area !== -1) {
			let areaId = +poi.poi_belong_area;
			await Area.update({ area_attach_poi: -1 }, { where: { area_id: areaId } });
		}
		return poi;
	}

	async updatePOI(poiId, info) {
		let poi = await POI.findByPk(poiId);
		// 设置功能区关联POI为空
		if (typeof (+poi.poi_belong_area) === "number" && +poi.poi_belong_area !== -1) {
			let areaId = +poi.poi_belong_area;
			await Area.update({ area_attach_poi: -1 }, { where: { area_id: areaId } });
		}
		// 更新功能区相关POI为当前POI
		if (typeof (+info.poi_belong_area) === "number" && +info.poi_belong_area !== -1) {
			let areaId = +info.poi_belong_area;
			await Area.update({ area_attach_poi: poiId }, { where: { area_id: areaId } });
		}
		return await poi.set(info).save({ raw: true });
	}

	generateMap(mapInfo) {
		return {
			"type": "Feature",
			"properties":
			{
				"model": "map",
				"map_id": mapInfo.map_id,
				"map_name": mapInfo.map_name,
				"map_tag": mapInfo.map_tag,
				"map_preview_path": mapInfo.map_preview_path,
				"map_attach_building": mapInfo.map_attach_building,
				"map_owner": mapInfo.map_owner,
				"map_access_level": mapInfo.map_access_level,
				"map_access_w_list": mapInfo.map_access_w_list,
				"map_access_r_list": mapInfo.map_access_r_list,
				"map_access_w_group": mapInfo.map_access_w_group,
				"map_access_r_group": mapInfo.map_access_r_group,
			}
		}
	}

	generateBuilding(buildingInfo, buildingFloorLevelMax, buildingFloorLevelMin, floorLevelList, floorLevelMap) {
		return {
			"type": "Feature",
			"properties":
			{
				"model": "building",
				"building_id": buildingInfo.building_id,
				"building_name": buildingInfo.building_name,
				"building_type": buildingInfo.building_type,
				"building_center_lng": buildingInfo.building_center_lng,
				"building_center_lat": buildingInfo.building_center_lat,
				"building_floor_height": buildingInfo.building_floor_height,
				"building_floor_level_max": buildingFloorLevelMax,
				"building_floor_level_min": buildingFloorLevelMin,
				"building_floor_level_list": floorLevelList,
				"building_floor_level_map": floorLevelMap,
				"building_belong_map": buildingInfo.building_belong_map,
				"building_attach_floor": jsonUtil.jsonToObject(buildingInfo.building_attach_floor),
				"building_attach_pipe": jsonUtil.jsonToObject(buildingInfo.building_attach_pipe),
				"building_owner": buildingInfo.building_owner,
				"building_access_level": buildingInfo.building_access_level,
				"building_access_w_list": buildingInfo.building_access_w_list,
				"building_access_r_list": buildingInfo.building_access_r_list,
				"building_access_w_group": buildingInfo.building_access_w_group,
				"building_access_r_group": buildingInfo.building_access_r_group,
			},
			"geometry": jsonUtil.jsonToObject(buildingInfo.building_geometry)
		}
	}

	generateFloor(floorInfo, floorHeight) {
		return {
			"type": "Feature",
			"properties":
			{
				"model": "floor",
				"floor_id": floorInfo.floor_id,
				"floor_name": floorInfo.floor_name,
				"floor_level": floorInfo.floor_level,
				"floor_height": floorHeight,
				"floor_belong_building": floorInfo.floor_belong_building,
				"floor_attach_wall": floorInfo.floor_attach_wall,
				"floor_attach_area": jsonUtil.jsonToObject(floorInfo.floor_attach_area),
				"floor_attach_poi": jsonUtil.jsonToObject(floorInfo.floor_attach_poi),
				"floor_attach_pipe": jsonUtil.jsonToObject(floorInfo.floor_attach_pipe),
				"floor_owner": floorInfo.floor_owner,
				"floor_access_level": floorInfo.floor_access_level,
				"floor_access_w_list": floorInfo.floor_access_w_list,
				"floor_access_r_list": floorInfo.floor_access_r_list,
				"floor_access_w_group": floorInfo.floor_access_w_group,
				"floor_access_r_group": floorInfo.floor_access_r_group,
			},
			"geometry": jsonUtil.jsonToObject(floorInfo.floor_geometry)
		}
	}

	generateWall(wallInfo, floorHeight, floorLevel) {
		return {
			"type": "GeometryCollection",
			"properties":
			{
				"model": "wall",
				"wall_id": wallInfo.wall_id,
				"wall_thick": wallInfo.wall_thick,
				"wall_floor_height": floorHeight,
				"wall_floor_level": floorLevel,
				"wall_thick_list": [WALL_CONFIG.WALL_THICK_1, WALL_CONFIG.WALL_THICK_2, WALL_CONFIG.WALL_THICK_3],
				"wall_belong_floor": wallInfo.wall_belong_floor,
				"wall_attach_area": jsonUtil.jsonToObject(wallInfo.wall_attach_area),
				"wall_attach_pipe": jsonUtil.jsonToObject(wallInfo.wall_attach_pipe),
				"wall_owner": wallInfo.wall_owner,
			},
			"geometries": [
				jsonUtil.jsonToObject(wallInfo.wall_geometry),
				jsonUtil.jsonToObject(wallInfo.wall_inside_geometry)
			]
		}
	}

	generateArea(areaInfo) {
		return {
			"type": "Feature",
			"properties":
			{
				"model": "area",
				"area_id": areaInfo.area_id,
				"area_name": areaInfo.area_name,
				"area_type": +areaInfo.area_type,
				"area_belong_floor": areaInfo.area_belong_floor,
				"area_attach_poi": areaInfo.area_attach_poi,
				"area_attach_pipe": jsonUtil.jsonToObject(areaInfo.area_attach_pipe),
				"area_attach_wall": areaInfo.area_attach_wall,
				"area_attach_component": jsonUtil.jsonToObject(areaInfo.area_attach_component),
				"area_owner": areaInfo.area_owner,
				"area_access_level": areaInfo.area_access_level,
				"area_access_w_list": areaInfo.area_access_w_list,
				"area_access_r_list": areaInfo.area_access_r_list,
				"area_access_w_group": areaInfo.area_access_w_group,
				"area_access_r_group": areaInfo.area_access_r_group,
			},
			"geometry": jsonUtil.jsonToObject(areaInfo.area_geometry)
		}
	}

	generatePOI(poiInfo) {
		return {
			"type": "Feature",
			"properties":
			{
				"model": "poi",
				"poi_id": poiInfo.poi_id,
				"poi_res": poiInfo.poi_res,
				"poi_name": poiInfo.poi_name,
				"poi_height": poiInfo.poi_height,
				"poi_belong_floor": poiInfo.poi_belong_floor,
				"poi_belong_area": poiInfo.poi_belong_area,
			},
			"geometry": jsonUtil.jsonToObject(poiInfo.poi_geometry)
		}
	}

	generatePipe(pipeInfo) {
		return {
			"type": "Feature",
			"properties": {
				"model": "pipe",
				"pipe_id": pipeInfo.pipe_id,
				"pipe_name": pipeInfo.pipe_name,
				"pipe_type": pipeInfo.pipe_type,
				"pipe_height": pipeInfo.pipe_height,
				"pipe_belong_floor": pipeInfo.pipe_belong_floor,
				"pipe_belong_wall": pipeInfo.pipe_belong_wall,
			},
			"geometry": jsonUtil.jsonToObject(pipeInfo.pipe_geometry)
		}
	}

	generateComponent(componentInfo) {
		return {
			"type": "Feature",
			"properties": {
				"model": "component",
				"component_id": componentInfo.component_id,
				"component_name": componentInfo.component_name,
				"component_model": componentInfo.component_model,
				"component_scale_x": componentInfo.component_scale_x,
				"component_scale_y": componentInfo.component_scale_y,
				"component_scale_z": componentInfo.component_scale_z,
				"component_height": componentInfo.component_height,
				"component_belong_area": componentInfo.component_belong_area,
			},
			"geometry": jsonUtil.jsonToObject(componentInfo.component_geometry)
		}
	}

}

const instance = new EditorService();

module.exports = { instance };