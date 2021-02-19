import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AppRoutes } from './app';
import { IndexPage } from './Index';
import { messages } from './messages';

/**
 * Render routes related to apps.
 */
export function AppsRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/:id(\\d+)`}>
        <AppRoutes />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
