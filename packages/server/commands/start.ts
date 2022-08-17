import http from 'http';
import https from 'https';

import { logger, readFileOrString } from '@appsemble/node-utils';
import { api, asciiLogo } from '@appsemble/utils';
import { captureException } from '@sentry/node';
import { Configuration } from 'webpack';
import { Argv } from 'yargs';

import { migrations } from '../migrations/index.js';
import { initDB } from '../models/index.js';
import pkg from '../package.json';
import { argv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { configureDNS } from '../utils/dns/index.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError } from '../utils/sqlUtils.js';
import { databaseBuilder } from './builder/database.js';

interface AdditionalArguments {
  webpackConfigs?: Configuration[];
}

export const PORT = 9999;
export const command = 'start';
export const description = 'Start the Appsemble server';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('smtp-host', {
      desc: 'The host of the SMTP server to connect to.',
    })
    .option('smtp-port', {
      desc: 'The port of the SMTP server to connect to.',
      type: 'number',
    })
    .option('smtp-secure', {
      desc: 'Use TLS when connecting to the SMTP server.',
      type: 'boolean',
      default: false,
    })
    .option('smtp-user', {
      desc: 'The user to use to login to the SMTP server.',
      implies: ['smtp-pass', 'smtp-from'],
    })
    .option('smtp-pass', {
      desc: 'The password to use to login to the SMTP server.',
      implies: ['smtp-user', 'smtp-from'],
    })
    .option('smtp-from', {
      desc: 'The address to use when sending emails.',
      implies: ['smtp-user', 'smtp-pass'],
    })
    .option('google-client-id', {
      desc: 'The application key to be used for Google OAuth2.',
      implies: ['google-client-secret'],
    })
    .option('google-client-secret', {
      desc: 'The secret key to be used for Google OAuth2.',
      implies: ['google-client-id'],
    })
    .option('github-client-id', {
      desc: 'The application key to be used for GitHub OAuth2.',
      implies: 'github-client-secret',
    })
    .option('github-client-secret', {
      desc: 'The secret key to be used for GitHub OAuth2.',
      implies: 'github-client-id',
    })
    .option('gitlab-client-id', {
      desc: 'The application key to be used for GitLab OAuth2.',
      implies: ['gitlab-client-secret'],
    })
    .option('gitlab-client-secret', {
      desc: 'The secret key to be used for GitLab OAuth2.',
      implies: ['gitlab-client-id'],
    })
    .option('secret', {
      desc: 'Secret key used to sign JWTs and cookies',
      required: true,
    })
    .option('sentry-allowed-domains', {
      desc: 'Domains for apps where Sentry integration should be injected if Sentry is configured. Comma separated domains and wildcards are allowed.',
      default: '*',
    })
    .option('disable-registration', {
      desc: 'If specified, user registration will be disabled on the server',
      type: 'boolean',
      default: false,
    })
    .option('app-domain-strategy', {
      desc: 'How to link app domain names to apps',
      choices: ['kubernetes-ingress'],
    })
    .option('ingress-class-name', {
      desc: 'The class name of the ingresses to create.',
      default: 'nginx',
    })
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc: 'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc: 'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('host', {
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    })
    .option('remote', {
      desc: 'The remote that will be used for downloading unknown blocks. For example: https://appsemble.app',
    })
    .option('proxy', {
      desc: 'Trust proxy headers. This is used to detect the source IP for logging.',
      default: false,
    });
}

export async function handler({ webpackConfigs }: AdditionalArguments = {}): Promise<void> {
  try {
    initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  if (argv.migrateTo) {
    await migrate(argv.migrateTo, migrations);
  }

  await configureDNS();

  const app = await createServer({ webpackConfigs });

  app.on('error', (err, ctx) => {
    if (err.expose) {
      // It is thrown by `ctx.throw()` or `ctx.assert()`.
      return;
    }
    logger.error(err);
    captureException(err, {
      tags: {
        ip: ctx.ip,
        method: ctx.method,
        url: String(ctx.URL),
        'User-Agent': ctx.headers['user-agent'],
      },
    });
  });

  const callback = app.callback();
  const httpServer = argv.ssl
    ? https.createServer(
        {
          key: await readFileOrString(argv.sslKey),
          cert: await readFileOrString(argv.sslCert),
        },
        callback,
      )
    : http.createServer(callback);

  httpServer.listen(argv.port || PORT, '::', () => {
    logger.info(asciiLogo);
    logger.info(api(pkg.version, argv).info.description);
  });
}
