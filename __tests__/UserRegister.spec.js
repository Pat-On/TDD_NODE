const request = require('supertest');
const app = require('../src/app');

const User = require('../src/user/User');
const sequelize = require('../src/config/database');

const SMTPServer = require('smtp-server').SMTPServer;
const en = require('../locales/en/translation.json');
const pl = require('../locales/pl/translation.json');
/**
 * note: TDD has three steps:
 * 1. write our test
 * 2. implementation which fix test
 * 3. refactor - clean and reusable code
 */
const validUser = {
  username: 'user1',
  email: 'user1@email.com',
  password: 'P4ssword',
};

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
};

let lastMail, server;
let simulateSmtpFailure = false;
// this function will be ran before all test
beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });
  await server.listen(8587, 'localhost');
  // we need to initialize db
  await sequelize.sync();
  // setting timeout
  jest.setTimeout(20000);
});
// called before each test
beforeEach(async () => {
  simulateSmtpFailure = false;
  // cleaning user table before each table
  await User.destroy({ truncate: true });
});

afterAll(async () => {
  await server.close();
  // setting back timeout back to 5 seconds
  jest.setTimeout(5000);
});
//Importan: each test has to be isolated to it has to run and to not have impact on
// results of other test - reliable - in that case db with predictable state

// INTEGRATION TESTS - they are not focues on how we implemented things
// so because of that we can do with implementation what we want
describe('User Registration', () => {
  // in case of failing the test on slower machine when server on backend is standing up
  // third argument in it() function - it depends from the environment

  it('returns 200 OK when signup request is valid with done', (done) => {
    simulateSmtpFailure = false;
    //rest api is pointing that good practise is to put api/version/plural
    postUser()
      // expect is not async
      // if we want to mark it as async we need to pass done as a second argumeny
      // like he said without done it would solve test in sync way
      .expect(200, done);
  }, 15000);

  // another approach
  it('returns 200 OK when signup request is valid with then', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    postUser().then((response) => {
      expect(response.status).toBe(200);
      done();
    });
  }, 15000);

  it('return success message when signup request is valid', async () => {
    const response = await postUser();
    //rest api is pointing that good practise is to put api/version/plural
    expect(response.body.message).toBe(en.user_create_success);
  }, 15000);

  it('saves the user to database', async () => {
    await postUser();
    const usersList = await User.findAll();
    expect(usersList.length).toBe(1);

    //rest api is pointing that good practise is to put api/version/plural
    // postValidUser().then(() => {
    //   // querry to db for a user if was created
    //   User.findAll().then((usersList) => {
    //     expect(usersList.length).toBe(1);
    //     // done has to be inside this because if not it will not work in proper way!
    //     done();
    //   });
    // });
  });

  it('Saves the username and email to database', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    postUser().then(() => {
      // querry t db for a user if was created
      User.findAll().then((userList) => {
        const savedUser = userList[0];
        expect(savedUser.username).toBe('user1');
        expect(savedUser.email).toBe('user1@email.com');
        done();
      });
    });
  });

  it('Hashes the password in database', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    postUser().then(() => {
      // querry t db for a user if was created
      User.findAll().then((userList) => {
        const savedUser = userList[0];
        expect(savedUser.password).not.toBe('P4ssword');
        done();
      });
    });
  });

  // Section 4: Validation
  it('return errors for both  when email and username is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;

    // we do nopt care about the values because we already checked it before
    // we have to be careful because it may come in differen order - order is important in that case
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('returns Password cannot be null message, when password is null', async () => {
    const response = await postUser({
      username: 'user1',
      email: 'user1@MediaList.com',
      password: null,
    });
    const body = response.body;
    expect(body.validationErrors.password).toBe('Password cannot be null');
  });
  it('Returns validationErrors field in response body when validation errors occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'P4ssword',
    });
    const body = response.body;
    // just check if it is existing
    expect(body.validationErrors).not.toBeUndefined();
  });

  // DYNAMIC TEST
  it.each([
    ['username', 'Username cannot be null'],
    ['email', 'Email cannot be null'],
    ['password', 'Password cannot be null'],
  ])('DYNAMIC: When %s is null %s is received', async (field, expectedMessage) => {
    const user = {
      username: 'user1',
      email: 'user1@email.com',
      password: 'P4ssword',
    };
    user[field] = null;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  // const username_null = 'Username cannot be null';
  // const username_size = 'Must have a min 4 and max 32 characters';
  // const email_null = 'Email cannot be null';
  // const email_invalid = 'Email is not valid';
  // const password_null = 'Password cannot be null';
  // const password_size = 'Password must be at least 6 characters';

  // const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  // const email_in_use = 'E-mail in use';
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${en.username_null}
    ${'username'} | ${'usr'}           | ${en.username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${en.username_size}
    ${'email'}    | ${null}            | ${en.email_null}
    ${'email'}    | ${'mail.com'}      | ${en.email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${en.email_invalid}
    ${'email'}    | ${'user@mail'}     | ${en.email_invalid}
    ${'password'} | ${null}            | ${en.password_null}
    ${'password'} | ${'P4ssw'}         | ${en.password_size}
    ${'password'} | ${'alllowercase'}  | ${en.password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${en.password_pattern}
    ${'password'} | ${'lowerUPPER'}    | ${en.password_pattern}
    ${'password'} | ${'12345678'}      | ${en.password_pattern}
    ${'password'} | ${'UPPER1234'}     | ${en.password_pattern}
  `('DYNAMIC: Returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@email.com',
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it(`return ${en.email_in_use} when email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser(validUser);

    expect(response.body.validationErrors.email).toBe(en.email_in_use);
  });

  it('return for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('Create user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });
  it('Create user in inactive mode even the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('Create an activationToken for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
    // falsy: null, undefined, '', 0, false
  });

  // to test nodemailer we will have to mock the functionality of it.
  // control behaving - so in future if we would like to replace this,
  // we will have to replace the tests as well
  // fit('send an account activation email with activationToken', async () => {
  it('send an account activation email with activationToken', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain('user1@email.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.status).toBe(502);
  });

  it('returns Email failure message when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();

    expect(response.body.message).toBe('E-mail Failure');
  });

  it('does not save user to dabase if activation email fails', async () => {
    simulateSmtpFailure = true;
    await postUser();

    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  it('Returns Validation Failure message in error response ', async () => {
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    expect(response.body.message).toBe('Validation Failure');
  });
});

