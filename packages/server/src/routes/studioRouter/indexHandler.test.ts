import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import type { KoaContext } from '../../types';
import studioRouter from '.';

let app: Koa;
let templateName: string;
let templateData: object;

jest.mock('crypto');

beforeAll(async () => {
  app = new Koa();
  app.context.argv = { host: 'https://app.example:9999' };
  app.use(async (ctx: KoaContext, next) => {
    ctx.state.render = async (template, data) => {
      templateName = template;
      templateData = data;
      return '<!doctype html>';
    };
    return next();
  });
  app.use(studioRouter);
  await setTestApp(app);
});

it('should serve the studio index page with correct headers', async () => {
  app.context.argv = {
    host: 'http://localhost:9999',
  };
  const response = await request.get('/');
  expect(response).toMatchObject({
    headers: expect.objectContaining({
      'content-security-policy':
        'connect-src *' +
        "; default-src 'self'" +
        "; font-src 'self' https://fonts.gstatic.com" +
        '; frame-src *.localhost:9999 http://localhost:9999' +
        '; img-src * blob: data:' +
        "; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-9sOokSPGKu0Vo4/TBZI1T7Bm5ThrXz9qTWATwd3augo=' 'unsafe-eval'" +
        "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'content-type': 'text/html; charset=utf-8',
    }),
    data: '<!doctype html>',
  });
  expect(templateName).toBe('studio.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings: '<script>window.settings={"enableRegistration":true,"logins":[]}</script>',
  });
});

it('should pass login options from argv to the studio', async () => {
  app.context.argv = {
    disableRegistration: true,
    host: 'http://localhost:9999',
    gitlabClientId: 'GitLab secret',
    googleClientId: 'Google secret',
    sentryDsn: 'https://secret@sentry.io/path',
  };
  const response = await request.get('/');
  expect(response).toMatchObject({
    headers: expect.objectContaining({
      'content-security-policy':
        'connect-src *' +
        "; default-src 'self'" +
        "; font-src 'self' https://fonts.gstatic.com" +
        '; frame-src *.localhost:9999 http://localhost:9999' +
        '; img-src * blob: data:' +
        '; report-uri https://sentry.io/api/path/security/?sentry_key=secret' +
        "; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-55BH1zlzYBdLKuc8rxGYlA+gttOW/TiZC2YsrbcbG8Q=' 'unsafe-eval'" +
        "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'content-type': 'text/html; charset=utf-8',
    }),
    data: '<!doctype html>',
  });
  expect(templateName).toBe('studio.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings: `<script>window.settings=${JSON.stringify({
      enableRegistration: false,
      logins: [
        {
          authorizationUrl: 'https://gitlab.com/oauth/authorize',
          clientId: 'GitLab secret',
          icon: 'gitlab',
          name: 'GitLab',
          scope: 'email openid profile',
        },
        {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
          clientId: 'Google secret',
          icon: 'google',
          name: 'Google',
          scope: 'email openid profile',
        },
      ],
      sentryDsn: 'https://secret@sentry.io/path',
    })}</script>`,
  });
});
