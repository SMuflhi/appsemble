import {
  Button,
  CardFooterButton,
  CheckboxField,
  Content,
  MarkdownContent,
  Modal,
  SelectField,
  SimpleForm,
  SimpleFormField,
  Subtitle,
  Title,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { checkRole } from '../../utils/checkRole';
import { getAppUrl } from '../../utils/getAppUrl';
import { useApp } from '../AppContext';
import { AppRatings } from '../AppRatings';
import { AppScreenshots } from '../AppScreenshots';
import { StarRating } from '../StarRating';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function AppDetails(): ReactElement {
  const { app } = useApp();
  const { data: organization, error, loading } = useData<Organization>(
    `/api/organizations/${app.OrganizationId}`,
  );
  const cloneDialog = useToggle();
  const descriptionToggle = useToggle();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

  const cloneApp = useCallback(
    async ({ description, name, private: isPrivate, selectedOrganization }) => {
      const { data: clone } = await axios.post('/api/templates', {
        templateId: app.id,
        name,
        description,
        organizationId: organizations[selectedOrganization].id,
        resources: false,
        private: isPrivate,
      });

      history.push(`/apps/${clone.id}/edit`);
    },
    [app, history, organizations],
  );

  const createOrganizations =
    organizations?.filter((org) => checkRole(org.role, Permission.CreateApps)) ?? [];

  return (
    <Content className={styles.root}>
      <div className="card my-3">
        <div className="is-flex card-content">
          <figure className="image is-128x128">
            <img alt={formatMessage(messages.appLogo)} src={`/api/apps/${app.id}/icon`} />
          </figure>
          <div className={`mx-4 ${styles.appMeta}`}>
            <header>
              <Title className="is-marginless">{app.definition.name}</Title>
              <Subtitle className="is-marginless" size={4}>
                {loading || error ? `@${app.OrganizationId}` : organization.name}
              </Subtitle>
            </header>
            {app.definition.description && <p>{app.definition.description}</p>}
            <StarRating className="is-inline" count={app.rating.count} value={app.rating.average} />
          </div>
          <div className={`is-flex ${styles.buttonContainer}`}>
            <a
              className="button is-primary"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </a>
            {createOrganizations.length > 0 && (
              <>
                <Button className="mt-3" onClick={cloneDialog.enable}>
                  <FormattedMessage {...messages.clone} />
                </Button>
                <Modal
                  component={SimpleForm}
                  defaultValues={{
                    name: app.definition.name,
                    description: app.definition.description,
                    private: true,
                    selectedOrganization: 0,
                    resources: false,
                  }}
                  footer={
                    <>
                      <CardFooterButton onClick={cloneDialog.disable}>
                        <FormattedMessage {...messages.cancel} />
                      </CardFooterButton>
                      <CardFooterButton color="primary" type="submit">
                        <FormattedMessage {...messages.submit} />
                      </CardFooterButton>
                    </>
                  }
                  isActive={cloneDialog.enabled}
                  onClose={cloneDialog.disable}
                  onSubmit={cloneApp}
                  title={<FormattedMessage {...messages.clone} />}
                >
                  <SimpleFormField
                    help={<FormattedMessage {...messages.nameDescription} />}
                    label={<FormattedMessage {...messages.name} />}
                    maxLength={30}
                    name="name"
                    required
                  />
                  <SimpleFormField
                    component={SelectField}
                    disabled={organizations.length === 1}
                    label={<FormattedMessage {...messages.organization} />}
                    name="selectedOrganization"
                    required
                  >
                    {organizations.map((org, index) => (
                      <option key={org.id} value={index}>
                        {org.name ?? org.id}
                      </option>
                    ))}
                  </SimpleFormField>
                  <SimpleFormField
                    help={<FormattedMessage {...messages.descriptionDescription} />}
                    label={<FormattedMessage {...messages.description} />}
                    maxLength={80}
                    name="description"
                  />
                  <SimpleFormField
                    component={CheckboxField}
                    label={<FormattedMessage {...messages.private} />}
                    name="private"
                    title={<FormattedMessage {...messages.privateDescription} />}
                  />
                  {app.resources && (
                    <SimpleFormField
                      component={CheckboxField}
                      label={<FormattedMessage {...messages.resources} />}
                      name="resources"
                      title={<FormattedMessage {...messages.resourcesDescription} />}
                    />
                  )}
                </Modal>
              </>
            )}
          </div>
        </div>
        <AppScreenshots />
      </div>
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
          <MarkdownContent content={app.longDescription} />
        </div>
      )}
      <AppRatings />
    </Content>
  );
}
