import path from 'path';

import fs from 'fs-extra';
import serve from 'koa-static';
import mustache from 'mustache';

export default async function configureStatic(app, webpackConfigs) {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, '../../../dist');
    app.use(serve(distDir, { immutable: true, maxage: 365 * 24 * 60 * 60 * 1e3 }));
    app.use(async (ctx, next) => {
      ctx.state.render = async (filename, data) => {
        const template = await fs.readFile(path.join(distDir, filename), 'utf8');
        return mustache.render(template, data);
      };
      await next();
    });
  } else {
    const { default: koaWebpack } = await import('koa-webpack');
    const { default: webpack } = await import('webpack');
    const { default: webpackConfigApp } = await import('../../../config/webpack/app');
    const { default: webpackConfigEditor } = await import('../../../config/webpack/editor');
    const configApp = webpackConfigApp(null, { mode: 'development' });
    const configEditor = webpackConfigEditor(null, { mode: 'development' });
    configApp.output.path = configApp.output.publicPath;
    configEditor.output.path = configEditor.output.publicPath;
    const compiler = webpack([configApp, configEditor, ...webpackConfigs]);
    const middleware = await koaWebpack({
      compiler,
      config: null,
      devMiddleware: {
        logLevel: 'warn',
        publicPath: '/',
        serverSideRender: true,
      },
    });
    app.use(middleware);
    app.use(async (ctx, next) => {
      ctx.state.render = async (filename, data) => {
        // ctx.state.fs is injected by koa-webpack.
        const template = ctx.state.fs.readFileSync(`/${filename}`, 'utf8');
        return mustache.render(template, data);
      };
      await next();
    });
  }
}
