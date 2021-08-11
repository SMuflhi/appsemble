import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants';

export const Asset: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an asset create call.',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The unique identifier for the asset.',
    },
    mime: {
      type: 'string',
      readOnly: true,
      description: 'The IANA MIME type of the asset.',
    },
    filename: {
      type: 'string',
      readOnly: true,
      description: 'The filename of the asset.',
    },
    name: {
      type: 'string',
      pattern: normalized.source,
      description: 'The given name of the asset.',
    },
  },
};
