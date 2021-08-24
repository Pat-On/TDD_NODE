const express = require('express');
const UserRouter = require('./user/UserRouter');

const app = express();

app.use(express.json());

app.use(UserRouter);

//base we set value of it in the package.json file
// console.log('env: ' + process.env.NODE_ENV);

module.exports = app;
