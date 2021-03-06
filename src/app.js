const express = require('express');
const UserRouter = require('./user/UserRouter');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const errorHandler = require('./error/ErrorHandler');
const AuthenticationRouter = require('./auth/AuthenticationRouter');
const cors = require('cors');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    //internationalization
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      lookupHeader: 'accept-language',
    },
  });

const app = express();

app.use(cors());

app.use(middleware.handle(i18next));

app.use(express.json());

app.use(UserRouter);
app.use(AuthenticationRouter);

app.use(errorHandler);

//base we set value of it in the package.json file
// console.log('env: ' + process.env.NODE_ENV);

module.exports = app;
