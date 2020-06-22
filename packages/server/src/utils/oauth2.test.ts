import { AppsembleError } from '@appsemble/node-utils';
import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { sign } from 'jsonwebtoken';

import { getAccessToken, getUserInfo } from './oauth2';

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

describe('getAccessToken', () => {
  it('should make an access token request', async () => {
    let config: AxiosRequestConfig;
    mock.onPost('https://example.com/token').reply((req) => {
      config = req;
      return [200, { access_token: 'token' }];
    });
    const result = await getAccessToken(
      'https://example.com/token',
      'test_code',
      'http://localhost/callback',
      'test_id',
      'test_secret',
    );
    expect(config.data).toBe(
      'grant_type=authorization_code&client_id=test_id&client_secret=test_secret&code=test_code&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback',
    );
    expect(config.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      authorization: 'Basic dGVzdF9pZDp0ZXN0X3NlY3JldA==',
    });
    expect(result).toStrictEqual({ access_token: 'token' });
  });
});

describe('getUserInfo', () => {
  it('should read information from the id token', async () => {
    const userInfo = await getUserInfo(
      '',
      sign(
        {
          email: 'me@example.com',
          email_verified: true,
          name: 'Me',
          profile: 'https://example.com/me',
          picture: 'https://example.com/me.png',
          sub: '42',
        },
        'secret',
      ),
    );
    expect(userInfo).toStrictEqual({
      email: 'me@example.com',
      email_verified: true,
      name: 'Me',
      profile: 'https://example.com/me',
      picture: 'https://example.com/me.png',
      sub: '42',
    });
  });

  it('should fall back to the access token', async () => {
    const userInfo = await getUserInfo(
      sign({ sub: '1337' }, 'secret'),
      sign(
        {
          email: 'user@example.com',
          name: 'User',
          profile: 'https://example.com/user',
          picture: 'https://example.com/user.png',
        },
        'secret',
      ),
    );
    expect(userInfo).toStrictEqual({
      email: 'user@example.com',
      email_verified: false,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.png',
      sub: '1337',
    });
  });

  it('should fall back to user info endpoint', async () => {
    mock.onGet('/userinfo').reply(() => [
      200,
      {
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.png',
      },
    ]);
    const userInfo = await getUserInfo('', sign({ sub: '1337' }, 'secret'), '/userinfo');
    expect(userInfo).toStrictEqual({
      email: 'user@example.com',
      email_verified: false,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.png',
      sub: '1337',
    });
  });

  it('should support a remapper for the user info endpoint', async () => {
    mock.onGet('/user').reply(() => [
      200,
      {
        emailAddress: 'user@example.com',
        fullName: 'User',
        profileUrl: 'https://example.com/user',
        avatarUrl: 'https://example.com/user.png',
        userId: 1337,
      },
    ]);
    const userInfo = await getUserInfo('', null, '/user', [
      {
        'object.from': {
          email: [{ prop: 'emailAddress' }],
          name: [{ prop: 'fullName' }],
          profile: [{ prop: 'profileUrl' }],
          picture: [{ prop: 'avatarUrl' }],
          sub: [{ prop: 'userId' }],
        },
      },
    ]);
    expect(userInfo).toStrictEqual({
      email: 'user@example.com',
      email_verified: false,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.png',
      sub: '1337',
    });
  });

  it('should throw if no subject could be found', async () => {
    await expect(getUserInfo('')).rejects.toThrow(
      new AppsembleError('No subject could be found while logging in using OAuth2'),
    );
  });
});
