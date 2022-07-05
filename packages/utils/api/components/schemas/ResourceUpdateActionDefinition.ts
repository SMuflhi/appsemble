import { RequestActionDefinition } from './RequestActionDefinition';
import { extendJSONSchema } from './utils';

export const ResourceUpdateActionDefinition = extendJSONSchema(
  RequestActionDefinition,
  {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'resource'],
    properties: {
      type: {
        enum: ['resource.update'],
        description: 'Update a resource.',
      },
      resource: {
        type: 'string',
        description: 'The type of the resource to query.',
      },
    },
  },
  ['url'],
);