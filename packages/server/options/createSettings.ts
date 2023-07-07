import {
  type CreateSettingsParams,
  createSettings as createUtilsSettings,
} from '@appsemble/node-utils';
import { parseBlockName } from '@appsemble/utils';
import { Op } from 'sequelize';

import { App, AppOAuth2Secret, AppSamlSecret, BlockAsset, BlockVersion } from '../models/index.js';
import { createGtagCode } from '../utils/render.js';
import { getSentryClientSettings } from '../utils/sentry.js';

export async function createSettings({
  app,
  host,
  hostname,
  identifiableBlocks,
  languages,
}: CreateSettingsParams): Promise<[digest: string, script: string]> {
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: identifiableBlocks.map(({ type, version }) => {
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  const persistedApp = await App.findOne({
    attributes: [
      'id',
      'icon',
      'updated',
      'OrganizationId',
      'sentryDsn',
      'sentryEnvironment',
      'vapidPublicKey',
      'definition',
      'showAppsembleLogin',
      'showAppsembleOAuth2Login',
      'googleAnalyticsID',
    ],
    where: { id: app.id },
    include: [
      {
        attributes: ['icon', 'id', 'name'],
        model: AppOAuth2Secret,
      },
      {
        attributes: ['icon', 'id', 'name'],
        model: AppSamlSecret,
      },
    ],
  });

  const { sentryDsn, sentryEnvironment } = getSentryClientSettings(
    hostname,
    persistedApp.sentryDsn,
    persistedApp.sentryEnvironment,
  );

  return createUtilsSettings(
    {
      apiUrl: host,
      blockManifests: blockManifests.map(
        ({ BlockAssets, OrganizationId, actions, events, layout, name, version }) => ({
          name: `@${OrganizationId}/${name}`,
          version,
          layout,
          actions,
          events,
          files: BlockAssets.map(({ filename }) => filename),
        }),
      ),
      id: persistedApp.id,
      languages,
      logins: [
        ...persistedApp.AppOAuth2Secrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'oauth2',
        })),
        ...persistedApp.AppSamlSecrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'saml',
        })),
      ],
      vapidPublicKey: persistedApp.vapidPublicKey,
      definition: persistedApp.definition,
      showAppsembleLogin: persistedApp.showAppsembleLogin ?? false,
      showAppsembleOAuth2Login: persistedApp.showAppsembleOAuth2Login ?? true,
      sentryDsn,
      sentryEnvironment,
      appUpdated: persistedApp.updated.toISOString(),
    },
    app.googleAnalyticsID ? createGtagCode(app.googleAnalyticsID) : undefined,
  );
}