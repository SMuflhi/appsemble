import Koa from 'koa';
import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('app controller', () => {
  let app;
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema('health');
    app = new Koa();
    server = await createServer({ app, db });
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return status ok if all services are connected properly', async () => {
    jest.spyOn(app.context.mailer, 'verify').mockResolvedValue();
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ database: true, smtp: true });
  });

  it('should fail if the database is disconnected', async () => {
    jest.spyOn(app.context.mailer, 'verify').mockResolvedValue();
    jest.spyOn(db, 'authenticate').mockImplementation(() => Promise.reject(new Error('stub')));
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toStrictEqual({
      statusCode: 503,
      message: 'API unhealthy',
      error: 'Service Unavailable',
      data: {
        database: false,
        smtp: true,
      },
    });
  });

  it('should fail if smtp credentials are incorrect is disconnected', async () => {
    jest.spyOn(app.context.mailer, 'verify').mockRejectedValue();
    const response = await request(server).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toStrictEqual({
      statusCode: 503,
      message: 'API unhealthy',
      error: 'Service Unavailable',
      data: {
        database: true,
        smtp: false,
      },
    });
  });
});
