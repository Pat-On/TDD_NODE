const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequalize = require('../src/config/database');
const bcrypt = require('bcrypt');

beforeAll(async () => {
  await sequalize.sync();
});

beforeEach(async () => {
  await User.destroy({ truncate: true });
});

const activeUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);

  user.password = hash;
  return await User.create(user);
};

const postAuthentication = async (credentials, options = {}) => {
  let agent = request(app).post('/api/1.0/auth');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return await agent.send(credentials);
};

describe('Authentication', () => {
  it('returns 200 when credentials are correct', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(200);
  });

  it('returns only user id and username when login success', async () => {
    const user = await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username']);
  });

  it('returns 401 when user does not exist', async () => {
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('return proper error body when authentication fails', async () => {
    const nowInMilis = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;
    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMilis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it.each`
    language | message
    ${'pl'}  | ${'nieprawidlowe haslo lub email'}
    ${'en'}  | ${'incorect credentials'}
  `('return $message when authentication fails and language is set as $language', async ({ language, message }) => {
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' }, { language });
    expect(response.body.message).toBe(message);
  });

  it('return 401 when password is wrong', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'password' });
    expect(response.status).toBe(401);
  });

  it('returns 403 when logging in with an inactive account', async () => {
    await addUser({ ...activeUser, inactive: true });
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.status).toBe(403);
  });

  it('return proper error body when inactive authentication fails', async () => {
    await addUser({ ...activeUser, inactive: true });
    const nowInMilis = new Date().getTime();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const error = response.body;
    expect(error.path).toBe('/api/1.0/auth');
    expect(error.timestamp).toBeGreaterThan(nowInMilis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it.each`
    language | message
    ${'pl'}  | ${'Konto jest niekatywne'}
    ${'en'}  | ${'Account is inactive'}
  `(
    'return $message when authentication fails for inactive account and language is set as $language',
    async ({ language, message }) => {
      await addUser({ ...activeUser, inactive: true });
      const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' }, { language });
      expect(response.body.message).toBe(message);
    }
  );

  it('returns 401 when e-mail is not valid', async () => {
    const response = await postAuthentication({ password: 'P4ssword' });
    expect(response.status).toBe(401);
  });

  it('returns 401 when password is not valid', async () => {
    const response = await postAuthentication({ email: 'user1@mail.com' });
    expect(response.status).toBe(401);
  });
});
