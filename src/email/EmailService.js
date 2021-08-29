// at this point we need to be sure that email was send and THEN create user.
const transporter = require('../config/emailTransporter');
const nodemailer = require('nodemailer');

const sendAccountActivation = async (email, token) => {
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `
    <div>
      <b> Please click link below to activate your account </b>
    </div>
    <div>
    <a href="http::/localhost:8080/#/login?token=${token}">ACTIVATE</a>
    </div>
    Token is ${token}`,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('url: ' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendAccountActivation };
