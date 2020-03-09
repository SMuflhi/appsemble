import { remove } from '../../lib/authentication';

export const command = 'remove';
export const description =
  'Remove OAuth2 client credentials from the key chain using an interactive prompt. Beware this will not revoke them.';

export const handler = remove;
