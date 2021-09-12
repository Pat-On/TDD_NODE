const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');
const ForbiddenException = require('../error/ForbiddenException');
// const User = require('./User');
const pagination = require('../middleware/pagination');
// const UserNotFoundException = require('./UserNotFoundException');

router.post(
  '/api/1.0/users',
  // validateUsername,
  // validateEmail,
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail() // it will stop at this point if previous field gave error
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_in_use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_pattern'),
  async (req, res, next) => {
    // after refactoring - test are still passing
    const errors = validationResult(req);
    // if (req.validationErrors) {
    //   const response = { validationErrors: { ...req.validationErrors } };
    //   return res.status(400).send(response);
    // }
    if (!errors.isEmpty()) {
      // const validationErrors = {};
      // errors.array().forEach((error) => (validationErrors[error.param] = req.t(error.msg)));
      // const response = { validationErrors: { ...req.validationErrors } };
      // return res.status(400).send({ validationErrors: validationErrors });
      return next(new ValidationException(errors.array()));
    }
    try {
      await UserService.save(req.body);
      return res.status(200).send({ message: req.t('user_create_success') });
      // first part he checked conection (1)
    } catch (err) {
      // return res.status(502).send({ message: req.t(err.message) });
      next(err);
    }
  }
);

router.post('/api/1.0/users/token/:activationToken', async (req, res, next) => {
  const activationToken = req.params.activationToken;
  try {
    await UserService.activate(activationToken);
    return res.send({ message: req.t('account_activation_success') });
  } catch (err) {
    // return res.status(400).send({ message: req.t(err.message) });
    next(err);
  }
});

router.get('/api/1.0/users', pagination, async (req, res) => {
  const { page, size } = req.pagination;
  const users = await UserService.getUsers(page, size);
  res.send(users);
});

router.get('/api/1.0/users/:id', async (req, res, next) => {
  // res.status(404).send({ message: req.t('user_not_found') });
  try {
    const user = await UserService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});

router.put('/api/1.0/users/:id', () => {
  throw new ForbiddenException('unauthorized_user_update');

  // res.status(403).send();
});

// CONSOEL
module.exports = router;
