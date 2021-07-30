import { randomBytes } from 'crypto';
import { URL } from 'url';

import { Permission } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { addMinutes } from 'date-fns';
import { Context } from 'koa';

import {
  App,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  OAuth2AuthorizationCode,
  transactional,
  User,
} from '../models';
import { argv } from '../utils/argv';
import { checkAppLock } from '../utils/checkAppLock';
import { checkRole } from '../utils/checkRole';
import { getAccessToken, getUserInfo } from '../utils/oauth2';

export async function createAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = await AppOAuth2Secret.create({ ...body, AppId: appId });
}

export async function getAppOAuth2Secrets(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [AppOAuth2Secret],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppOAuth2Secrets;
}

export async function getAppOAuth2Secret(ctx: Context): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['authorizationUrl', 'clientId', 'scope'],
        model: AppOAuth2Secret,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppOAuth2Secrets?.length) {
    throw notFound('OAuth2 secret not found');
  }

  [ctx.body] = app.AppOAuth2Secrets;
}

export async function updateAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { id, ...body },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppOAuth2Secrets?.length) {
    throw notFound('OAuth2 secret not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppOAuth2Secrets;
  await secret.update(body);
  ctx.body = secret;
}

export async function verifyAppOAuth2SecretCode(ctx: Context): Promise<void> {
  const {
    headers,
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { code, redirectUri, scope },
    },
  } = ctx;
  const user = ctx.user as User;
  // XXX Replace this with an imported language array when supporting more languages
  let referer: URL;
  try {
    referer = new URL(headers.referer);
  } catch {
    throw badRequest('The referer header is invalid');
  }
  if (referer.origin !== new URL(argv.host).origin) {
    throw badRequest('The referer header is invalid');
  }

  const app = await App.findByPk(appId, {
    attributes: ['id'],
    include: [
      {
        attributes: ['id', 'tokenUrl', 'clientId', 'clientSecret', 'remapper', 'userInfoUrl'],
        model: AppOAuth2Secret,
        required: false,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppOAuth2Secrets?.length) {
    throw notFound('OAuth2 secret not found');
  }

  const [secret] = app.AppOAuth2Secrets;
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(
    secret.tokenUrl,
    code,
    String(new URL('/callback', argv.host)),
    secret.clientId,
    secret.clientSecret,
  );

  const { sub } = await getUserInfo(accessToken, idToken, secret.userInfoUrl, secret.remapper);
  const authorization = await AppOAuth2Authorization.findOne({
    where: { sub, AppOAuth2SecretId: secret.id },
  });

  const authorizationCode = await transactional(async (transaction) => {
    const { id: UserId } = user ?? (await User.create({ transaction }));

    await (authorization
      ? authorization.update({ accessToken, refreshToken }, { transaction })
      : AppOAuth2Authorization.create(
          { accessToken, AppOAuth2SecretId: secret.id, refreshToken, sub, UserId },
          { transaction },
        ));
    return OAuth2AuthorizationCode.create(
      {
        AppId: app.id,
        code: randomBytes(10).toString('hex'),
        expires: addMinutes(new Date(), 10),
        redirectUri,
        scope,
        UserId,
      },
      { transaction },
    );
  });

  ctx.body = { code: authorizationCode.code };
}
