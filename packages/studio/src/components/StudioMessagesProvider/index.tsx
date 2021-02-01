import { Loader, useLocationString } from '@appsemble/react-components';
import { detectLocale, has } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { Redirect, useParams } from 'react-router-dom';

import { supportedLanguages } from '../../utils/constants';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

interface Messages {
  language: string;
  messages: Record<string, string>;
}

const defaultLanguage = 'en-us';

export function StudioMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const redirect = useLocationString();
  const [messages, setMessages] = useState<Record<string, string>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!has(supportedLanguages, lang)) {
      return;
    }

    axios.get<Messages>(`/api/messages/${lang}?context=studio`).then((response) => {
      setMessages(response.data.messages);
      setLoading(false);
    });
  }, [lang]);

  if (has(supportedLanguages, lang)) {
    if (loading) {
      return <Loader />;
    }

    return (
      <IntlProvider defaultLocale={defaultLanguage} locale={lang} messages={messages}>
        {children}
      </IntlProvider>
    );
  }

  const preferredLanguage = localStorage.getItem('preferredLanguage');
  const detected =
    (has(supportedLanguages, preferredLanguage)
      ? preferredLanguage
      : detectLocale(Object.keys(supportedLanguages), navigator.languages)) || defaultLanguage;

  return <Redirect to={`/${detected}${redirect}`} />;
}
