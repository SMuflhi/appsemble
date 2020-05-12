export default {
  type: 'object',
  description: 'An object representing a user.',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The ID of the user.',
    },
    name: {
      type: 'string',
      description: 'The display name of the user.',
    },
    email: {
      type: 'string',
      description: 'The primary email used for communication.',
    },
  },
};
