import { promisify } from 'util';
import { deflateRaw } from 'zlib';

import { logger } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { addYears } from 'date-fns';
import { md, pki } from 'node-forge';
import { v4 } from 'uuid';
import { SignedXml, xpath } from 'xml-crypto';
import { DOMImplementation, DOMParser, XMLSerializer } from 'xmldom';

import { App, AppSamlSecret, User } from '../models';
import { SamlLoginRequest } from '../models/SamlLoginRequest';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';
import { createOAuth2AuthorizationCode } from '../utils/model';

interface Params {
  appId: number;
  appSamlSecretId: number;
}

/**
 * An enum for managing known XML namespaces.
 */
enum NS {
  ds = 'http://www.w3.org/2000/09/xmldsig#',
  saml = 'urn:oasis:names:tc:SAML:2.0:assertion',
  samlp = 'urn:oasis:names:tc:SAML:2.0:protocol',
}

const deflate = promisify(deflateRaw);
const dom = new DOMImplementation();
const parser = new DOMParser();
const serializer = new XMLSerializer();

export async function createAppSamlSecret(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
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
    { shortName: 'CN', value: host },
    { shortName: 'O', value: 'Appsemble' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(privateKey);

  const secret = {
    ...body,
    AppId: appId,
    spPrivateKey: pki.privateKeyToPem(privateKey).trim(),
    spPublicKey: pki.publicKeyToPem(publicKey).trim(),
    spCertificate: pki.certificateToPem(cert).trim(),
  };

  ctx.body = await AppSamlSecret.create(secret);
}

export async function getAppSamlSecrets(ctx: KoaContext<Params>): Promise<void> {
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

export async function updateAppSamlSecret(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, appSamlSecretId },
    request: {
      body: { entityId, icon, idpCertificate, name, ssoUrl },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, where: { id: appSamlSecretId } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;

  if (!secret) {
    throw notFound('SAML secret nof found');
  }

  ctx.body = await secret.update({
    entityId,
    icon,
    idpCertificate,
    name,
    ssoUrl,
  });
}

export async function createAuthnRequest(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    params: { appId, appSamlSecretId },
    request: {
      body: { redirectUri, scope, state },
    },
    user,
  } = ctx;

  const secret = await AppSamlSecret.findOne({
    attributes: ['ssoUrl', 'spPrivateKey'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  const loginId = `id${v4()}`;
  const doc = dom.createDocument(NS.samlp, 'samlp:AuthnRequest', null);
  const samlUrl = new URL(`/api/apps/${appId}/saml/${appSamlSecretId}`, host);

  const authnRequest = doc.documentElement;
  authnRequest.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:saml', NS.saml);
  authnRequest.setAttribute('AssertionConsumerServiceURL', `${samlUrl}/acs`);
  authnRequest.setAttribute('Destination', secret.ssoUrl);
  authnRequest.setAttribute('ID', loginId);
  authnRequest.setAttribute('Version', '2.0');
  authnRequest.setAttribute('IssueInstant', new Date().toISOString());
  authnRequest.setAttribute('IsPassive', 'true');

  const issuer = doc.createElementNS(NS.saml, 'saml:Issuer');
  issuer.textContent = `${samlUrl}/metadata.xml`;
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(issuer);

  const nameIDPolicy = doc.createElementNS(NS.samlp, 'samlp:NameIDPolicy');
  nameIDPolicy.setAttribute('Format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  // eslint-disable-next-line unicorn/prefer-node-append
  authnRequest.appendChild(nameIDPolicy);

  const xml = serializer.serializeToString(doc);
  const samlRequest = await deflate(Buffer.from(xml));
  const redirect = new URL(secret.ssoUrl);
  redirect.searchParams.set('SAMLRequest', samlRequest.toString('base64'));
  redirect.searchParams.set('RelayState', host);
  redirect.searchParams.set('SigAlg', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');

  const privateKey = pki.privateKeyFromPem(secret.spPrivateKey);

  const sha = md.sha1.create().update(String(redirect.searchParams));
  const signatureBinary = privateKey.sign(sha);
  const signature = Buffer.from(signatureBinary).toString('base64');
  redirect.searchParams.set('Signature', signature);

  await SamlLoginRequest.create({
    id: loginId,
    AppSamlSecretId: secret.id,
    UserId: user.id,
    redirectUri,
    state,
    scope,
  });

  ctx.body = { redirect: String(redirect) };
}

export async function assertConsumerService(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv,
    params: { appId, appSamlSecretId },
    request: {
      body: { RelayState, SAMLResponse },
    },
  } = ctx;

  if (RelayState !== argv.host) {
    throw badRequest('Invalid RelatState');
  }

  const secret = await AppSamlSecret.findOne({
    attributes: ['idpCertificate'],
    where: { AppId: appId, id: appSamlSecretId },
  });

  const buf = Buffer.from(SAMLResponse, 'base64');
  const xml = buf.toString('utf-8');
  const doc = parser.parseFromString(xml);
  const x = (localName: string, namespace: NS, element: Node = doc): Element =>
    xpath(
      element,
      `//*[local-name(.)="${localName}" and namespace-uri(.)="${namespace}"]`,
    )?.[0] as Element;

  const sig = new SignedXml();

  const status = x('StatusCode', NS.samlp);
  if (status.getAttribute('Value') !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
    throw badRequest('Status code is unsuccesful');
  }

  const signature = x('Signature', NS.ds);

  sig.keyInfoProvider = {
    file: null,
    getKeyInfo: null,
    getKey: () => Buffer.from(secret.idpCertificate),
  };
  sig.loadSignature(signature);
  const res = sig.checkSignature(xml);
  if (!res) {
    throw badRequest('Bad signature');
  }
  logger.info(xml);

  const subject = x('Subject', NS.saml);
  if (!subject) {
    throw badRequest('No subject could be found');
  }

  const nameId = x('NameID', NS.saml, subject)?.textContent;
  if (!nameId) {
    throw badRequest('Unsupported NameID');
  }

  const loginId = x('SubjectConfirmationData', NS.saml, subject)?.getAttribute('InResponseTo');
  if (!loginId) {
    throw badRequest('Invalid subject confirmation data');
  }

  const loginRequest = await SamlLoginRequest.findOne({
    where: { id: loginId },
    include: [
      {
        model: AppSamlSecret,
        include: [{ model: App, attributes: ['domain', 'id', 'path', 'OrganizationId'] }],
      },
      { model: User, attributes: ['id'] },
    ],
  });
  if (!loginRequest) {
    throw badRequest('Invalid subject confirmation data');
  }

  const { code } = await createOAuth2AuthorizationCode(
    argv,
    loginRequest.AppSamlSecret.App,
    loginRequest.redirectUri,
    loginRequest.scope,
    loginRequest.User,
  );
  const location = new URL(loginRequest.redirectUri);
  location.searchParams.set('code', code);
  location.searchParams.set('state', loginRequest.state);
  ctx.redirect(String(location));
  ctx.body = `Redirecting to ${location}`;
}
