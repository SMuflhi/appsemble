import { type OpenAPIV3 } from 'openapi-types';

export const UserPropertyDefinition: OpenAPIV3.NonArraySchemaObject = {
  anyOf: [
    {
      type: 'object',
      description: 'Definition for a user property.',
      required: ['schema'],
      additionalProperties: false,
      properties: {
        schema: {
          anyOf: [
            { $ref: '#/components/schemas/JSONSchemaInteger' },
            { $ref: '#/components/schemas/JSONSchemaArray' },
          ],
        },
        reference: {
          type: 'object',
          additionalProperties: false,
          description: 'The object for the reference to another resource',
          properties: {
            resource: {
              type: 'string',
              description: 'The resource referenced by this user property.',
            },
          },
        },
      },
    },
    {
      type: 'object',
      description: 'Definition for a user property.',
      required: ['schema'],
      additionalProperties: false,
      properties: {
        schema: {
          anyOf: [
            { $ref: '#/components/schemas/JSONSchemaString' },
            { $ref: '#/components/schemas/JSONSchemaNumber' },
            { $ref: '#/components/schemas/JSONSchemaEnum' },
            { $ref: '#/components/schemas/JSONSchemaBoolean' },
            { $ref: '#/components/schemas/JSONSchemaObject' },
          ],
        },
      },
    },
  ],
};
