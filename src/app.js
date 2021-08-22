const express = require('express');
const User = require('./user/User');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.post('/api/1.0/users', (req, res) => {
  bcrypt.hash(req.body.password, 12).then((hash) => {
    // const user = { ...req.body, password: hash };

    // another way of doing it in JS
    const user = Object.assign({}, req.body, { password: hash });
    // const user = {
    //   username: req.body.username,
    //   email: req.body.email,
    //   password: hash,
    // };
    // (2) saved the user to db after creating test
    User.create(user).then(() => {
      return res.status(200).send({
        message: 'User created',
      });
    });
  });

  // first part he checked conection (1)
});

module.exports = app;
