import { Context, Middleware } from 'koa';
import compose from 'koa-compose';
import { Configuration } from 'webpack';

/**
 * Bypass the dev server for API requests to speed them up.
 */
const skipRoute = /^\/(api|oauth2\/token)/;

export async function frontend(webpackConfigs: Configuration[]): Promise<Middleware> {
  const { default: webpackDevMiddleware } = await import('webpack-dev-middleware');
  const { webpack } = await import('webpack');
  // eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-import
  const { default: expressToKoa } = await import('express-to-koa');
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore Because the webpack core config isn’t built when building the server, an error is
  // expected here at build time, but while type checking.
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { createAppConfig, createStudioConfig } = await import('@appsemble/webpack-core');
  const configApp = createAppConfig({ mode: 'development' });
  const configStudio = createStudioConfig({ mode: 'development' });
  const configs = [configApp, configStudio, ...webpackConfigs];
  const compiler = webpack(configs);
  const middleware = webpackDevMiddleware(compiler, { serverSideRender: true });
  // @ts-expect-error outputFileSystem exists despite what the types say.
  const fs: import('memfs').IFs = middleware.context.outputFileSystem;
  const koaDevMiddleware = expressToKoa(middleware);

  return compose<Context>([
    (ctx, next) => {
      ctx.fs = fs;
      return next();
    },
    (ctx, next) => (skipRoute.test(ctx.path) ? next() : koaDevMiddleware(ctx, next)),
  ]);
}
