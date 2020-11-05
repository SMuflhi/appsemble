import { logger } from '@appsemble/node-utils';
import {
  ActionDefinition,
  EmailActionDefinition,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import { badGateway, badRequest, methodNotAllowed, notFound } from '@hapi/boom';
import axios from 'axios';
import { ParameterizedContext } from 'koa';
import { get, pick } from 'lodash';
import { Op } from 'sequelize';

import { App, EmailAuthorization } from '../models';
import { AppsembleContext, AppsembleState, KoaMiddleware } from '../types';
import { email } from '../utils/actions/email';
import { readPackageJson } from '../utils/readPackageJson';

interface Params {
  appId: string;
  path: string;
}

const { version } = readPackageJson();

/**
 * These response headers are forwarded when proxying requests.
 */
const allowResponseHeaders = [
  'content-encoding',
  'content-length',
  'content-type',
  'transfer-encoding',
];

const supportedActions = ['email', 'request'];

async function handleEmail(
  ctx: ParameterizedContext<AppsembleState, AppsembleContext<Params>>,
  app: App,
  action: EmailActionDefinition,
): Promise<void> {
  const {
    mailer,
    method,
    request: { body: data },
    user,
  } = ctx;
  if (method !== 'POST') {
    throw methodNotAllowed('Method must be POST for email actions');
  }

  await user?.reload({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

  await email({ action, app, data, mailer, user });
  ctx.status = 204;
}

async function handleRequestProxy(
  ctx: ParameterizedContext<AppsembleState, AppsembleContext<Params>>,
  action: RequestLikeActionDefinition,
  useBody: boolean,
): Promise<void> {
  const {
    method,
    query,
    request: { body },
  } = ctx;

  let data;
  if (useBody) {
    data = body;
  } else {
    try {
      data = JSON.parse(query.data);
    } catch {
      throw badRequest('data should be a JSON object');
    }
  }

  const axiosConfig = formatRequestAction(action, data);

  if (axiosConfig.method.toUpperCase() !== method) {
    throw badRequest('Method does match the request action method');
  }

  if (useBody) {
    axiosConfig.data = data;
  }
  axiosConfig.headers['user-agent'] = `AppsembleServer/${version}`;
  axiosConfig.responseType = 'stream';
  axiosConfig.validateStatus = () => true;

  let response;
  logger.verbose(`Forwarding request to ${axios.getUri(axiosConfig)}`);
  try {
    response = await axios(axiosConfig);
  } catch (err: unknown) {
    logger.error(err);
    throw badGateway();
  }

  ctx.status = response.status;
  ctx.set(pick(response.headers, allowResponseHeaders));
  ctx.body = response.data;
}

function createProxyHandler(useBody: boolean): KoaMiddleware<Params> {
  return async (ctx) => {
    const {
      params: { appId, path },
    } = ctx;
    const app = await App.findByPk(appId, { attributes: ['definition', 'id'] });
    if (!app) {
      throw notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      case 'email':
        return handleEmail(ctx, app, appAction as EmailActionDefinition);
      case 'request':
        return handleRequestProxy(ctx, appAction as RequestLikeActionDefinition, useBody);
      default:
        throw badRequest('path does not point to a proxyable action');
    }
  };
}

export const proxyDelete = createProxyHandler(false);
export const proxyGet = createProxyHandler(false);
export const proxyPatch = createProxyHandler(true);
export const proxyPost = createProxyHandler(true);
export const proxyPut = createProxyHandler(true);
