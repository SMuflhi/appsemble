import { permissions } from '@appsemble/utils';
import Boom from '@hapi/boom';

import { App, Asset } from '../models';
import type { KoaContext } from '../types';
import checkRole from '../utils/checkRole';

interface Params {
  appId: string;
  assetId: string;
}

export async function getAssets(ctx: KoaContext<Params>): Promise<void> {
  const { appId } = ctx.params;
  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: Asset, attributes: ['id', 'mime', 'filename'], required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
  }));
}

export async function getAssetById(ctx: KoaContext<Params>): Promise<void> {
  const { appId, assetId } = ctx.params;

  const app = await App.findByPk(appId, {
    include: [{ model: Asset, where: { id: assetId }, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [asset] = app.Assets;

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime || 'application/octet-stream');
  ctx.body = asset.data;
}

export async function createAsset(ctx: KoaContext<Params>): Promise<void> {
  const { request } = ctx;
  const { appId } = ctx.params;
  const { body, type } = request;
  const { user } = ctx.state;

  const app = await App.findByPk(appId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const asset = await Asset.create(
    { AppId: app.id, mime: type, data: body, ...(user && { UserId: user.id }) },
    { raw: true },
  );

  ctx.status = 201;
  ctx.body = { id: asset.id, mime: asset.mime, filename: asset.filename };
}

export async function deleteAsset(ctx: KoaContext<Params>): Promise<void> {
  const { appId, assetId } = ctx.params;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: Asset, attributes: ['id'], where: { id: assetId }, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [asset] = app.Assets;

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  await checkRole(ctx, app.OrganizationId, permissions.ManageResources);
  await asset.destroy();
}
