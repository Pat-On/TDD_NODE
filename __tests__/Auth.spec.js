const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequalize = require('../src/config/database');
const bcrypt = require('bcrypt');
const en = require('../locales/en/translation.json');
const pl = require('../locales/pl/translation.json');
const Token = require('../src/auth/Token');

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

  it('returns only user id and username and token when login success', async () => {
    const user = await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.body.id).toBe(user.id);
    expect(response.body.username).toBe(user.username);
    expect(Object.keys(response.body)).toEqual(['id', 'username', 'token']);
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
    ${'pl'}  | ${pl.authentication_failure}
    ${'en'}  | ${en.authentication_failure}
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
    ${'pl'}  | ${pl.inactive_authentication_failure}
    ${'en'}  | ${en.inactive_authentication_failure}
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
  it('returns token in response body when credential are correct', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    expect(response.body.token).not.toBeUndefined();
  });
});

const postLogout = (options = {}) => {
  const agent = request(app).post('/api/1.0/logout');
  if (options.token) {
    agent.set('authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('Logout', () => {
  it('return 200 ok when  unauthorize request send for logout', async () => {
    const response = await postLogout();
    expect(response.status).toBe(200);
  });

  it('removes the token from database', async () => {
    await addUser();
    const response = await postAuthentication({ email: 'user1@mail.com', password: 'P4ssword' });
    const token = response.body.token;
    await postLogout({
      token: token,
    });

    const storedToken = await Token.findOne({ where: { token: token } });
    expect(storedToken).toBeNull();
  });
});
