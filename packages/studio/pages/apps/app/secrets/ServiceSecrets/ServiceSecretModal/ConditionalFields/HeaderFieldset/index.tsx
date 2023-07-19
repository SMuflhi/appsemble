import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface HeaderFieldsetProps {
  disabled: boolean;
}

export function HeaderFieldset({ disabled }: HeaderFieldsetProps): ReactElement {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.headerHelp} />}
        label={<FormattedMessage {...messages.headerLabel} />}
        name="identifier"
        placeholder="x-api-key"
        required
      />
      <SimpleFormField
        component={PasswordField}
        disabled={disabled}
        help={<FormattedMessage {...messages.secretHelp} />}
        label={<FormattedMessage {...messages.secretLabel} />}
        name="secret"
        required
      />
    </>
  );
}
