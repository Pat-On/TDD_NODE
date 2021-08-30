const User = require('./User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const EmaiService = require('../email/EmailService');
const sequalize = require('../config/database');

const EmailException = require('../email/EmailException');
const InvalidTokenException = require('./InvalidTokenException');
const UserNotFoundException = require('./UserNotFoundException');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 12);
  const user = { username: username, email: email, password: hash, activationToken: generateToken(16) };

  // idea of transactions in sql
  const transaction = await sequalize.transaction();
  await User.create(user, { transaction });

  try {
    await EmaiService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    //at this point we are throwing not an "error" but new exception which is
    // going to be catch in UserRouter
    throw new EmailException();
  }
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });

  if (!user) {
    throw new InvalidTokenException();
  }

  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async (page, size) => {
  const usersWithCount = await User.findAndCountAll({
    where: { inactive: false },
    attributes: ['id', 'username', 'email'],
    limit: size,
    //part of pagination
    offset: page * size,
  });
  // const count = await User.count({ where: { inactive: false } });
  return {
    content: usersWithCount.rows,
    page: page,
    size: size,
    totalPages: Math.ceil(usersWithCount.count / size),
  };
};

const getUser = async (id) => {
  const user = await User.findOne({
    where: { id: id, inactive: false },
    attributes: ['id', 'username', 'email'],
  });
  if (!user) {
    throw new UserNotFoundException();
  }
  return user;
};

module.exports = { save, findByEmail, activate, getUsers, getUser };
