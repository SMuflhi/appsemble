import {
  Confirmation,
  ErrorHandler,
  MessagesProvider,
  SideMenuProvider,
} from '@appsemble/react-components';
import { MDXProvider } from '@mdx-js/react';
import { ReactElement } from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter, Route } from 'react-router-dom';

import { ErrorFallback } from '../ErrorFallback';
import { MDXAnchor, MDXCode, MDXPre } from '../MDX';
import { Routes } from '../Routes';
import { SideMenuBase } from '../SideMenuBase';
import { StudioMessagesProvider } from '../StudioMessagesProvider';
import { Toolbar } from '../Toolbar';
import { UserProvider } from '../UserProvider';

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <Route path="/:lang?">
        <StudioMessagesProvider>
          <MDXProvider
            components={{
              a: MDXAnchor,
              pre: MDXPre,
              code: MDXCode,
            }}
          >
            <UserProvider>
              <ErrorHandler fallback={ErrorFallback}>
                <Confirmation>
                  <MessagesProvider>
                    <Helmet defaultTitle="Appsemble" titleTemplate="Appsemble · %s" />
                    <SideMenuProvider base={<SideMenuBase />}>
                      <Toolbar />
                      <Routes />
                    </SideMenuProvider>
                  </MessagesProvider>
                </Confirmation>
              </ErrorHandler>
            </UserProvider>
          </MDXProvider>
        </StudioMessagesProvider>
      </Route>
    </BrowserRouter>
  );
}
