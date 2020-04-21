import * as Boom from '@hapi/boom';

import { AppBlockStyle } from '../../models';
import type { KoaContext } from '../../types';
import getApp from '../../utils/getApp';

interface Params {
  name: string;
}

export default async function blockCSSHandler(ctx: KoaContext<Params>): Promise<void> {
  const { name } = ctx.params;

  const app = await getApp(ctx, {
    attributes: [],
    include: [
      {
        model: AppBlockStyle,
        attributes: ['style'],
        required: false,
        where: { block: name },
      },
    ],
  });

  if (!app) {
    throw Boom.notFound();
  }

  const [style] = app.AppBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
