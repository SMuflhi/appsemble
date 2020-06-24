import {
  Content,
  FormButtons,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
  Title,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';

export default function Notifications(): React.ReactElement {
  const { app } = useApp();

  const { formatMessage } = useIntl();
  const push = useMessages();
  const submit = React.useCallback(
    async ({ body, title }: { title: string; body: string }): Promise<void> => {
      try {
        await axios.post(`/api/apps/${app.id}/broadcast`, { title, body });
        push({ body: formatMessage(messages.submitSuccess), color: 'success' });
      } catch (error) {
        push({ body: formatMessage(messages.submitError), color: 'danger' });
      }
    },
    [app.id, formatMessage, push],
  );

  const { notifications } = app.definition;
  const disabled = notifications === undefined;

  return (
    <Content>
      <HelmetIntl title={messages.title} />

      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="content">
        {disabled && (
          <p>
            <FormattedMessage
              {...messages.enableInstructions}
              values={{
                appDefinition: (
                  <Link to={`/apps/${app.id}/edit#editor`}>
                    <FormattedMessage {...messages.appDefinition} />
                  </Link>
                ),
                navigation: (
                  <a
                    href="https://appsemble.dev/reference/app#notification"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <code>notifications</code>
                  </a>
                ),
              }}
            />
          </p>
        )}

        <SimpleForm defaultValues={{ title: '', body: '' }} onSubmit={submit} resetOnSuccess>
          <SimpleInput
            disabled={disabled}
            label={<FormattedMessage {...messages.titleLabel} />}
            maxLength={30}
            name="title"
            required
          />
          <SimpleInput
            disabled={disabled}
            label={<FormattedMessage {...messages.bodyLabel} />}
            maxLength={100}
            name="body"
            required
          />
          <FormButtons>
            <SimpleSubmit disabled={disabled}>
              <FormattedMessage {...messages.requestButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </div>
    </Content>
  );
}
