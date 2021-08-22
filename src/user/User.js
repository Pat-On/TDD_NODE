const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;
class User extends Model {}

User.init(
  {
    // attributes
    username: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
  },
  {
    // config
    sequelize,
    modelName: 'User',
  }
);
// synchronize
sequelize.sync();

module.exports = User;
