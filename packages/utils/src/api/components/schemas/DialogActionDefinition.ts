import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const DialogActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'blocks'],
  properties: {
    type: {
      enum: ['dialog'],
      description: `This action opens a pop-up dialog that can be used to seamlessly transition to a new set of blocks temporarily.

Dialogs can be closed by calling the [\`dialog.ok\`](#DialogOkActionDefinition) or
[\`dialog.error\`](#DialogErrorActionDefinition). Users can still manually close dialogs, which
should be supported by the app.
`,
    },
    closable: {
      type: 'boolean',
      default: true,
      description:
        'Whether users are allowed to close the dialog by clicking outside of it or on the close button.',
    },
    fullscreen: {
      type: 'boolean',
      default: false,
      description:
        'Whether the dialog should be displayed full screen as if it’s a new page, or as a pop-up.',
    },
  },
});
