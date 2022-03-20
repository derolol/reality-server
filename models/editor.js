const sequelize = require('./sequelize');
const { DataTypes } = require('sequelize');

/**
 * 
 * 地图模型
 * 
 */
const Map = sequelize.define('Map', {
  map_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '地图id'
  },
  map_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '地图',
    comment: '地图名称'
  },
  map_tag: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图标签'
  },
  map_preview_path: {
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
    comment: '地图预览图片路径'
  },
  map_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图轮廓'
  },
  map_attach_building: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图关联建筑'
  },
  map_owner: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: '地图所有者'
  },
  map_access_level: {
    type: DataTypes.ENUM,
    values: ['1', '2', '3', '4', '5'],
    allowNull: false,
    defaultValue: '1',
    comment: '地图访问权限级别'
  },
  map_access_r_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图查看权限用户白名单'
  },
  map_access_w_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图修改权限用户白名单'
  },
  map_access_r_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图查看权限用户组白名单'
  },
  map_access_w_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '地图修改权限用户组白名单'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '地图删除时间',
  },
}, {
  tableName: 'map'
});

/**
 * 
 * 建筑模型
 * 
 */
const Building = sequelize.define('Building', {
  building_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '建筑id'
  },
  building_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '建筑',
    comment: '建筑名称'
  },
  building_type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '建筑类型'
  },
  building_center_lng: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
    defaultValue: 0,
    comment: '建筑中心点经度'
  },
  building_center_lat: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
    defaultValue: 0,
    comment: '建筑中心点纬度'
  },
  building_floor_height: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 3,
    comment: '建筑楼层高度'
  },
  building_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑轮廓'
  },
  building_belong_map: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '建筑所属地图id'
  },
  building_attach_floor: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑关联楼层'
  },
  building_owner: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '建筑创建者'
  },
  building_access_level: {
    type: DataTypes.ENUM,
    values: ['1', '2', '3', '4', '5'],
    allowNull: false,
    defaultValue: '1',
    comment: '建筑访问权限级别'
  },
  building_access_r_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑查看权限用户白名单'
  },
  building_access_w_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑修改权限用户白名单'
  },
  building_access_r_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑查看权限用户组白名单'
  },
  building_access_w_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑修改权限用户组白名单'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '建筑删除时间',
  },
}, {
  tableName: 'building'
});

/**
 * 
 * 楼层模型
 * 
 */
const Floor = sequelize.define('Floor', {
  floor_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '楼层id'
  },
  floor_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '楼层',
    comment: '楼层名称'
  },
  floor_level: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: '楼层所在层号'
  },
  floor_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑轮廓'
  },
  floor_belong_building: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '楼层所属建筑id'
  },
  floor_attach_wall: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '建筑关联墙体id'
  },
  floor_attach_area: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '建筑关联功能区'
  },
  floor_owner: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '楼层创建者'
  },
  floor_access_level: {
    type: DataTypes.ENUM,
    values: ['1', '2', '3', '4', '5'],
    allowNull: false,
    defaultValue: '1',
    comment: '楼层访问权限级别'
  },
  floor_access_r_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '楼层查看权限用户白名单'
  },
  floor_access_w_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '楼层修改权限用户白名单'
  },
  floor_access_r_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '楼层查看权限用户组白名单'
  },
  floor_access_w_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '楼层修改权限用户组白名单'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '楼层删除时间',
  },
}, {
  tableName: 'floor'
});

/**
 * 
 * 墙体模型
 * 
 */
const Wall = sequelize.define('Wall', {
  wall_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '墙体id'
  },
  wall_thick: {
    type: DataTypes.ENUM,
    values: ['1', '2', '3'],
    allowNull: false,
    defaultValue: '2',
    comment: '墙体厚度'
  },
  wall_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '墙体图形'
  },
  wall_belong_floor: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '墙体所属楼层id'
  },
  wall_attach_area: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '墙体关联功能区'
  },
  wall_attach_pipe: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '墙体关联连通区域',
  },
  wall_owner: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '墙体创建者'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '墙体删除时间',
  },
}, {
  tableName: 'wall'
});

