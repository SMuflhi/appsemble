import { randomBytes } from 'crypto';

import { logger } from '@appsemble/node-utils';
import { AppMember as AppMemberType } from '@appsemble/types';
import { has, Permission } from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { hash } from 'bcrypt';
import { Context } from 'koa';
import { DatabaseError, Op, UniqueConstraintError } from 'sequelize';

import { App, AppMember, Organization, transactional, User } from '../models';
import { argv } from '../utils/argv';
import { checkRole } from '../utils/checkRole';
import { createJWTResponse } from '../utils/createJWTResponse';

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { include: [{ model: AppMember, include: [User] }] });
  if (!app) {
    throw notFound('App not found');
  }

  const appMembers: AppMemberType[] = app.AppMembers.map((member) => ({
    id: member.UserId,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
  }));

  if (app.definition.security?.default?.policy !== 'invite') {
    const organization = await Organization.findByPk(app.OrganizationId, {
      include: [
        {
          model: User,
          where: { id: { [Op.not]: app.AppMembers.map((member) => member.UserId) } },
          required: false,
        },
      ],
    });

    for (const user of organization.Users) {
      appMembers.push({
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: user?.AppMember?.role ?? app.definition.security.default.role,
      });
    }
  }

  ctx.body = appMembers;
}

export async function getAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, where: { UserId: memberId }, required: false }],
  });
  if (!app) {
    throw notFound('App not found');
  }

  if (app.definition.security === undefined) {
    throw notFound('App does not have a security definition');
  }

  if (app.AppMembers.length !== 1) {
    throw notFound('App member not found');
  }

  const [member] = app.AppMembers;

  ctx.body = {
    id: member.UserId,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
  };
}

export async function setAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { role },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, required: false, where: { UserId: memberId } }],
  });
  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditApps);

  const user = await User.findByPk(memberId);
  if (!user) {
    throw notFound('User with this ID doesn’t exist.');
  }

  if (!has(app.definition.security.roles, role)) {
    throw badRequest(`Role ‘${role}’ is not defined.`);
  }

  let member = app.AppMembers?.[0];

  if (member) {
    await member.update({ role });
  } else {
    member = await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      role,
    });
  }

  ctx.body = {
    id: user.id,
    name: member.name,
    primaryEmail: member.email,
    role,
  };
}

export async function registerMemberEmail(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { name, password },
    },
  } = ctx;

  const email = ctx.request.body.email.toLowerCase();
  const hashedPassword = await hash(password, 10);
  const key = randomBytes(40).toString('hex');
  let user: User;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: {
      model: AppMember,
      where: { email },
      required: false,
    },
  });

  if (!app) {
    throw notFound('App could not be found.');
  }

  if (!app.definition?.security?.default?.role) {
    throw badRequest('This app has no security definition');
  }

  // XXX: This could introduce a race condition.
  // If this is not manually checked here, Sequelize never returns on
  // the AppMember.create() call if there is a conflict on the email index.
  if (app.AppMembers.length) {
    throw conflict('User with this email address already exists.');
  }

  try {
    await transactional(async (transaction) => {
      user = await User.create(
        {
          name,
        },
        { transaction },
      );
      await AppMember.create(
        {
          UserId: user.id,
          AppId: appId,
          name,
          password: hashedPassword,
          email,
          role: app.definition.security.default.role,
          emailKey: key,
        },
        { transaction },
      );
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict('User with this email address already exists.');
    }
    if (error instanceof DatabaseError) {
      // XXX: Postgres throws a generic transaction aborted error
      // if there is a way to read the internal error, replace this code.
      throw conflict('User with this email address already exists.');
    }

    throw error;
  }

  const url = new URL(argv.host);
  url.hostname = app.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
  const appUrl = String(url);

  // This is purposely not awaited, so failure won’t make the request fail. If this fails, the user
  // will still be logged in, but will have to request a new verification email in order to verify
  // their account.
  mailer
    .sendTemplateEmail({ email, name }, 'welcomeMember', {
      url: `${appUrl}/Verify?token=${key}`,
      name: app.definition.name,
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(user.id);
}
export async function verifyMemberEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMember,
        required: false,
        where: {
          emailKey: token,
        },
      },
    ],
  });

  if (!app) {
    throw notFound('App could not be found.');
  }

  if (!app.AppMembers.length) {
    throw notFound('Unable to verify this token.');
  }

  const [member] = app.AppMembers;
  member.emailVerified = true;
  member.emailKey = null;
  await member.save();

  ctx.status = 200;
}
export async function resendMemberEmailVerification(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { email }, required: false }],
  });

  if (app?.AppMembers.length && !app.AppMembers[0].emailVerified) {
    const url = new URL(argv.host);
    url.hostname = app.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
    const appUrl = String(url);

    await mailer.sendTemplateEmail(app.AppMembers[0], 'resend', {
      url: `${appUrl}Verify?token=${app.AppMembers[0].emailKey}`,
      name: app.definition.name,
    });
  }

  ctx.status = 204;
}
export async function requestMemberResetPassword(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();
  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { email }, required: false }],
  });

  if (app?.AppMembers.length) {
    const [member] = app.AppMembers;
    const resetKey = randomBytes(40).toString('hex');

    const url = new URL(argv.host);
    url.hostname = app.domain || `${app.path}.${app.OrganizationId}.${url.hostname}`;
    const appUrl = String(url);

    await member.update({ resetKey });
    await mailer.sendTemplateEmail(member, 'reset', {
      url: `${appUrl}Edit-Password?token=${resetKey}`,
      name: app.definition.name.endsWith('App')
        ? app.definition.name
        : `${app.definition.name} App`,
    });
  }

  ctx.status = 204;
}
export async function resetMemberPassword(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: {
      model: AppMember,
      required: false,
      where: {
        resetKey: token,
      },
    },
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppMembers.length) {
    throw notFound(`Unknown password reset token: ${token}`);
  }

  const password = await hash(ctx.request.body.password, 10);
  const [member] = app.AppMembers;

  await member.update({
    password,
    resetKey: null,
  });
}

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: AppMember, required: false, where: { UserId: memberId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (user.id !== memberId) {
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
  }

  const member = app.AppMembers?.[0];

  if (!member) {
    throw notFound('App member not found');
  }

  await member.destroy();
}
