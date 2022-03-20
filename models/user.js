const sequelize = require('./sequelize');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户id'
  },
  user_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '用户',
    comment: '用户名'
  },
  user_password: {
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
    comment: '用户密码'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    defaultValue: '',
    comment: '用户手机号'
  },
  user_wechat: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '',
    comment: '用户微信号'
  },
  user_image_path: {
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
    comment: '用户头像路径'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户删除时间',
  },
}, {
  tableName: 'user'
});

const UserGroup = sequelize.define('UserGroup', {
  user_group_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户组id'
  },
  user_group_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '用户组',
    comment: '用户组名'
  },
  user_group_tag: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    comment: '用户组标签'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户组删除时间',
  },
}, {
  tableName: 'user_group'
});

const UserGroupMember = sequelize.define('UserGroupMember', {
  user_group_member_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户组成员关系id'
  },
  member_user_group: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: '用户组id'
  },
  member_user: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: '成员id'
  },
  member_type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '成员类型'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '成员删除时间',
  },
}, {
  tableName: 'user_group_member'
});

module.exports = { User, UserGroup, UserGroupMember };