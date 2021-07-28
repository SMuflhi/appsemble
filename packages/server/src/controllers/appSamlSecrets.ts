import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { addYears } from 'date-fns';
import { Context } from 'koa';
import { pki } from 'node-forge';

import { App, AppSamlSecret } from '../models';
import { argv } from '../utils/argv';
import { checkAppLock } from '../utils/checkAppLock';
import { checkRole } from '../utils/checkRole';

export async function createAppSamlSecret(ctx: Context): Promise<void> {
  const {
    params: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { privateKey, publicKey } = await new Promise<pki.rsa.KeyPair>((resolve, reject) => {
    pki.rsa.generateKeyPair({ bits: 2048 }, (error, result) =>
      error ? reject(error) : resolve(result),
    );
  });
  const cert = pki.createCertificate();
  cert.publicKey = publicKey;
  cert.privateKey = privateKey;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = addYears(new Date(), 10);
  const attrs = [
    { shortName: 'CN', value: argv.host },
    { shortName: 'O', value: 'Appsemble' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(privateKey);

  const secret = { ...body, spCertificate: pki.certificateToPem(cert).trim() };
  const { id } = await AppSamlSecret.create({
    ...secret,
    AppId: appId,
    spPrivateKey: pki.privateKeyToPem(privateKey).trim(),
    spPublicKey: pki.publicKeyToPem(publicKey).trim(),
  });
  ctx.body = { ...secret, id };
}

export async function getAppSamlSecrets(ctx: Context): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppSamlSecrets;
}

export async function updateAppSamlSecret(ctx: Context): Promise<void> {
  const {
    params: { appId, appSamlSecretId },
    request: {
      body: { emailAttribute, entityId, icon, idpCertificate, name, nameAttribute, ssoUrl },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, required: false, where: { id: appSamlSecretId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;

  if (!secret) {
    throw notFound('SAML secret not found');
  }

  ctx.body = await secret.update({
    emailAttribute,
    entityId,
    icon,
    idpCertificate,
    name,
    nameAttribute,
    ssoUrl,
  });
}
