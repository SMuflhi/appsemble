import type { JwtPayload } from '@appsemble/types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { GetApiKeyUser } from 'koas-security/lib/apiKeySecurityCheck';
import type { GetHttpUser } from 'koas-security/lib/httpSecurityCheck';
import type { GetOAuth2User } from 'koas-security/lib/oauth2SecurityCheck';
import type { OAuth2Client } from 'koas-security/lib/types';
import { Op } from 'sequelize';

import { App, EmailAuthorization, OAuth2ClientCredentials, User } from '../models';
import type { Argv } from '../types';

interface Client extends OAuth2Client {
  app: App;
}

interface LoggedInUser {
  id: string | number;
}

interface AuthenticationCheckers {
  basic: GetHttpUser<User>;
  app: GetOAuth2User<LoggedInUser>;
  cli: GetOAuth2User<LoggedInUser>;
  studio: GetApiKeyUser<LoggedInUser>;
}

export default function authentication({ host, secret }: Argv): AuthenticationCheckers {
  return {
    async basic(email, password) {
      const { User: user } = await EmailAuthorization.findOne({
        include: [User],
        where: { email },
      });
      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    },

    async app(accessToken) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
      // XXX use origin check when default app domains are implemented.
      const [prefix, id] = aud.split(':');
      if (prefix !== 'app') {
        return null;
      }
      const app = new App({ id });
      return [{ id: sub }, { scope, app }] as [LoggedInUser, Client];
    },

    async cli(accessToken) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
      const credentials = await OAuth2ClientCredentials.findOne({
        attributes: [],
        raw: true,
        where: {
          id: aud,
          expires: { [Op.or]: [null, { [Op.gt]: new Date() }] },
          UserId: sub,
        },
      });
      if (!credentials) {
        return null;
      }
      return [{ id: sub }, { scope }] as [LoggedInUser, Client];
    },

    async studio(accessToken) {
      const { sub } = jwt.verify(accessToken, secret, { audience: host }) as JwtPayload;
      return { id: sub };
    },
  };
}
