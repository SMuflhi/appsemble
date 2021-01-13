import { SAMLStatus } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import { ConfigurationError } from './ConfigurationError';
import { EmailConflict } from './EmailConflict';
import { messages } from './messages';

export function SAMLResponse(): ReactElement {
  const { code } = useParams<{ code: SAMLStatus }>();

  switch (code) {
    case 'invalidrelaystate':
      return <ConfigurationError message={messages.invalidRelayState} />;
    case 'invalidsecret':
      return <ConfigurationError message={messages.invalidSecret} />;
    case 'invalidstatuscode':
      return <ConfigurationError message={messages.invalidStatusCode} />;
    case 'badsignature':
      return <ConfigurationError message={messages.badSignature} />;
    case 'missingsubject':
      return <ConfigurationError message={messages.missingSubject} />;
    case 'missingnameid':
      return <ConfigurationError message={messages.missingNameID} />;
    case 'emailconflict':
      return <EmailConflict />;
    default:
      return <div>Oh noez</div>;
  }
}
