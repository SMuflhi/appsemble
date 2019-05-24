import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import Toolbar from '../Toolbar';
import styles from './ErrorFallback.css';
import messages from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorFallback extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Toolbar>
          <FormattedMessage {...messages.title} />
        </Toolbar>
        <div className={classNames('container', styles.error)} role="alert">
          <FormattedMessage {...messages.message} />
        </div>
      </React.Fragment>
    );
  }
}
