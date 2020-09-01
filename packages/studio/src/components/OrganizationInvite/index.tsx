import {
  Button,
  Content,
  Icon,
  Loader,
  Message,
  Subtitle,
  Title,
  useData,
  useLocationString,
  useMessages,
  useQuery,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import type { Organization } from '../../types';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function OrganizationInvite(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const qs = useQuery();
  const { logout, organizations, setOrganizations, userInfo } = useUser();
  const redirect = useLocationString();

  const [success, setSuccess] = useState(false);
  const { data: organization, error, loading } = useData<Organization>(
    `/api/invites/${qs.get('token')}`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const sendResponse = useCallback(
    async (response) => {
      setSubmitting(true);

      try {
        await axios.post(`/api/organizations/${organization.id}/join`, {
          token: qs.get('token'),
          response,
        });
        setSuccess(true);
        setJoined(response);

        if (response) {
          setOrganizations([...organizations, { ...organization, role: 'Member' }]);
        }
      } catch (err: unknown) {
        const { response: res } = err as AxiosError;
        if (res) {
          const { status } = res;
          if (status === 404) {
            push(formatMessage(messages.invalidInvite));
          }

          if (status === 406) {
            push(formatMessage(messages.invalidOrganization));
          }
        } else {
          push(formatMessage(messages.error));
        }
        setSuccess(false);
      }
      setSubmitting(false);
    },
    [formatMessage, organization, organizations, push, qs, setOrganizations],
  );

  const onAcceptClick = useCallback(() => sendResponse(true), [sendResponse]);

  const onDeclineClick = useCallback(() => sendResponse(false), [sendResponse]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Content className={`${styles.noInvite} has-text-centered`} padding>
        <Icon className={styles.noInviteIcon} icon="exclamation-circle" />
        <p>
          <FormattedMessage
            {...messages.noInvite}
            values={{
              link: (text: string) => <Link to="/apps">{text}</Link>,
            }}
          />
        </p>
      </Content>
    );
  }

  const header = (
    <header className="py-4">
      <Title level={2}>
        <FormattedMessage
          {...messages.joining}
          values={{ organization: organization.name || organization.id }}
        />
      </Title>
      <Subtitle level={4}>@{organization.id}</Subtitle>
    </header>
  );

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);

    return (
      <Content className="has-text-centered">
        {header}
        <p>
          <FormattedMessage {...messages.loginPrompt} />
        </p>
        <Link className="button is-primary my-3" to={{ pathname: '/login', search: `?${search}` }}>
          <Icon icon="sign-in-alt" />
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        </Link>
      </Content>
    );
  }

  if (success && joined) {
    return (
      <Content padding>
        {joined ? (
          <Message className={styles.root} color="success">
            <FormattedMessage
              {...messages.successJoined}
              values={{
                organization: <strong>{organization.name || organization.id}</strong>,
                makeApps: (link: string) => <Link to="/apps">{link}</Link>,
                viewOrganization: (link: string) => (
                  <Link to="/settings/organizations">{link}</Link>
                ),
              }}
            />
          </Message>
        ) : (
          <Message className={styles.root} color="info">
            <FormattedMessage
              {...messages.successDeclined}
              values={{
                makeApps: (link: string) => <Link to="/apps">{link}</Link>,
              }}
            />
          </Message>
        )}
      </Content>
    );
  }

  if (organizations.some((org) => org.id === organization.id)) {
    return (
      <Content className="has-text-centered">
        {header}
        <p>
          <FormattedMessage {...messages.alreadyJoined} />
        </p>
        <div className="py-4">
          <Button className="mr-3" color="primary" icon="sign-out-alt" onClick={logout}>
            <FormattedMessage {...messages.logout} />
          </Button>
        </div>
      </Content>
    );
  }

  return (
    <Content className="has-text-centered">
      {header}
      <p>
        <FormattedMessage {...messages.invitePrompt} />
      </p>
      <div className="py-4">
        <Button className="mx-2" color="danger" disabled={submitting} onClick={onDeclineClick}>
          <FormattedMessage {...messages.decline} />
        </Button>
        <Button className="mx-2" color="success" disabled={submitting} onClick={onAcceptClick}>
          <FormattedMessage {...messages.accept} />
        </Button>
      </div>
    </Content>
  );
}
