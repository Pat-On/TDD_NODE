const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('database');

// console.log('*****************', dbConfig.dialect);
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  // disabling console log - logging
  logging: dbConfig.logging,
});

// const sequelize = new Sequelize('hoaxify', 'my-db-user', 'db-p4ss', {
//   dialect: 'sqlite',
//   storage: './database.sqlite',
//   logging: false,
// });

module.exports = sequelize;
