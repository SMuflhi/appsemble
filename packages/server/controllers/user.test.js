import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('user', () => {
  let db;
  let user;
  let server;
  let token;
  let EmailAuthorization;
  let Organization;

  beforeAll(async () => {
    db = await testSchema('user');

    server = await createServer({ db, argv: { host: window.location, secret: 'test' } });
    ({ EmailAuthorization, Organization } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    ({ authorization: token, user } = await testToken(db));
    await user.createOrganization({
      id: 'testorganization',
      name: 'Test Organization',
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return a user profile', async () => {
    const { body } = await request(server)
      .get('/api/user')
      .set('Authorization', token);

    expect(body).toStrictEqual({
      id: expect.any(Number),
      name: 'Test User',
      primaryEmail: 'test@example.com',
      emails: [{ email: 'test@example.com', primary: true, verified: true }],
      organizations: [{ id: 'testorganization', name: 'Test Organization' }],
    });
  });

  it('should not return a user profile if not logged in', async () => {
    const response = await request(server).get('/api/user');
    expect(response.status).toStrictEqual(401);
  });

  it('should update the user display name', async () => {
    const { body } = await request(server)
      .put('/api/user')
      .set('Authorization', token)
      .send({ name: 'John', primaryEmail: 'test@example.com' });
    expect(body.name).toStrictEqual('John');
  });

  it('should be possible to add new email addresses', async () => {
    const response = await request(server)
      .post('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(201);

    const { body } = await request(server)
      .get('/api/user')
      .set('Authorization', token);
    expect(body.emails).toContainEqual({
      email: 'test2@example.com',
      verified: false,
      primary: false,
    });
  });

  it('should not be possible to register the same email twice', async () => {
    const response = await request(server)
      .post('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test@example.com' });

    expect(response.status).toStrictEqual(409);
  });

  it('should set a verified email as primary email', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    const { body } = await request(server)
      .put('/api/user')
      .set('Authorization', token)
      .send({ name: 'Test User', primaryEmail: 'test2@example.com' });
    expect(body.primaryEmail).toStrictEqual('test2@example.com');
  });

  it('should not set a non-existent email as primary email', async () => {
    const response = await request(server)
      .put('/api/user')
      .set('Authorization', token)
      .send({ name: 'Test User', primaryEmail: 'test2@example.com' });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'No matching email could be found.',
    });
  });

  it('should not set an unverified email as primary email', async () => {
    await request(server)
      .post('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    const response = await request(server)
      .put('/api/user')
      .set('Authorization', token)
      .send({ name: 'Test User', primaryEmail: 'test2@example.com' });

    expect(response.body).toStrictEqual({
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'This email address has not been verified.',
    });
  });

  it('should delete emails', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    const response = await request(server)
      .delete('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(204);

    const { body } = await request(server)
      .get('/api/user')
      .set('Authorization', token);

    expect(body.emails).not.toContainEqual({
      email: 'test2@example.com',
      verified: true,
      primary: false,
    });
  });

  it('should not delete non-associated emails', async () => {
    const response = await request(server)
      .delete('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'This email address is not associated with your account.',
    });
  });

  it('should not delete the last login method', async () => {
    const response = await request(server)
      .delete('/api/user/email')
      .set('Authorization', token)
      .send({ email: 'test@example.com' });

    expect(response.body).toStrictEqual({
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Deleting this email results in the inability to access this account.',
    });
  });

  it('should fetch all user organizations', async () => {
    const organizationB = await Organization.create({ id: 'testorganizationb' });
    await organizationB.addUser(user.id);

    const response = await request(server)
      .get('/api/user/organizations')
      .set('Authorization', token);
    expect(response.body).toStrictEqual([
      { id: 'testorganization', name: 'Test Organization', role: 'Owner' },
      { id: 'testorganizationb', name: null, role: 'Member' },
    ]);
  });
});
