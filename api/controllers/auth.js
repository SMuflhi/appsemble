import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Boom from 'boom';

export async function registerEmail(ctx) {
  const { body } = ctx.request;
  const { User, EmailAuthorization } = ctx.state.db;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const key = crypto.randomBytes(80).toString('hex');
    const email = await EmailAuthorization.create({ ...body, password, key });
    await email.createUser();

    ctx.status = 201;
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw Boom.badRequest('User with this email address already exists.');
    } else throw e;
  }
}

export async function verifyEmail(ctx) {
  const { key } = ctx.request.query;
  const { EmailAuthorization } = ctx.state.db;

  if (!key) {
    throw Boom.badRequest('Key is required.');
  }

  const email = await EmailAuthorization.findOne({ where: { key } });

  if (!email) {
    throw Boom.notFound('Unable to verify this key.');
  }

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}

export async function auth(ctx) {
  ctx.body = 'ok';
}
