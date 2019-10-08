#!/usr/bin/env node
import faPkg from '@fortawesome/fontawesome-free/package.json';
import Koa from 'koa';
import compress from 'koa-compress';
import mount from 'koa-mount';
import koaQuerystring from 'koa-qs';
import range from 'koa-range';
import session from 'koa-session';
import serve from 'koa-static';
import koasBodyParser from 'koas-body-parser';
import koas from 'koas-core';
import koasOAuth2Server from 'koas-oauth2-server';
import koasOperations from 'koas-operations';
import koasParameters from 'koas-parameters';
import koasSerializer from 'koas-serializer';
import koasSpecHandler from 'koas-spec-handler';
import koasStatusCode from 'koas-status-code';
import koasSwaggerUI from 'koas-swagger-ui';
import path from 'path';
import raw from 'raw-body';

import api from '../api';
import * as operations from '../controllers';
import boom from '../middleware/boom';
import oauth2 from '../middleware/oauth2';
import routes from '../routes';
import Mailer from './email/Mailer';
import oauth2Model from './oauth2Model';

export default async function createServer({
  app = new Koa(),
  argv = {},
  db,
  secret = 'appsemble',
}) {
  // eslint-disable-next-line no-param-reassign
  app.keys = [secret];
  app.use(session(app));

  app.use(boom);
  app.use(range);
  Object.assign(app.context, { argv, db, mailer: new Mailer(argv) });

  if (argv.oauthGitlabKey || argv.oauthGoogleKey) {
    app.use(oauth2(argv));
  }

  koaQuerystring(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }

  app.use(
    mount(
      `/fa/${faPkg.version}`,
      serve(path.dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
    ),
  );

  app.use(
    await koas(api(), [
      koasSpecHandler(),
      koasSwaggerUI({ url: '/api-explorer' }),
      koasOAuth2Server(oauth2Model({ db, secret })),
      koasParameters(),
      koasBodyParser({
        '*/*': (body, mediaTypeObject, ctx) =>
          raw(body, {
            length: ctx.request.length,
          }),
      }),
      koasSerializer(),
      koasStatusCode(),
      koasOperations({ operations }),
    ]),
  );
  app.use(routes);

  return app.callback();
}
