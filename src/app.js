const express = require('express');
const User = require('./user/User');

const app = express();
app.use(express.json());
app.post('/api/1.0/users', (req, res) => {
  // (2) saved the user to db after creating test
  User.create(req.body).then(() => {
    return res.status(200).send({
      message: 'User created',
    });
  });

  // first part he checked conection (1)
});

module.exports = app;
