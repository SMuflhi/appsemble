import { createInstance } from 'axios-test-instance';
import fs from 'fs-extra';
import Koa from 'koa';
import path from 'path';

import appRouter from '.';

let app;
let state;
let request;

function readIcon() {
  return fs.readFile(path.join(__dirname, '__fixtures__', 'tux.png'));
}

beforeEach(async () => {
  state = {};
  app = new Koa();
  app.use((ctx, next) => {
    Object.assign(ctx.state, state);
    return next();
  });
  app.use(appRouter);
  request = await createInstance(app, { responseType: 'arraybuffer' });
});

afterEach(async () => {
  await request.close();
});

it('should scale and serve the app icon', async () => {
  state.app = {
    icon: await readIcon(),
  };
  const response = await request.get('/icon-150.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should use the splash color if an opaque icon is requested', async () => {
  state.app = {
    definition: { theme: { splashColor: '#ff0000', themeColor: '#00ff00' } },
    icon: await readIcon(),
  };
  const response = await request.get('/icon-52.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the theme color if splash color is undefined', async () => {
  state.app = {
    definition: { theme: { themeColor: '#00ff00' } },
    icon: await readIcon(),
  };
  const response = await request.get('/icon-85.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if neither theme color not splash color is defined', async () => {
  state.app = {
    definition: { theme: {} },
    icon: await readIcon(),
  };
  const response = await request.get('/icon-24.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to a white background if theme is undefined', async () => {
  state.app = {
    definition: {},
    icon: await readIcon(),
  };
  const response = await request.get('/icon-235.png?opaque');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should fall back to the Appsemble icon if no app icon is defined', async () => {
  state.app = {};
  const response = await request.get('/icon-42.png');
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});
