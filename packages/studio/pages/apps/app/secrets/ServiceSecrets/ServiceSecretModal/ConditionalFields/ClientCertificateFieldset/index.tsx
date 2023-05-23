import { SimpleFormField, TextAreaField } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

const certPlaceholder = `-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----`;
const keyPlaceholder = `-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----`;

interface ClientCertificateFieldsetProps {
  disabled: boolean;
}

export function ClientCertificateFieldset({
  disabled,
}: ClientCertificateFieldsetProps): ReactElement {
  return (
    <>
      <SimpleFormField
        component={TextAreaField}
        disabled={disabled}
        help={<FormattedMessage {...messages.certificateHelp} />}
        label={<FormattedMessage {...messages.certificateLabel} />}
        name="identifier"
        placeholder={certPlaceholder}
        required
      />
      <SimpleFormField
        component={TextAreaField}
        disabled={disabled}
        help={<FormattedMessage {...messages.privateKeyHelp} />}
        label={<FormattedMessage {...messages.privateKeyLabel} />}
        name="secret"
        placeholder={keyPlaceholder}
        required
      />
    </>
  );
}