import { Button, Content, Icon, useData } from '@appsemble/react-components';
import { App, BlockManifest } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { AppCard } from '../../../../components/AppCard';
import { AsyncDataView } from '../../../../components/AsyncDataView';
import { BlockCard } from '../../../../components/BlockCard';
import { CardHeaderControl } from '../../../../components/CardHeaderControl';
import { CollapsibleList } from '../../../../components/CollapsibleList';
import { useUser } from '../../../../components/UserProvider';
import { Organization } from '../../../../types';
import { checkRole } from '../../../../utils/checkRole';
import styles from './index.module.css';
import { messages } from './messages';

interface IndexPageProps {
  organization: Organization;
}

export function IndexPage({ organization }: IndexPageProps): ReactElement {
  const { url } = useRouteMatch();
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

  const appsResult = useData<App[]>(`/api/organizations/${organization.id}/apps`);
  const blocksResult = useData<BlockManifest[]>(`/api/organizations/${organization.id}/blocks`);

  const userOrganization = organizations?.find((org) => org.id === organization.id);
  const mayEditOrganization =
    userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);
  const id = organization.id.startsWith('@') ? organization.id : `@${organization.id}`;

  return (
    <Content className={`pb-2 ${styles.root}`}>
      <CardHeaderControl
        controls={
          <>
            {mayEditOrganization && (
              <Button className="mb-3 ml-4" component={Link} to={`${url}/settings`}>
                <FormattedMessage {...messages.editOrganization} />
              </Button>
            )}
            {userOrganization && (
              <Button className="mb-3 ml-4" component={Link} to={`${url}/members`}>
                <FormattedMessage {...messages.viewMembers} />
              </Button>
            )}
          </>
        }
        description={organization.description}
        details={
          <>
            {organization.website && (
              <div className={styles.icon}>
                <Icon icon="globe" />
                <a
                  href={organization.website}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={organization.website}
                >
                  {organization.website.replace(/^(https?:|)\/\//, '')}
                </a>
              </div>
            )}
            {organization.email && (
              <div className={styles.icon}>
                <Icon icon="envelope" />
                <a href={`mailto:${organization.email}`} title={organization.email}>
                  {organization.email}
                </a>
              </div>
            )}
          </>
        }
        icon={
          <img
            alt={formatMessage(messages.logo)}
            className="px-4 py-4 card"
            src={organization.iconUrl}
          />
        }
        subtitle={id}
        title={organization.name || id}
      >
        <div className="px-5 pt-2 pb-4 has-background-white-bis">
          <CollapsibleList title={<FormattedMessage {...messages.apps} />}>
            <AsyncDataView
              emptyMessage={<FormattedMessage {...messages.appsEmpty} />}
              errorMessage={<FormattedMessage {...messages.appsError} />}
              loadingMessage={<FormattedMessage {...messages.appsLoading} />}
              result={appsResult}
            >
              {(apps) => (
                <div className={styles.appList}>
                  {apps.map((app) => (
                    <AppCard app={app} key={app.id} />
                  ))}
                </div>
              )}
            </AsyncDataView>
          </CollapsibleList>
          <hr className="has-background-grey-lighter" />
          <CollapsibleList title={<FormattedMessage {...messages.blocks} />}>
            <AsyncDataView
              emptyMessage={<FormattedMessage {...messages.blocksEmpty} />}
              errorMessage={<FormattedMessage {...messages.blocksError} />}
              loadingMessage={<FormattedMessage {...messages.blocksLoading} />}
              result={blocksResult}
            >
              {(blocks) => (
                <div className={styles.blockList}>
                  {blocks.map((block) => (
                    <BlockCard block={block} key={block.name} />
                  ))}
                </div>
              )}
            </AsyncDataView>
          </CollapsibleList>
        </div>
      </CardHeaderControl>
    </Content>
  );
}
