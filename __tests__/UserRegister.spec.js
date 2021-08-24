const request = require('supertest');
const app = require('../src/app');

const User = require('../src/user/User');
const sequelize = require('../src/config/database');
/**
 * note: TDD has three steps:
 * 1. write our test
 * 2. implementation which fix test
 * 3. refactor - clean and reusable code
 */

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
  const validUser = {
    username: 'user1',
    email: 'user1@email.com',
    password: 'P4ssword',
  };

  const postUser = (user = validUser) => {
    return request(app).post('/api/1.0/users').send(user);
  };

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

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have a min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have a min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'Email is not valid'}
    ${'email'}    | ${'user.mail.com'} | ${'Email is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerUPPER'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'12345678'}      | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER1234'}     | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
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

  // Three tests replaced by the dynamic test

  // it('return 400 when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@email.com',
  //     password: 'P4ssword',
  //   });
  //   expect(response.status).toBe(400);
  // });

  // it('return username cannot be null when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@email.com',
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;
  //   // just check if it is existing
  //   expect(body.validationErrors.username).toBe('Username cannot be null');
  // });

  // it('return email cannot be null when email is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;

  //   expect(body.validationErrors.email).toBe('Email cannot be null');
  // });

  /*
added as well to loop test
*/

  // it('Returns size validation error when username is less than 4 characters', async () => {
  //   const user = {
  //     username: 'usr',
  //     email: 'user1@email.com',
  //     password: 'P4ssword',
  //   };

  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Must have a min 4 and max 32 characters');
  // });
});
