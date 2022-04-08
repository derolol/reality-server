const { Sequelize } = require("sequelize");
const { db } = require("../config");

const sequelize = new Sequelize({
  dialect: "mysql",
  host: db.host,
  port: db.port,
  database: db.database,
  username: db.username,
  password: db.password,
  timezone: '+08:00',
  define: {
    freezeTableName: true, // 设置模型和数据表同名
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  },
});

sequelize.sync({
  force: false,
  alter: true
}).then(res => {
  console.log("完成数据库同步");
}).catch(err => {
  console.log("数据库同步失败", err);
});

module.exports = sequelize;