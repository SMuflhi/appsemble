export default {
  '/apps/{appId}/secrets/oauth2': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['secret'],
      operationId: 'createAppOAuth2Secret',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
          },
        },
      },
      security: [{ studio: [] }],
      responses: {
        201: {
          description: 'A list of the OAuth2 secrets for the app.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppOAuth2Secret' },
            },
          },
        },
      },
    },
    get: {
      tags: ['secret'],
      operationId: 'getAppOAuth2Secrets',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'A list of the OAuth2 secrets for the app.',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppOAuth2Secret' },
              },
            },
          },
        },
      },
    },
  },
  '/apps/{appId}/secrets/oauth2/{appOAuth2SecretId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appOAuth2SecretId' },
    ],
    get: {
      tags: ['secret'],
      operationId: 'getAppOAuth2Secret',
      responses: {
        200: {
          description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AppOAuth2Secret' },
              },
            },
          },
        },
      },
    },
  },
  '/apps/{appId}/secrets/oauth2/{appOAuth2SecretId}/verify': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appOAuth2SecretId' },
    ],
    post: {
      tags: ['secret'],
      operationId: 'verifyAppOAuth2SecretCode',
      security: [{ studio: [] }, {}],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'scope', 'redirectUri'],
              properties: {
                code: { type: 'string' },
                scope: { type: 'string' },
                redirectUri: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: `
            Get a partial app OAuth2 secret

            Only public facing values are output on this endpoint.
          `,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};