import { OpenAPIV3 } from 'openapi-types';

import pkg from '../../package.json';
import components from './components';
import paths from './paths';
import tags from './tags';

interface APIParams {
  port?: number;
  host?: string;
}

export default ({
  port = 9999,
  host = `http://localhost:${port}`,
}: APIParams = {}): OpenAPIV3.Document => ({
  openapi: '3.0.2',
  components,
  externalDocs: {
    description: 'Appsemble developer documentation',
    url: 'https://appsemble.dev',
  },
  info: {
    title: 'Appsemble',
    description: `
      Welcome to the Appsemble API.

      The app studio can be found on
      > ${host}

      The OpenAPI explorer can be found on
      > ${host}/api/explorer
    `,
    license: {
      name: 'LGPL',
      url: 'https://gitlab.com/appsemble/appsemble/blob/master/LICENSE.md',
    },
    version: pkg.version,
  },
  paths,
  servers: [{ url: '/api' }],
  tags,
});
