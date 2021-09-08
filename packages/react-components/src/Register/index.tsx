import {
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import { AxiosError } from 'axios';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';
import { messages } from './messages';

export interface RegistrationFormValues {
  email: string;
  name: string;
  password: string;
}

interface RegisterProps {
  onRegister: (values: RegistrationFormValues) => Promise<void>;
}

export function Register({ onRegister }: RegisterProps): ReactElement {
  return (
    <SimpleForm defaultValues={{ email: '', name: '', password: '' }} onSubmit={onRegister}>
      <SimpleFormError>
        {({ error }: { error: AxiosError }) =>
          error.response && error.response.status === 409 ? (
            <FormattedMessage {...messages.emailConflict} />
          ) : (
            <FormattedMessage {...messages.registerFailed} />
          )
        }
      </SimpleFormError>
      <SimpleFormField
        autoComplete="name"
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
      />
      <SimpleFormField
        autoComplete="email"
        icon="envelope"
        label={<FormattedMessage {...messages.emailLabel} />}
        name="email"
        required
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          valueMissing: <FormattedMessage {...messages.emailRequired} />,
        }}
      />
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        help={<PasswordStrengthIndicator minLength={8} name="password" />}
        label={<FormattedMessage {...messages.passwordLabel} />}
        minLength={8}
        name="password"
        required
      />
      <FormButtons>
        <SimpleSubmit className="is-pulled-right">
          <FormattedMessage {...messages.registerButton} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