/*
        INTERNATIONALIZATION
*/

describe('Internationalization', () => {
  const validUser = {
    username: 'user1',
    email: 'user1@email.com',
    password: 'P4ssword',
  };

  // const username_null = 'Uzytkownik nie moze byc null';
  // const username_size = 'Musi miec pomiedzy 4 a 32 symbole';
  // const email_null = 'Email nie moze byc null';
  // const email_invalid = 'Nieprawidlowy email';
  // const password_null = 'Haslo nie moze byc null';
  // const password_size = 'Haslo musi zawierac przynajmniej 6 symbol';
  // const password_pattern = 'Haslo musi zawierac przynajmniej 1 litere, 1 cyfre i 1 znak specjalny';
  // const email_in_use = 'Email uzyciu';
  // const user_create_successs = 'Udana rejestracja';
  // const email_failure = 'Awaria serwisu email';
  // const validation_error = 'Blad Walidacji';
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${pl.username_null}
    ${'username'} | ${'usr'}           | ${pl.username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${pl.username_size}
    ${'email'}    | ${null}            | ${pl.email_null}
    ${'email'}    | ${'mail.com'}      | ${pl.email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${pl.email_invalid}
    ${'email'}    | ${'user@mail'}     | ${pl.email_invalid}
    ${'password'} | ${null}            | ${pl.password_null}
    ${'password'} | ${'P4ssw'}         | ${pl.password_size}
    ${'password'} | ${'alllowercase'}  | ${pl.password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${pl.password_pattern}
    ${'password'} | ${'lowerUPPER'}    | ${pl.password_pattern}
    ${'password'} | ${'12345678'}      | ${pl.password_pattern}
    ${'password'} | ${'UPPER1234'}     | ${pl.password_pattern}
  `(
    'DYNAMIC: Returns $expectedMessage when $field is $value when language is set as a polish',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      };
      user[field] = value;
      const response = await postUser(user, { language: 'pl' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`return ${pl.user_create_successs} when signup request is valid and language is set as polish`, async () => {
    const response = await postUser(validUser, { language: 'pl' });
    //rest api is pointing that good practise is to put api/version/plural
    expect(response.body.message).toBe(pl.user_create_success);
  });

  it(`return ${pl.email_in_use} when email is already in use when language is set as a polish`, async () => {
    await User.create({ ...validUser });
    const response = await postUser(validUser, { language: 'pl' });

    expect(response.body.validationErrors.email).toBe(pl.email_in_use);
  });

  it(`returns ${pl.email_failure} message when sending emails fails and language is set as polish`, async () => {
    simulateSmtpFailure = true;
    const response = await postUser({ ...validUser }, { language: 'pl' });

    expect(response.body.message).toBe(pl.email_failure);
  });

  it(`returns ${pl.validation_failure} message in  error respondse body when `, async () => {
    const response = await postUser(
      {
        username: null,
        email: validUser.email,
        password: 'P4ssword',
      },
      { language: 'pl' }
    );
    expect(response.body.message).toBe(pl.validation_failure);
  });
});

describe('Account activation', () => {
  it('Activates the account when correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('Removes the token from user table after successful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it('Does not activate the account when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('Return bad request when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it.each`
    language | tokenStatus  | message
    ${'pl'}  | ${'wrong'}   | ${pl.account_activation_failure}
    ${'en'}  | ${'wrong'}   | ${en.account_activation_failure}
    ${'pl'}  | ${'correct'} | ${pl.account_activation_success}
    ${'en'}  | ${'correct'} | ${en.account_activation_success}
  `(
    'returns $message when  token is ${tokenStatus} sent and language is $language',
    async ({ language, message, tokenStatus }) => {
      await postUser();
      let token = 'this-token-does-not-exist';
      if (tokenStatus === 'correct') {
        let users = await User.findAll();
        token = users[0].activationToken;
      }
      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('accept-language', language)
        .send();
      expect(response.body.message).toBe(message);
    }
  );
});

describe('Error Modal', () => {
  it('Returns path, timestamp, message and validationErrors in response when validation failure', async () => {
    const response = await postUser({
      ...validUser,
      username: null,
    });
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });

  it('returns path, timestamp and message in response when request fails other than validation', async () => {
    // await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message']);
  });

  it('return path in error body', async () => {
    // await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.path).toEqual('/api/1.0/users/token/' + token);
  });

  it('returns timestamp in miliseconds within 5 seconds value in error body', async () => {
    const nowInMillin = new Date().getTime();
    const fiveSecondsLater = nowInMillin + 5 * 1000;
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.timestamp).toBeGreaterThan(nowInMillin);
    expect(body.timestamp).toBeLessThan(fiveSecondsLater);
  });
});
