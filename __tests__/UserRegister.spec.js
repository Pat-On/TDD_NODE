const request = require('supertest');
const app = require('../src/app');

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
});
