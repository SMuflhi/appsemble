import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const DialogErrorActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['dialog.error'],
      description: `Close an open dialog.

The dialog action that opened the dialog will be rejected with the data passed to this action.
`,
    },
  },
});
