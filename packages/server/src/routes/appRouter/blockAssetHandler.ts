import Boom from '@hapi/boom';

import { BlockAsset } from '../../models';
import type { KoaContext } from '../../types';

interface Params {
  filename: string;
  name: string;
  version: string;
}

/**
 * Serve a block asset.
 */
export default async function blockAssetHandler(ctx: KoaContext<Params>): Promise<void> {
  const { filename, name, version } = ctx.params;
  const [org, blockId] = name.split('/');

  const blockAsset = await BlockAsset.findOne({
    raw: true,
    attributes: ['mime', 'content'],
    where: { filename, name: blockId, OrganizationId: org.slice(1), version },
  });

  if (!blockAsset) {
    throw Boom.notFound('Block asset not found');
  }

  ctx.body = blockAsset.content;
  ctx.type = blockAsset.mime;
}
