import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import NavLink from '../NavLink';
import styles from './SideMenu.css';
import messages from './messages';

export default class SideMenu extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;

    return (
      <aside className={`menu ${styles.sideMenu}`}>
        <p className="menu-label">
          <FormattedMessage {...messages.general} />
        </p>
        <ul className="menu-list">
          <li>
            <NavLink exact to={`${match.url}/edit`}>
              <FormattedMessage {...messages.editor} />
            </NavLink>
          </li>
          <li>
            <NavLink exact to={`${match.url}/resources`}>
              <FormattedMessage {...messages.resources} />
            </NavLink>
            {app.resources && (
              <ul>
                {Object.keys(app.resources)
                  .sort()
                  .map(resource => (
                    <li key={resource}>
                      <NavLink to={`${match.url}/resources/${resource}`}>{resource}</NavLink>
                    </li>
                  ))}
              </ul>
            )}
          </li>
        </ul>
      </aside>
    );
  }
}