/**
 * 
 * 功能区模型
 * 
 */
const Area = sequelize.define('Area', {
  area_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '功能区id'
  },
  area_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '功能区',
    comment: '功能区名称'
  },
  area_type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '功能区类型'
  },
  area_belong_floor: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '功能区所属楼层'
  },
  area_attach_wall: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '功能区关联墙体'
  },
  area_attach_poi: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '功能区关联POI'
  },
  area_attach_pipe: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区关联连通区域'
  },
  area_attach_component: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区关联组件'
  },
  area_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区轮廓'
  },
  area_owner: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '功能区创建者'
  },
  area_access_level: {
    type: DataTypes.ENUM,
    values: ['1', '2', '3', '4', '5'],
    allowNull: false,
    defaultValue: '1',
    comment: '功能区访问权限级别'
  },
  area_access_r_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区查看权限用户白名单'
  },
  area_access_w_list: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区修改权限用户白名单'
  },
  area_access_r_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区查看权限用户组白名单'
  },
  area_access_w_group: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '功能区修改权限用户组白名单'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '功能区删除时间',
  },
}, {
  tableName: 'area'
});

/**
 * 
 * POI模型
 * 
 */
const POIResource = sequelize.define('POIResource', {
  poi_res_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: 'id'
  },
  poi_res_type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'POI类型'
  },
  poi_res_label_level_1: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '',
    comment: 'POI一级标签'
  },
  poi_res_label_level_2: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '',
    comment: 'POI二级标签'
  },
  poi_res_image_level_1: {
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
    comment: 'POI一级图标路径'
  },
  poi_res_image_level_2: {
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
    comment: 'POI二级图标路径'
  },
  poi_res_belong_user: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: 'POI资源所属用户(系统-1)'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'POI资源删除时间',
  },
}, {
  tableName: 'poi_resource'
});

/**
 * 
 * POI模型
 * 
 */
const POI = sequelize.define('POI', {
  poi_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: 'POIid'
  },
  poi_res: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: 'POI资源id'
  },
  poi_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'POI',
    comment: 'POI名称'
  },
  poi_height: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'POI距离地面高度'
  },
  poi_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: 'POI位置'
  },
  poi_belong_floor: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: 'POI所属楼层'
  },
  poi_belong_area: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: 'POI所属功能区(未分配-1)'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'POI删除时间',
  },
}, {
  tableName: 'poi'
});

/**
 * 
 * 连通区域模型
 * 
 */
const Pipe = sequelize.define('Pipe', {
  pipe_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '连通区域id'
  },
  pipe_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '连通区域',
    comment: '连通区域名称'
  },
  pipe_type: {
    type: DataTypes.ENUM,
    values: ['0', '1'],
    allowNull: false,
    defaultValue: '0',
    comment: '连通区域类型(功能区0/楼层1)'
  },
  pipe_height: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '连通区域距离地面高度(0)'
  },
  pipe_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '连通区域形状(0/1)'
  },
  pipe_belong_floor: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '连通区域所属楼层(1)'
  },
  pipe_belong_wall: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '连通区域所属墙体(0)'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '连通区域删除时间',
  },
}, {
  tableName: 'pipe'
});

/**
 * 
 * 组件模型
 * 
 */
const Component = sequelize.define('Component', {
  component_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '组件id'
  },
  component_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '组件',
    comment: '组件名称'
  },
  component_model: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '组件模型id'
  },
  component_scale_x: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1,
    comment: '组件x轴缩放倍数'
  },
  component_scale_y: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1,
    comment: '组件y轴缩放倍数'
  },
  component_scale_z: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1,
    comment: '组件z轴缩放倍数'
  },
  compoennt_height: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '组件距离地面高度'
  },
  component_geometry: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '组件位置'
  },
  component_belong_area: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1,
    comment: '组件所属功能区'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '组件删除时间',
  },
}, {
  tableName: 'component'
});

module.exports = {
  Map,
  Building,
  Floor,
  Wall,
  Area,
  POIResource,
  POI,
  Pipe,
  Component
}