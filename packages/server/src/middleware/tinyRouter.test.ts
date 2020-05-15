import type { Boom } from '@hapi/boom';
import { AxiosTestInstance, createInstance } from 'axios-test-instance';
import Koa from 'koa';

import type { KoaContext } from '../types';
import tinyRouter from './tinyRouter';

let app: Koa;
let context: KoaContext;
let request: AxiosTestInstance;

beforeEach(async () => {
  app = new Koa();
  app.silent = true;
  app.use((ctx: KoaContext, next) => {
    context = ctx;
    return next();
  });
  request = await createInstance(app);
});

afterEach(async () => {
  await request.close();
});

it('should assign the match group to params', async () => {
  app.use(
    tinyRouter([
      {
        route: /^\/(?<foo>.+)\/(?<bar>.+)/,
        get() {},
      },
    ]),
  );
  await request.get('/1/2');
  expect(context.params).toStrictEqual({ foo: '1', bar: '2' });
});

it('should throw method not allowed if a URL is matched, but not for the given method', async () => {
  let error: Boom;
  app.on('error', (err) => {
    error = err;
  });
  app.use(
    tinyRouter([
      {
        route: '/',
        get() {},
      },
    ]),
  );
  await request.post('/');
  expect(error.isBoom).toBe(true);
  expect(error.output.statusCode).toBe(405);
});

it('should fall back to the any handler if it exists ', async () => {
  const any = jest.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        any,
      },
    ]),
  );
  await request.post('/');
  expect(any).toHaveBeenCalled();
});

it('should pick method specific middleware over any', async () => {
  const any = jest.fn();
  const get = jest.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        any,
        get,
      },
    ]),
  );
  await request.get('/');
  expect(any).not.toHaveBeenCalled();
  expect(get).toHaveBeenCalled();
});

it('should not call next if there are matching routes', async () => {
  const middleware = jest.fn();
  app.use(
    tinyRouter([
      {
        route: '/',
        get() {},
      },
    ]),
  );
  app.use(middleware);
  await request.get('/');
  expect(middleware).not.toHaveBeenCalled();
});

it('should call next if there are no matching routes', async () => {
  const middleware = jest.fn();
  app.use(tinyRouter([]));
  app.use(middleware);
  await request.get('/');
  expect(middleware).toHaveBeenCalled();
});
