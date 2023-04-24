import { UpdateAppResourceParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { App, Asset, ResourceVersion, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export const updateAppResource = ({
  action,
  app,
  context,
  deletedAssetIds,
  id,
  options,
  preparedAssets,
  resource,
  resourceDefinition,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> =>
  transactional(async (transaction) => {
    const { $clonable: clonable, $expires: expires, ...data } = resource as Record<string, unknown>;

    const oldResource = await Resource.findOne({
      where: {
        id,
      },
    });

    const oldData = oldResource.data;
    const previousEditorId = resource.EditorId;

    const newResource = await oldResource.update(
      {
        data,
        clonable,
        expires,
        EditorId: context.user?.id,
      },
      { transaction },
    );

    if (preparedAssets.length) {
      await Asset.bulkCreate(
        preparedAssets.map((asset) => ({
          ...asset,
          AppId: app.id,
          ResourceId: resource.id,
          UserId: context.user?.id,
        })),
        { logging: false, transaction },
      );
    }

    if (resourceDefinition.history) {
      await ResourceVersion.create(
        {
          ResourceId: id,
          UserId: previousEditorId,
          data:
            resourceDefinition.history === true || resourceDefinition.history.data
              ? oldData
              : undefined,
        },
        { transaction },
      );
    } else {
      const { deleteAppAsset } = options;

      const assetPromises = deletedAssetIds.map(async (assetId) => {
        await deleteAppAsset({ context, app, id: assetId, transaction });
      });

      await Promise.all(assetPromises);
    }

    processReferenceHooks(context.user, { id: app.id } as App, newResource, action);
    processHooks(context.user, { id: app.id } as App, newResource, action);

    return newResource.toJSON();
  });
