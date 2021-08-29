const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');
// const User = require('./User');

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
  async (req, res) => {
    // after refactoring - test are still passing
    const errors = validationResult(req);
    // if (req.validationErrors) {
    //   const response = { validationErrors: { ...req.validationErrors } };
    //   return res.status(400).send(response);
    // }
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = req.t(error.msg)));
      // const response = { validationErrors: { ...req.validationErrors } };
      return res.status(400).send({ validationErrors: validationErrors });
    }
    try {
      await UserService.save(req.body);
      return res.status(200).send({ message: req.t('user_create_success') });
      // first part he checked conection (1)
    } catch (err) {
      return res.status(502).send({ message: req.t(err.message) });
    }
  }
);

router.post('/api/1.0/users/token/:activationToken', async (req, res) => {
  const activationToken = req.params.activationToken;
  try {
    await UserService.activate(activationToken);
  } catch (err) {
    return res.status(400).send({ message: req.t(err.message) });
  }
  res.send({ message: req.t('account_activation_success') });
});
// CONSOEL
module.exports = router;
