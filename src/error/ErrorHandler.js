// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // wow, so basically test were not passing because without next it is not middleware!
  const { status, message, errors } = err;
  let validationErrors;
  if (errors) {
    validationErrors = {};
    errors.forEach((error) => (validationErrors[error.param] = req.t(error.msg)));
  }

  res.status(status).send({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: req.t(message),
    validationErrors,
  });

  //   console.log(err);
};
