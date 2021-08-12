import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { buildBlock } from '../../lib/buildBlock';
import { getBlockConfig } from '../../lib/getBlockConfig';
import { BaseArguments } from '../../types';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
}

export const command = 'build <paths...>';
export const description = 'Build a block without publishing.';

export function builder(yargs: Argv): Argv {
  return yargs.positional('paths', {
    describe: 'The paths to the blocks to build.',
  });
}

export async function handler({ paths }: BuildBlockArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  logger.info(`Building ${directories.length} Blocks`);
  for (const dir of directories) {
    logger.info('');
    const config = await getBlockConfig(dir);

    await buildBlock(config);
  }
}