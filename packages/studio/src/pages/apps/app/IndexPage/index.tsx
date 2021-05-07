import { Button, MarkdownContent, Title, useToggle } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import classNames from 'classnames';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import { CloneButton } from 'studio/src/components/CloneButton';

import { useApp } from '..';
import { CardHeaderControl } from '../../../../components/CardHeaderControl';
import { StarRating } from '../../../../components/StarRating';
import { getAppUrl } from '../../../../utils/getAppUrl';
import { AppRatings } from './AppRatings';
import { AppScreenshots } from './AppScreenshots';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * Display a more detailed overview of an individual app.
 */
export function IndexPage(): ReactElement {
  const { app } = useApp();
  const descriptionToggle = useToggle();
  const { lang } = useParams<{ lang: string }>();
  const { formatMessage } = useIntl();

  const appLang = app.definition.defaultLanguage || defaultLocale;

  return (
    <main>
      <CardHeaderControl
        controls={
          <>
            <Button
              className="mb-3 ml-4"
              color="primary"
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </Button>
            <CloneButton app={app} />
          </>
        }
        description={app.definition.description}
        details={
          <StarRating
            className="is-inline"
            count={app.rating?.count ?? 0}
            value={app.rating?.average ?? 0}
          />
        }
        icon={
          <img
            alt={formatMessage(messages.appLogo)}
            className="is-rounded card"
            src={`/api/apps/${app.id}/icon?maskable=true`}
          />
        }
        subtitle={
          <Link to={`/${lang}/organizations/${app.OrganizationId}`}>
            {app.OrganizationName || app.OrganizationId}
          </Link>
        }
        title={app.definition.name}
      >
        <AppScreenshots />
      </CardHeaderControl>
      {app.longDescription && (
        <div
          className={classNames('card my-3 card-content', {
            [styles.descriptionHidden]: !descriptionToggle.enabled,
          })}
        >
          <Title>
            <FormattedMessage {...messages.description} />
          </Title>
          <Button className={styles.descriptionToggle} onClick={descriptionToggle.toggle}>
            {descriptionToggle.enabled ? (
              <FormattedMessage {...messages.readLess} />
            ) : (
              <FormattedMessage {...messages.readMore} />
            )}
          </Button>
          <MarkdownContent content={app.longDescription} lang={appLang} />
        </div>
      )}
      <AppRatings />
    </main>
  );
}
