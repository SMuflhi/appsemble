import normalize from '@appsemble/utils/normalize';
import validate, { SchemaValidationError } from '@appsemble/utils/validate';
import validateStyle, { StyleValidationError } from '@appsemble/utils/validateStyle';
import Busboy from 'busboy';
import Boom from 'boom';
import getRawBody from 'raw-body';
import { UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';

import getDefaultIcon from '../utils/getDefaultIcon';

async function parseAppMultipart(ctx) {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy(ctx.req);
    const res = {};

    const onError = error => {
      reject(error);
      busboy.removeAllListeners();
    };

    busboy.on('file', (fieldname, stream, filename, encoding, mime) => {
      if (fieldname !== 'style' && mime !== 'text/css') {
        onError(new Error('Expected file ´style´ to be css'));
      }

      let buffer;
      stream.on('data', data => {
        buffer = data;
      });

      stream.on('end', () => {
        res.style = buffer;
      });
    });

    busboy.on('field', (fieldname, content) => {
      if (fieldname !== 'app') {
        throw new Error(`Unexpected field: ${fieldname}`);
      }

      try {
        res.definition = JSON.parse(content);
      } catch (error) {
        onError(error);
      }
    });

    busboy.on('finish', () => {
      busboy.removeAllListeners();
      resolve(res);
    });
    busboy.on('error', onError);
    busboy.on('partsLimit', onError);
    busboy.on('filesLimit', onError);
    busboy.on('fieldsLimit', onError);
    ctx.req.pipe(busboy);
  });
}

function handleAppValidationError(error, app) {
  if (error instanceof UniqueConstraintError) {
    throw Boom.conflict(`Another app with path “${app.path}” already exists`);
  }

  if (error instanceof SyntaxError) {
    throw Boom.badRequest('App recipe must be valid JSON.');
  }

  if (error instanceof SchemaValidationError) {
    throw Boom.badRequest('App recipe is invalid.', error.data);
  }

  if (error instanceof StyleValidationError) {
    throw Boom.badRequest('Provided CSS was invalid.');
  }

  throw Boom.internal(error);
}

export async function create(ctx) {
  const { App } = ctx.db.models;
  let result;

  try {
    result = await parseAppMultipart(ctx);

    if (!result.definition) {
      throw Boom.badRequest('App recipe is required.');
    }

    if (result.style) {
      result.style = validateStyle(result.style);
    }

    const { App: appSchema } = ctx.api.definitions;
    await validate(appSchema, result.definition);

    result.path = result.definition.path
      ? normalize(result.definition.path)
      : normalize(result.definition.name);

    const { id } = await App.create(result, { raw: true });

    ctx.body = { ...result.definition, id, path: result.path };
    ctx.status = 201;
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function getOne(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = { ...app.definition, id, path: app.path };
}

export async function query(ctx) {
  const { App } = ctx.db.models;

  const apps = await App.findAll({ raw: true });
  ctx.body = apps.map(app => ({ ...app.definition, id: app.id, path: app.path }));
}

export async function update(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  let result;

  try {
    result = await parseAppMultipart(ctx);

    if (!result.definition) {
      throw Boom.badRequest('App recipe is required.');
    }

    if (result.style) {
      result.style = validateStyle(result.style);
    }

    const { App: appSchema } = ctx.api.definitions;
    await validate(appSchema, result.definition);

    result.path = result.definition.path
      ? normalize(result.definition.path)
      : normalize(result.definition.name);

    const [affectedRows] = await App.update(result, { where: { id } });

    if (affectedRows === 0) {
      throw Boom.notFound('App not found');
    }

    ctx.body = { ...result.definition, id, path: result.path };
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function getAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;
  const app = await App.findByPk(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const icon = app.icon || getDefaultIcon();
  const metadata = await sharp(icon).metadata();

  ctx.body = icon;
  // Type svg resolves to text/xml instead of image/svg+xml.
  ctx.type = metadata.format === 'svg' ? 'image/svg+xml' : metadata.format;
}

export async function setAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;
  const icon = await getRawBody(ctx.req);

  const [affectedRows] = await App.update({ icon }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}

export async function deleteAppIcon(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const [affectedRows] = await App.update({ icon: null }, { where: { id } });

  if (affectedRows === 0) {
    throw Boom.notFound('App not found');
  }

  ctx.status = 204;
}

export async function getAppStyle(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(id, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.style;
  ctx.type = 'css';
  ctx.status = 200;
}
