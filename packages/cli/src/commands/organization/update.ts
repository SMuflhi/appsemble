import { ReadStream } from 'fs';

import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { coerceFile } from '../../lib/coercers';
import { updateOrganization } from '../../lib/organization';
import { BaseArguments } from '../../types';

interface UpdateOrganizationArguments extends BaseArguments {
  description: string;
  email: string;
  id: string;
  icon: ReadStream;
  name: string;
  website: string;
}

export const command = 'update <id>';
export const description =
  'Update an existing organization. You must be an owner of the organization.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('id', {
      describe: 'The ID of the organization',
    })
    .option('name', {
      describe: 'The name of the organization.',
    })
    .option('email', {
      describe: 'The email address users may use to contact the organization',
    })
    .option('website', {
      describe: 'The website of the organization',
    })
    .option('description', {
      describe: 'A short of the organization',
    })
    .option('icon', {
      describe: 'The file location of the icon representing the organization.',
      coerce: coerceFile,
    });
}

export async function handler({
  clientCredentials,
  description: desc,
  email,
  icon,
  id,
  name,
  remote,
  website,
}: UpdateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);
  await updateOrganization({
    description: desc,
    email,
    icon,
    id,
    name,
    website,
  });
}
