import { resolve } from 'path';

import { Middleware } from 'koa';
import serve from 'koa-static';

/**
 * @param name - The folder containing static assets inside the disr dir
 * @returns Koa middleware which serves the specified dist directory.
 */
export function staticHandler(name: string): Middleware {
  return serve(resolve(__dirname, '..', '..', '..', 'dist', name), {
    index: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}