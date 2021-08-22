const express = require('express');
const router = express.Router();
const UserService = require('./UserService');

router.post('/api/1.0/users', async (req, res) => {
  // after refactoring - test are still passing
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
});

module.exports = router;
