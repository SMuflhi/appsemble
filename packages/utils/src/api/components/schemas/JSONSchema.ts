import { OpenAPIV3 } from 'openapi-types';

export const JSONSchema: OpenAPIV3.NonArraySchemaObject = {
  oneOf: [
    { $ref: '#/components/schemas/JSONPointer' },
    { $ref: '#/components/schemas/JSONSchemaAnyOf' },
    { $ref: '#/components/schemas/JSONSchemaArray' },
    { $ref: '#/components/schemas/JSONSchemaBoolean' },
    { $ref: '#/components/schemas/JSONSchemaConst' },
    { $ref: '#/components/schemas/JSONSchemaEnum' },
    { $ref: '#/components/schemas/JSONSchemaInteger' },
    { $ref: '#/components/schemas/JSONSchemaNot' },
    { $ref: '#/components/schemas/JSONSchemaNull' },
    { $ref: '#/components/schemas/JSONSchemaNumber' },
    { $ref: '#/components/schemas/JSONSchemaObject' },
    { $ref: '#/components/schemas/JSONSchemaOneOf' },
    { $ref: '#/components/schemas/JSONSchemaString' },
  ],
};
