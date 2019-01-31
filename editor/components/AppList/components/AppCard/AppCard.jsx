import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderTitle,
  Content,
  Image,
} from '@appsemble/react-bulma';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './AppCard.css';
import messages from './messages';

export default class AppCard extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
  };

  render() {
    const { app, intl } = this.props;

    return (
      <Card>
        <CardHeader>
          <CardHeaderTitle>{app.name}</CardHeaderTitle>
        </CardHeader>
        <CardContent>
          <Content>
            <Image
              alt={intl.formatMessage(messages.icon)}
              className={styles.image}
              size={64}
              src={`/${app.id}/icon-64.png`}
            />
          </Content>
        </CardContent>
        <CardFooter>
          <CardFooterItem component="a" href={`/${app.path}`} target="_blank">
            <FormattedMessage {...messages.view} />
          </CardFooterItem>
          <CardFooterItem component={Link} to={`/_/edit/${app.id}`}>
            <FormattedMessage {...messages.edit} />
          </CardFooterItem>
        </CardFooter>
      </Card>
    );
  }
}
