import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import getApp from '../../utils/getApp';
import appRouter from '.';

let request;

jest.mock('../../utils/getApp', () => ({
  __esModule: true,
  default: jest.fn(),
}));

beforeAll(async () => {
  request = await createInstance(new Koa().use(appRouter));
});

afterAll(async () => {
  await request.close();
});

it('should serve a PWA manifest', async () => {
  getApp.mockReturnValue({
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      theme: { splashColor: '#deffde', themeColor: '#fa86ff' },
    },
    OrganizationId: 'manitest',
  });
  const response = await request.get('/manifest.json');
  expect(response).toMatchObject({
    status: 200,
    headers: expect.objectContaining({
      'content-type': 'application/manifest+json; charset=utf-8',
    }),
    data: {
      background_color: '#deffde',
      display: 'standalone',
      icons: [
        { sizes: '48x48', src: '/icon-48.png', type: 'image/png' },
        { sizes: '144x144', src: '/icon-144.png', type: 'image/png' },
        { sizes: '192x192', src: '/icon-192.png', type: 'image/png' },
        { sizes: '512x512', src: '/icon-512.png', type: 'image/png' },
      ],
      name: 'Test App',
      orientation: 'any',
      scope: '/',
      short_name: 'Test App',
      start_url: '/test-page',
      theme_color: '#fa86ff',
    },
  });
});

it('should fallback to sane defaults', async () => {
  getApp.mockReturnValue({
    path: 'test-app',
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
    },
    OrganizationId: 'manitest',
  });
  const response = await request.get('/manifest.json');
  expect(response).toMatchObject({
    status: 200,
    headers: expect.objectContaining({
      'content-type': 'application/manifest+json; charset=utf-8',
    }),
    data: {
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { sizes: '48x48', src: '/icon-48.png', type: 'image/png' },
        { sizes: '144x144', src: '/icon-144.png', type: 'image/png' },
        { sizes: '192x192', src: '/icon-192.png', type: 'image/png' },
        { sizes: '512x512', src: '/icon-512.png', type: 'image/png' },
      ],
      name: 'Test App',
      orientation: 'any',
      scope: '/',
      short_name: 'Test App',
      start_url: '/test-page',
      theme_color: '#ffffff',
    },
  });
});
