import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Boom from 'boom';

import { sendWelcomeEmail } from '../utils/email';

export async function registerEmail(ctx) {
  const { body } = ctx.request;
  const { EmailAuthorization } = ctx.state.db;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const key = crypto.randomBytes(40).toString('hex');
    const record = await EmailAuthorization.create({ ...body, password, key });
    await record.createUser();

    await sendWelcomeEmail({
      email: record.email,
      name: record.name,
      url: `${ctx.origin}/api/email/verify?key=${key}`,
    });

    ctx.status = 201;
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw Boom.conflict('User with this email address already exists.');
    }

    throw e;
  }
}

export async function verifyEmail(ctx) {
  const { key } = ctx.request.query;
  const { EmailAuthorization } = ctx.state.db;

  const email = await EmailAuthorization.findOne({ where: { key } });

  if (!email) {
    throw Boom.notFound('Unable to verify this key.');
  }

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}
