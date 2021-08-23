import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

export const JSONSchemaEnum = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for an enum.',
  additionalProperties: false,
  required: ['enum'],
  properties: {
    enum: {
      type: 'array',
      description: 'A specific set of values this property is allowed to have.',
      items: {
        anyOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }, { enum: [null] }],
      },
    },
    example: {
      anyOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }, { enum: [null] }],
      description: 'An example which is valid according to this schema.',
    },
    default: {
      anyOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }, { enum: [null] }],
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
