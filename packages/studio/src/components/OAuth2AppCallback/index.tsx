import { Loader, useQuery } from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React, { ReactElement, useEffect } from 'react';

import { ExtendedOAuth2State } from '../../types';
import { oauth2Redirect } from '../../utils/oauth2Utils';

interface OAuth2AppCallbackProps {
  session: ExtendedOAuth2State;
}

export function OAuth2AppCallback({ session }: OAuth2AppCallbackProps): ReactElement {
  const qs = useQuery();

  useEffect(() => {
    const code = qs.get('code');
    const state = qs.get('state');
    const error = state === session.state ? qs.get('error') : 'invalid_request';
    const appRequest = new URLSearchParams(session.appRequest);

    if (error) {
      oauth2Redirect(appRequest, { error });
      return;
    }
    const [, appId] = appRequest.get('client_id').split(':');

    axios
      .post(`/api/apps/${appId}/secrets/oauth2/${session.id}/verify`, {
        code,
        scope: appRequest.get('scope'),
        redirectUri: appRequest.get('redirect_uri'),
      })
      .then(({ data }) => oauth2Redirect(appRequest, data))
      .catch((err: AxiosError) =>
        oauth2Redirect(appRequest, {
          code: err.response.status < 500 ? 'invalid_request' : 'server_error',
        }),
      );
  }, [qs, session]);

  return <Loader />;
}
