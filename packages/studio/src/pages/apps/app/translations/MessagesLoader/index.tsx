import { useData } from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { MessagesForm } from '../MessagesForm';
import { messages } from './messages';

interface MessagesLoaderProps {
  /**
   * The language ID to eit messages for.
   */
  languageId: string;
}

/**
 * Render a form for editing app messages.
 */
export function MessagesLoader({ languageId }: MessagesLoaderProps): ReactElement {
  const { app } = useApp();

  const result = useData<AppMessages>(`/api/apps/${app.id}/messages/${languageId}`);

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.errorMessage} />}
      loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
      result={result}
    >
      {(appMessages) => <MessagesForm appMessages={appMessages} languageId={languageId} />}
    </AsyncDataView>
  );
}
