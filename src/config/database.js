const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('database');

console.log('*****************', dbConfig.dialect);
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  // disabling console log - logging
  logging: dbConfig.logging,
});

module.exports = sequelize;
