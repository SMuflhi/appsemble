import { type OpenAPIV3 } from 'openapi-types';

export const conditionalRemappers: Record<
  string,
  OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
> = {
  if: {
    type: 'object',
    description: `Check if condition results in a truthy value.

Returns value of then if condition is truthy, otherwise it returns the value of else.
`,
    additionalProperties: false,
    required: ['condition', 'then', 'else'],
    properties: {
      condition: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'The condition to check.',
      },
      then: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'This remapper is used if the condition returns true.',
      },
      else: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'This remapper is used if the condition returns false.',
      },
    },
  },
  equals: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against each other.

Returns \`true\` if all entries are equal, otherwise \`false\`.
`,
  },
  gt: {
    type: 'array',
    description: `Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is greater than the second entry.`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  lt: {
    type: 'array',
    description: `Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is lesser than the second entry.`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  not: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against the first.

Returns \`false\` if all entries are equal to the first entry, otherwise \`true\`.

If only one remapper or none is passed, the remapper value gets computed and then inverted.
`,
  },
  match: {
    type: 'array',
    description: `Check if any case results in a truthy value.

Returns the value of the first case where the condition equals true, otherwise returns null.
`,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['case', 'value'],
      description: '',
      properties: {
        case: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The condition to check.',
        },
        value: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'This remapper is used if the case is true',
        },
      },
    },
  },
};
