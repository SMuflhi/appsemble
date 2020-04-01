import { useQuery } from '@appsemble/react-components';
import * as React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import useUser from '../../hooks/useUser';

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export default function AnonymousRoute(props: RouteProps): React.ReactElement {
  const { userInfo } = useUser();
  const qs = useQuery();

  return userInfo ? <Redirect to={qs.get('redirect') || '/apps'} /> : <Route {...props} />;
}
