// const jwt = require('jsonwebtoken');
const { randomString } = require('../shared/generator');
const Token = require('./Token');

const createToken = async (user) => {
  const token = randomString(32);

  await Token.create({
    token: token,
    userId: user.id,
  });
  return token;
  // return jwt.sign({ id: user.id }, 'this-is-our-secret', { expiresIn: 10 });
};

const verify = async (token) => {
  const tokenInDB = await Token.findOne({ where: { token: token } });
  const userId = tokenInDB.userId;
  return { id: userId };
  // return jwt.verify(token, 'this-is-our-secret');
};

module.exports = {
  createToken,
  verify,
};
