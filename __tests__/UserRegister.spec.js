const request = require('supertest');
const app = require('../src/app');

const User = require('../src/user/User');
const sequelize = require('../src/config/database');

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

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid with done', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      // expect is not async
      // if we want to mark it as async we need to pass done as a second argumeny
      // like he said without done it would solve test in sync way
      .expect(200, done);
  });

  // another approach
  it('returns 200 OK when signup request is valid with then', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      });
  });

  it('return success message when signup request is valid', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        expect(response.body.message).toBe('User created');
        done();
      });
  });

  it('saves the user to database', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
        // querry to db for a user if was created
        User.findAll().then((usersList) => {
          expect(usersList.length).toBe(1);
          // done has to be inside this because if not it will not work in proper way!
          done();
        });
      });
  });

  it('Saves the username and email to database', (done) => {
    //rest api is pointing that good practise is to put api/version/plural
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
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
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
        // querry t db for a user if was created
        User.findAll().then((userList) => {
          const savedUser = userList[0];
          expect(savedUser.password).not.toBe('P4ssword');
          done();
        });
      });
  });
});
