import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React from 'react';
import { Helmet } from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import settings from '../../utils/settings';
import AnonymousRoute from '../AnonymousRoute';
import AppContext from '../AppContext';
import AppList from '../AppList';
import EditPassword from '../EditPassword';
import ErrorFallback from '../ErrorFallback';
import Login from '../Login';
import OAuth2Connect from '../OAuth2Connect';
import OpenIDLogin from '../OpenIDLogin';
import OrganizationInvite from '../OrganizationInvite';
import OrganizationProvider from '../OrganizationProvider';
import ProtectedRoute from '../ProtectedRoute';
import Register from '../Register';
import ResetPassword from '../ResetPassword';
import Settings from '../Settings';
import Toolbar from '../Toolbar';
import UserProvider from '../UserProvider';
import VerifyEmail from '../VerifyEmail';

export default function App(): React.ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <BrowserRouter>
        <UserProvider>
          <OrganizationProvider>
            <ErrorHandler fallback={ErrorFallback}>
              <MessagesProvider>
                <Helmet defaultTitle="Appsemble" titleTemplate="Appsemble · %s" />
                <Toolbar />
                <Switch>
                  <Route exact path="/apps">
                    <AppList />
                  </Route>
                  <ProtectedRoute path="/settings">
                    <Settings />
                  </ProtectedRoute>
                  <ProtectedRoute exact path="/connect/authorize">
                    <OpenIDLogin />
                  </ProtectedRoute>
                  <Route path="/apps/:id(\d+)">
                    <AppContext />
                  </Route>
                  <AnonymousRoute exact path="/edit-password">
                    <EditPassword />
                  </AnonymousRoute>
                  <ProtectedRoute exact path="/organization-invite">
                    <OrganizationInvite />
                  </ProtectedRoute>
                  <Route exact path="/verify">
                    <VerifyEmail />
                  </Route>
                  <Route exact path="/callback">
                    <OAuth2Connect />
                  </Route>
                  <AnonymousRoute exact path="/login">
                    <Login />
                  </AnonymousRoute>
                  {settings.enableRegistration && (
                    <AnonymousRoute exact path="/register">
                      <Register />
                    </AnonymousRoute>
                  )}
                  <Route exact path="/reset-password">
                    <ResetPassword />
                  </Route>
                  <Route exact path="/edit-password">
                    <EditPassword />
                  </Route>
                  <Route exact path="/verify">
                    <VerifyEmail />
                  </Route>
                  <Redirect to="/apps" />
                </Switch>
              </MessagesProvider>
            </ErrorHandler>
          </OrganizationProvider>
        </UserProvider>
      </BrowserRouter>
    </IntlProvider>
  );
}
