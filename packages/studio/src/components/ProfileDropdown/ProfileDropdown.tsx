import { Button, Dropdown, Icon, useQuery } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import useUser from '../../hooks/useUser';
import messages from './messages';
import styles from './ProfileDropdown.css';

export default function ProfileDropdown(): React.ReactElement {
  const intl = useIntl();
  const { logout, userInfo } = useUser();
  const location = useLocation();
  const qs = useQuery();

  if (!userInfo) {
    if (location.pathname === '/login') {
      return null;
    }

    const search = new URLSearchParams(qs);
    search.set('redirect', `${location.pathname}${location.search}${location.hash}`);

    return (
      <Link className="button" to={{ pathname: '/login', search: `?${search}` }}>
        <FormattedMessage {...messages.login} />
      </Link>
    );
  }

  return (
    <Dropdown
      className="is-right"
      label={
        <figure className="image is-32x32">
          <img
            alt={intl.formatMessage(messages.pfp)}
            className={`is-rounded ${styles.gravatar}`}
            src={userInfo.picture}
          />
        </figure>
      }
    >
      <Link className="dropdown-item" to="/settings">
        <Icon icon="wrench" />
        <span>
          <FormattedMessage {...messages.settings} />
        </span>
      </Link>
      <a
        className="dropdown-item"
        href="https://appsemble.dev"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Icon icon="book" />
        <span>
          <FormattedMessage {...messages.documentation} />
        </span>
      </a>
      <hr className="dropdown-divider" />
      <Button
        className={`dropdown-item ${styles.logoutButton}`}
        icon="sign-out-alt"
        onClick={logout}
      >
        <FormattedMessage {...messages.logoutButton} />
      </Button>
    </Dropdown>
  );
}
