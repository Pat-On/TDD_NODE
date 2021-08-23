const express = require('express');
const router = express.Router();
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');

// const validateUsername = (req, res, next) => {
//   const user = req.body;
//   if (user.username === null) {
//     req.validationErrors = {
//       username: 'Username cannot be null',
//     };
//   }
//   next();
// };

// const validateEmail = (req, res, next) => {
//   const user = req.body;
//   if (user.email === null) {
//     req.validationErrors = {
//       ...req.validationErrors,
//       email: 'Email cannot be null',
//     };
//   }
//   next();
// };

router.post(
  '/api/1.0/users',
  // validateUsername,
  // validateEmail,
  check('username').notEmpty().withMessage('Username cannot be null'),
  check('email').notEmpty().withMessage('Email cannot be null'),
  check('password').notEmpty().withMessage('Password cannot be null'),
  async (req, res) => {
    // after refactoring - test are still passing
    const errors = validationResult(req);
    // if (req.validationErrors) {
    //   const response = { validationErrors: { ...req.validationErrors } };
    //   return res.status(400).send(response);
    // }
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
      // const response = { validationErrors: { ...req.validationErrors } };
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await UserService.save(req.body);
    return res.status(200).send({ message: 'User created' });

    //   bcrypt.hash(req.body.password, 12).then((hash) => {
    //     // const user = { ...req.body, password: hash };

    //     // another way of doing it in JS
    //     const user = Object.assign({}, req.body, { password: hash });
    //     // const user = {
    //     //   username: req.body.username,
    //     //   email: req.body.email,
    //     //   password: hash,
    //     // };
    //     // (2) saved the user to db after creating test
    //     User.create(user).then(() => {
    //       return res.status(200).send({
    //         message: 'User created',
    //       });
    //     });
    //   });

    // first part he checked conection (1)
  }
);

module.exports = router;
