import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import traverseAppDirectory from './traverseAppDirectory';
import traverseBlockThemes from './traverseBlockThemes';

/**
 * Create a new App.
 *
 * @param {Object} params
 * @param {number} params.appId The ID of the app to update.
 * @param {string} params.path The path in which the app YAML is located.
 * @param {boolean} params.private Whether the app should be marked as private.
 * @param {boolean} params.template Whether the app should be marked as a template.
 */
export default async function updateApp({ appId, path, private: isPrivate, remote, template }) {
  try {
    const file = await fs.stat(path);
    const formData = new FormData();
    formData.append('private', String(isPrivate));
    formData.append('template', String(template));

    if (file.isFile()) {
      // Assuming file is App YAML
      const data = await fs.readFile(path, 'utf8');
      const app = yaml.safeLoad(data);
      formData.append('yaml', data);
      formData.append('definition', JSON.stringify(app));
    } else {
      await traverseAppDirectory(path, formData);
    }

    const { data } = await axios.patch(`/api/apps/${appId}`, formData);

    if (file.isDirectory()) {
      // After uploading the app, upload block styles if they are available
      await traverseBlockThemes(path, data.id);
    }

    const { host, protocol } = new URL(remote);
    logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
    logger.info(`View app: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
    logger.info(`Edit app: ${remote}/apps/${data.id}/edit`);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      logger.error(`The YAML in ${path} is invalid.`);
      logger.error(`Message: ${error.message}`);
      return;
    }

    throw error;
  }
}
