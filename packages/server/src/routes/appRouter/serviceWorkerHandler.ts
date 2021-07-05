import { filterBlocks, getAppBlocks } from '@appsemble/utils';
import { Op } from 'sequelize';

import { BlockAsset, BlockVersion } from '../../models';
import { KoaContext } from '../../types';
import { getApp } from '../../utils/app';

/**
 * A handler used to serve the service worker output from Webpack from the client root.
 *
 * @param ctx - The Koa context.
 */
export async function serviceWorkerHandler(ctx: KoaContext): Promise<void> {
  const filename =
    process.env.NODE_ENV === 'production' ? '/service-worker.js' : '/app/service-worker.js';
  const serviceWorker = ctx.state.fs.readFileSync(filename, 'utf-8');

  const { app } = await getApp(ctx, {
    attributes: ['definition'],
  });
  const blocks = filterBlocks(Object.values(getAppBlocks(app.definition)));
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
      [Op.or]: blocks.map(({ type, version }) => {
        const [org, name] = type.split('/');
        return { name, OrganizationId: org.slice(1), version };
      }),
    },
  });

  ctx.body = `const blockAssets=${JSON.stringify(
    blockManifests.flatMap((block) =>
      block.BlockAssets.map(
        (asset) => `/api/blocks/${block.name}/versions/${block.version}/${asset.filename}`,
      ),
    ),
  )};${serviceWorker}`;
  ctx.type = 'application/javascript';
}
