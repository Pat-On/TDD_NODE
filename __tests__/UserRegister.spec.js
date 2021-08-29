const request = require('supertest');
const app = require('../src/app');

// to mock the nodemailer
const nodemailerStub = require('nodemailer-stub');
const EmailService = require('../src/email/EmailService');

const User = require('../src/user/User');
const sequelize = require('../src/config/database');
// const { describe } = require('../src/user/User');
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
// this function will be ran before all test
beforeAll(() => {
  // we need to initialize db
  return sequelize.sync();
});
// called before each test
beforeEach(() => {
  // cleaning user table before each table
  return User.destroy({ truncate: true });
});

//Importan: each test has to be isolated to it has to run and to not have impact on
// results of other test - reliable - in that case db with predictable state

// INTEGRATION TESTS - they are not focues on how we implemented things
// so because of that we can do with implementation what we want
describe('User Registration', () => {
  it('returns 200 OK when signup request is valid with done', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    postUser()
      // expect is not async
      // if we want to mark it as async we need to pass done as a second argumeny
      // like he said without done it would solve test in sync way
      .expect(200, done);
  });

  // another approach
  it('returns 200 OK when signup request is valid with then', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    postUser().then((response) => {
      expect(response.status).toBe(200);
      done();
    });
  });

  it('return success message when signup request is valid', async () => {
    const response = await postUser();
    //rest api is pointing that good practise is to put api/version/plural
    expect(response.body.message).toBe('User created');
  });

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

  const username_null = 'Username cannot be null';
  const username_size = 'Must have a min 4 and max 32 characters';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is not valid';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters';

  const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  const email_in_use = 'E-mail in use';
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'lowerUPPER'}    | ${password_pattern}
    ${'password'} | ${'12345678'}      | ${password_pattern}
    ${'password'} | ${'UPPER1234'}     | ${password_pattern}
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

  it(`return ${email_in_use} when email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser(validUser);

    expect(response.body.validationErrors.email).toBe(email_in_use);
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
  it('send an account activation email with activationToken', async () => {
    await postUser();
    const lastMail = nodemailerStub.interactsWithMail.lastMail();
    expect(lastMail.to).toContain('user1@email.com'); //last mail is the array
    // expect(lastMail.to[0]).toBe('user1@email.com');
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail.content).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    // interesting!
    // this mocking is going to be kept if we are not going to clean it
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser();
    expect(response.status).toBe(502);
    mockSendAccountActivation.mockRestore();
  });

  it('returns Email failure message when sending email fails', async () => {
    // interesting!
    // this mocking is going to be kept if we are not going to clean it
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser();

    mockSendAccountActivation.mockRestore();
    expect(response.body.message).toBe('E-mail Failure');

    // why this one is the reason of the error in internationalization?
    // when the send({}) in response is empty?
    // mockSendAccountActivation.mockRestore();
  });

  it('does not save user to dabase if activation email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    await postUser();

    mockSendAccountActivation.mockRestore();
    const users = await User.findAll();
    expect(users.length).toBe(0);
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

  const username_null = 'Uzytkownik nie moze byc null';
  const username_size = 'Musi miec pomiedzy 4 a 32 symbole';
  const email_null = 'Email nie moze byc null';
  const email_invalid = 'Nieprawidlowy email';
  const password_null = 'Haslo nie moze byc null';
  const password_size = 'Haslo musi zawierac przynajmniej 6 symbol';
  const password_pattern = 'Haslo musi zawierac przynajmniej 1 litere, 1 cyfre i 1 znak specjalny';
  const email_in_use = 'Email uzyciu';
  const user_create_successs = 'Udana rejestracja';
  const email_failure = 'Awaria serwisu email';

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'lowerUPPER'}    | ${password_pattern}
    ${'password'} | ${'12345678'}      | ${password_pattern}
    ${'password'} | ${'UPPER1234'}     | ${password_pattern}
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

  it(`return ${user_create_successs} when signup request is valid and language is set as polish`, async () => {
    const response = await postUser(validUser, { language: 'pl' });
    //rest api is pointing that good practise is to put api/version/plural
    expect(response.body.message).toBe(user_create_successs);
  });

  it(`return ${email_in_use} when email is already in use when language is set as a polish`, async () => {
    await User.create({ ...validUser });
    const response = await postUser(validUser, { language: 'pl' });

    expect(response.body.validationErrors.email).toBe(email_in_use);
  });

  it(`returns ${email_failure} message when sending emails fails and language is set as polish`, async () => {
    // interesting!
    // this mocking is going to be kept if we are not going to clean it
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser({ ...validUser }, { language: 'pl' });

    mockSendAccountActivation.mockRestore();
    expect(response.body.message).toBe(email_failure);
  });
});
