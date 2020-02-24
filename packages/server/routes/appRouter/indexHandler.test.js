import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import createServer from '../../utils/createServer';
import testSchema from '../../utils/test/testSchema';

let db;
let request;
let templateName;
let templateParams;

beforeAll(async () => {
  db = await testSchema('apps');
  const { BlockAsset, BlockDefinition, BlockVersion, Organization } = db.models;
  const organization = await Organization.create({ id: 'test' });
  await BlockDefinition.bulkCreate([
    { id: '@test/a' },
    { id: '@test/b' },
    { id: '@appsemble/a' },
    { id: '@appsemble/b' },
  ]);
  await BlockVersion.bulkCreate([
    { name: '@test/a', version: '0.0.0' },
    { name: '@test/a', version: '0.0.1' },
    { name: '@test/b', version: '0.0.0' },
    { name: '@test/b', version: '0.0.2' },
    { name: '@appsemble/a', version: '0.1.0' },
    { name: '@appsemble/a', version: '0.1.1' },
    { name: '@appsemble/b', version: '0.1.0' },
    { name: '@appsemble/b', version: '0.1.2' },
  ]);
  await BlockAsset.bulkCreate([
    { name: '@test/a', version: '0.0.0', filename: 'a0.js', content: Buffer.from('') },
    { name: '@test/a', version: '0.0.0', filename: 'a0.css', content: Buffer.from('') },
    { name: '@test/a', version: '0.0.1', filename: 'a1.js', content: Buffer.from('') },
    { name: '@test/a', version: '0.0.1', filename: 'a1.css', content: Buffer.from('') },
    { name: '@test/b', version: '0.0.0', filename: 'b0.js', content: Buffer.from('') },
    { name: '@test/b', version: '0.0.0', filename: 'b0.css', content: Buffer.from('') },
    { name: '@test/b', version: '0.0.2', filename: 'b2.js', content: Buffer.from('') },
    { name: '@test/b', version: '0.0.2', filename: 'b2.css', content: Buffer.from('') },
    { name: '@appsemble/a', version: '0.1.0', filename: 'a0.js', content: Buffer.from('') },
    { name: '@appsemble/a', version: '0.1.0', filename: 'a0.css', content: Buffer.from('') },
    { name: '@appsemble/a', version: '0.1.1', filename: 'a1.js', content: Buffer.from('') },
    { name: '@appsemble/a', version: '0.1.1', filename: 'a1.css', content: Buffer.from('') },
    { name: '@appsemble/b', version: '0.1.0', filename: 'b0.js', content: Buffer.from('') },
    { name: '@appsemble/b', version: '0.1.0', filename: 'b0.css', content: Buffer.from('') },
    { name: '@appsemble/b', version: '0.1.2', filename: 'b2.js', content: Buffer.from('') },
    { name: '@appsemble/b', version: '0.1.2', filename: 'b2.css', content: Buffer.from('') },
  ]);
  await organization.createApp({
    definition: {
      pages: [
        {
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          type: 'flow',
          subPages: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: {
                    whatever: {
                      blocks: [{ type: '@test/b', version: '0.0.2' }],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    path: 'app',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });
  const app = new Koa();
  app.use((ctx, next) => {
    Object.defineProperty(ctx, 'origin', { value: 'http://app.test.host.example' });
    ctx.state.render = (name, params) => {
      templateName = name;
      templateParams = params;
      return '';
    };
    return next();
  });
  const server = await createServer({
    app,
    argv: { host: 'http://host.example', secret: 'test' },
    db,
  });
  request = await createInstance(server);
}, 10e3);

afterEach(() => {
  templateName = undefined;
  templateParams = undefined;
});

afterAll(async () => {
  await request.close();
  await db.close();
});

it('should render the index page', async () => {
  const { headers, status } = await request.get('/');
  expect(templateName).toBe('app.html');
  expect(status).toBe(200);
  expect(headers['content-type']).toBe('text/html; charset=utf-8');
  const [, settingsString] = templateParams.settings.match(
    /^<script>window.settings=(.*)<\/script>$/,
  );
  const settings = JSON.parse(settingsString);
  expect(settings).toStrictEqual({
    apiUrl: 'http://host.example',
    blockManifests: [
      {
        name: '@test/a',
        version: '0.0.0',
        layout: null,
        actions: null,
        events: null,
        files: ['a0.js', 'a0.css'],
      },
      {
        name: '@test/b',
        version: '0.0.2',
        layout: null,
        actions: null,
        events: null,
        files: ['b2.js', 'b2.css'],
      },
      {
        name: '@appsemble/a',
        version: '0.1.0',
        layout: null,
        actions: null,
        events: null,
        files: ['a0.js', 'a0.css'],
      },
      {
        name: '@appsemble/a',
        version: '0.1.1',
        layout: null,
        actions: null,
        events: null,
        files: ['a1.js', 'a1.css'],
      },
    ],
    id: 1,
    vapidPublicKey: '',
    organizationId: 'test',
    definition: {
      pages: [
        {
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          type: 'flow',
          subPages: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                },
              ],
            },
          ],
        },
      ],
    },
  });
});
