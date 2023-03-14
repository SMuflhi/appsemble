import {
  BlockAsset as BlockAssetInterface,
  GetBlockAssetParams,
} from '@appsemble/node-utils/types';

import { BlockAsset, BlockVersion } from '../../../models/index.js';

export const getBlockAsset = ({
  filename,
  name,
  version,
}: GetBlockAssetParams): Promise<BlockAssetInterface> => {
  const [org, blockId] = name.split('/');

  return BlockAsset.findOne({
    attributes: ['mime', 'content'],
    where: { filename },
    include: [
      {
        model: BlockVersion,
        where: { name: blockId, version, OrganizationId: org.slice(1) },
      },
    ],
  });
};
