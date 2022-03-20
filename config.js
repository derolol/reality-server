const path = require('path');

module.exports = {
  port: '3000',
  secret: 'LZJ@de$RO!L#OLRE&Ality',
  publicDir: path.resolve(__dirname, './public'),
  logPath: path.resolve(__dirname, './logs/realityServer.log'),
  db: {
    database: 'reality',
    username: 'root',
    password: 'root@123456',
    host: '127.0.0.1',
    port: 3306
  }
}