import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const DownloadActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  required: ['type', 'filename'],
  additionalProperties: false,
  properties: {
    type: {
      enum: ['download'],
      description: 'Download the data as a file.',
    },
    filename: {
      type: 'string',
      description: 'The filename to save the file as. This must include a file extension.',
      pattern: '\\.',
    },
  },
});
