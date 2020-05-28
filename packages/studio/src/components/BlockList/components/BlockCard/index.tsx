import { Title } from '@appsemble/react-components/src';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import styles from './index.css';
import messages from './messages';

interface BlockCardProps {
  block: BlockManifest;
}

export default function BlockCard({ block }: BlockCardProps): React.ReactElement {
  const match = useRouteMatch();
  const intl = useIntl();
  const [org, ...name] = block.name.split('/');

  return (
    <div key={block.name} className="card">
      <header className="card-header">
        <div className="card-header-title">
          <article className="media">
            <figure className="media-left">
              <p className="image is-64x64">
                <img
                  alt={intl.formatMessage(messages.blockLogo, { name: `@${org}${name}` })}
                  src={`/api/blocks/${org}/${name}/versions/${block.version}/icon`}
                />
              </p>
            </figure>
            <div className="media-content">
              <Title className="title is-4" level={4}>
                {name}
              </Title>
              <Title className="subtitle is-6" level={6}>
                {org}
              </Title>
            </div>
            <div className={`media-right ${styles.version}`}>
              <span className="subtitle is-6 has-text-grey">{block.version}</span>
            </div>
          </article>
        </div>
      </header>
      <div className={styles.cardBody}>
        <div className="card-content">
          <div className={`content ${styles.description}`}>
            {block.description ?? (
              <span className="has-text-grey-light">
                <FormattedMessage {...messages.noDescription} />
              </span>
            )}
          </div>
        </div>
        <footer className="card-footer">
          <Link className="card-footer-item" to={`${match.url}/${block.name}`}>
            <FormattedMessage {...messages.buttonDetails} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
