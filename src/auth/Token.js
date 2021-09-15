const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;
class Token extends Model {}

Token.init(
  {
    token: {
      type: Sequelize.STRING,
    },
    userId: {
      type: Sequelize.INTEGER,
    },
  },
  {
    sequelize,
    modelName: 'token',
  }
);
// synchronize - just for production

module.exports = Token;
