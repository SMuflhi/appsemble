import { Content, Loader, Message, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { useAppDefinition } from '../AppDefinitionProvider';
import { Main } from '../Main';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * Handle the OAuth2 callback.
 */
export function OpenIDCallback(): ReactElement {
  const query = useQuery();
  const code = query.get('code');
  const errorMessage = query.get('error');
  const state = query.get('state');

  const session = useMemo(() => loadOAuth2State(), []);
  const { authorizationCodeLogin, isLoggedIn, role } = useUser();
  const { definition } = useAppDefinition();

  const [error, setError] = useState(false);

  const { redirect } = session;
  const stateOk = state && session.state && state === session.state;
  const isOk = code && !errorMessage && !error && !isLoggedIn && stateOk;

  useEffect(() => {
    if (isOk) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}/Callback`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, isOk]);

  useEffect(() => {
    if (isLoggedIn) {
      clearOAuth2State();
    }
  }, [isLoggedIn]);

  if (isLoggedIn) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Redirect to={redirect || normalize(defaultPageName)} />;
  }

  if (!isOk) {
    return (
      <Main>
        <TitleBar />
        <Content className={styles.error} padding>
          <Message color="danger">
            {errorMessage === 'access_denied' ? (
              <FormattedMessage {...messages.accessDenied} />
            ) : (
              <FormattedMessage {...messages.error} />
            )}
          </Message>
          <Link
            className="button"
            to={{ pathname: '/Login', search: String(new URLSearchParams({ redirect })) }}
          >
            <FormattedMessage {...messages.retry} />
          </Link>
        </Content>
      </Main>
    );
  }

  return <Loader />;
}
