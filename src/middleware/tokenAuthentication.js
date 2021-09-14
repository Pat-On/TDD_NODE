const TokenService = require('../auth/TokenService');

const tokenAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization);
  if (authorization) {
    const token = authorization.substring(7);
    try {
      const user = await TokenService.verify(token);
      req.authenticatedUser = user;
      // eslint-disable-next-line no-empty
    } catch (err) {
      // we do not need to do anything here because if the user is not added to req it would fail
    }
  }
  next();
};

module.exports = tokenAuthentication;
