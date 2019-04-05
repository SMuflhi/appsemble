import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import CMSRoot from '../CMSRoot';
import ResourceTable from '../ResourceTable';
import SideMenu from '../SideMenu';
import styles from './CMS.css';

export default class CMS extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;

    return (
      <div className="columns">
        <div className="column is-one-fifth">
          <Route
            path={`${match.path}/:resourceName?`}
            render={props => <SideMenu app={app} {...props} />}
          />
        </div>
        <div className={`column ${styles.cmsContent}`}>
          <Switch>
            <Route component={CMSRoot} exact path={match.path} />

            <Route
              component={ResourceTable}
              path={`${match.path}/:resourceName/:mode?/:resourceId?`}
            />
          </Switch>
        </div>
      </div>
    );
  }
}
