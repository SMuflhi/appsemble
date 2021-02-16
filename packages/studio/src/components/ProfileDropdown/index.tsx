import {
  Icon,
  NavbarDropdown,
  NavbarItem,
  useLocationString,
  useQuery,
} from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useRouteMatch } from 'react-router-dom';

import { sentryDsn } from '../../utils/settings';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  className?: string;
}

export function ProfileDropdown({ className }: LanguageDropdownProps): ReactElement {
  const { formatMessage } = useIntl();
  const { logout, userInfo } = useUser();
  const location = useLocation();
  const redirect = useLocationString();
  const { url } = useRouteMatch();
  const qs = useQuery();
  let search: URLSearchParams;

  if (!userInfo) {
    if (location.pathname.endsWith('/login')) {
      return null;
    }

    search = new URLSearchParams(qs);
    search.set('redirect', redirect);
  }

  return (
    <NavbarDropdown
      className={`is-right ${className}`}
      color="dark"
      label={
        userInfo ? (
          <figure className="image is-32x32">
            {userInfo?.picture ? (
              <img
                alt={formatMessage(messages.pfp)}
                className={`is-rounded ${styles.gravatar}`}
                src={userInfo.picture}
              />
            ) : (
              <Icon
                className={`is-rounded has-background-grey-dark has-text-white-ter ${styles.gravatarFallback}`}
                icon="user"
              />
            )}
          </figure>
        ) : (
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        )
      }
    >
      {userInfo && (
        <NavbarItem icon="wrench" to={`${url}/settings`}>
          <FormattedMessage {...messages.settings} />
        </NavbarItem>
      )}
      {sentryDsn && (
        <NavbarItem icon="comment" to={`${url}/feedback`}>
          <FormattedMessage {...messages.feedback} />
        </NavbarItem>
      )}
      <hr className="navbar-divider" />
      {userInfo ? (
        <NavbarItem icon="sign-out-alt" onClick={logout}>
          <FormattedMessage {...messages.logoutButton} />
        </NavbarItem>
      ) : (
        <NavbarItem icon="sign-in-alt" to={{ pathname: `${url}/login`, search: `?${search}` }}>
          <FormattedMessage {...messages.login} />
        </NavbarItem>
      )}
    </NavbarDropdown>
  );
}
