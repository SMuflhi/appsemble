import { existsSync, promises as fs } from 'fs';
import { join, parse } from 'path';

import { logger, readYaml } from '@appsemble/node-utils';
import { AppMessages } from '@appsemble/types';
import axios from 'axios';

/**
 * Upload messages for an app.
 *
 * @param path - The path to the app directory.
 * @param appId - The app id to upload the messages for.
 * @param remote - The remote to upload the messages to.
 * @param force - Whether or not to force the update for locked apps.
 */
export async function uploadMessages(
  path: string,
  appId: string,
  remote: string,
  force: boolean,
): Promise<void> {
  if (!existsSync(join(path, 'messages'))) {
    return;
  }

  const messageDir = await fs.readdir(join(path, 'i18n'));

  if (messageDir.length === 0) {
    return;
  }

  logger.info(`Traversing app messages for ${messageDir.length} languages 🕵`);
  const result: AppMessages[] = [];

  for (const messageFile of messageDir) {
    logger.verbose(`Processing ${join(path, 'i18n', messageFile)} ⚙️`);
    const language = parse(messageFile).name;
    const [messages] = await readYaml(join(path, 'i18n', messageFile));
    // XXX This type is incorrect
    result.push({ force, language, messages } as AppMessages);
  }

  for (const language of result) {
    await axios.post(`/api/apps/${appId}/messages`, language, { baseURL: remote });
    logger.info(`Successfully uploaded messages for language “${language.language}” 🎉`);
  }
}
