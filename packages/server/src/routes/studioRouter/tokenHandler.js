import bcrypt from 'bcrypt';
import { isPast } from 'date-fns';
import { verify } from 'jsonwebtoken';
import querystring from 'querystring';
import raw from 'raw-body';

import {
  EmailAuthorization,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  User,
} from '../../models';
import createJWTResponse from '../../utils/createJWTResponse';
import getApp from '../../utils/getApp';

class GrantError extends Error {
  constructor(error, status = 400) {
    super(error);
    this.status = status;
  }
}

function checkTokenRequestParameters(query, allowed) {
  Object.entries(query).forEach(([key, value]) => {
    if (allowed.includes(key)) {
      return;
    }
    if (Array.isArray(value)) {
      throw GrantError('invalid_request');
    }
  });
  return query;
}

/**
 * Get an access token for a client.
 *
 * This handler is written to be complaitn with [rfc6749](https://tools.ietf.org/html/rfc6749).
 */
export default async function tokenHandler(ctx) {
  const { argv, header } = ctx;
  let aud;
  let refreshToken;
  let scope;
  let sub;

  try {
    if (!ctx.is('application/x-www-form-urlencoded')) {
      throw new GrantError('invalid_request');
    }
    const { grant_type: grantType, ...query } = querystring.parse(
      await raw(ctx.req, { encoding: 'utf-8' }),
    );

    switch (grantType) {
      case 'authorization_code': {
        const {
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          scope: requestedScope,
        } = checkTokenRequestParameters(query, ['client_id', 'code', 'redirect_uri', 'scope']);
        if (!header.referer) {
          throw new GrantError('invalid_request');
        }
        const referer = new URL(header.referer);
        if (redirectUri !== `${referer.origin}${referer.pathname}`) {
          throw new GrantError('invalid_request');
        }
        const match = clientId.match(/^app:(\d+)/);
        if (!match) {
          throw new GrantError('invalid_client');
        }
        const authorizationCode = await OAuth2AuthorizationCode.findOne({
          attributes: ['expires', 'UserId'],
          where: { code, AppId: match[1], redirectUri },
        });
        if (!authorizationCode) {
          throw new GrantError('invalid_client');
        }
        await OAuth2AuthorizationCode.destroy({
          where: { code },
        });
        if (isPast(authorizationCode.expires)) {
          throw new GrantError('invalid_grant');
        }
        aud = clientId;
        refreshToken = true;
        scope = requestedScope;
        sub = authorizationCode.UserId;
        break;
      }
      case 'client_credentials': {
        const { scope: requestedScope } = checkTokenRequestParameters(query, ['scope']);
        const authorization = /^Basic (.*)$/.exec(header.authorization);
        if (!authorization) {
          throw new GrantError('invalid_client');
        }
        const credentials = `${Buffer.from(authorization[1], 'base64')}`.match(/([^:]*):(.*)/);
        if (!credentials) {
          throw new GrantError('invalid_client');
        }
        const client = await OAuth2ClientCredentials.findOne({
          attributes: ['expires', 'id', 'scopes', 'UserId'],
          raw: true,
          where: {
            id: credentials[1],
            secret: credentials[2],
          },
        });
        if (!client) {
          throw new GrantError('invalid_client');
        }
        if (client.expires && isPast(client.expires)) {
          throw new GrantError('invalid_grant');
        }
        const clientScopes = client.scopes.split(' ');
        if (!requestedScope) {
          throw new GrantError('invalid_scope');
        }
        scope = requestedScope.split(' ').sort();
        if (!scope.every((s) => clientScopes.includes(s))) {
          throw new GrantError('invalid_scope');
        }
        aud = client.id;
        sub = client.UserId;
        refreshToken = false;
        break;
      }
      // XXX The password grant type is supported for now for legacy apps.
      case 'password': {
        const { password, scope: requestedScope, username } = checkTokenRequestParameters(query, [
          'password',
          'scope',
          'username',
        ]);

        // Validate the app as a client.
        const app = await getApp(ctx, { attributes: ['id'] }, header.referer);
        if (!app) {
          throw new GrantError('invalid_client');
        }

        // Validate user credentials
        const emailAuth = await EmailAuthorization.findOne({
          include: [User],
          where: { email: username },
        });
        if (!emailAuth) {
          throw new GrantError('invalid_grant');
        }
        const isValidPassword = await bcrypt.compare(password, emailAuth.User.password);
        if (!isValidPassword) {
          throw new GrantError('invalid_grant');
        }

        scope = [requestedScope];
        aud = `app:${app.id}`;
        sub = emailAuth.User.id;
        refreshToken = true;
        break;
      }
      case 'refresh_token': {
        const { refresh_token: token } = checkTokenRequestParameters(query, ['refresh_token']);
        try {
          const payload = verify(token, argv.secret);
          ({ aud, scope, sub } = payload);
          refreshToken = true;
        } catch (error) {
          throw new GrantError('invalid_grant');
        }
        break;
      }
      default:
        throw new GrantError('unsupported_grant_type');
    }
  } catch (error) {
    if (error instanceof GrantError) {
      ctx.status = error.status;
      ctx.body = { error: error.message };
      return;
    }
    throw error;
  }

  ctx.body = createJWTResponse(sub, argv, { aud, refreshToken, scope });
}
