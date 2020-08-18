import 'roboto-fontface';
import './index.css';

import { init } from '@sentry/browser';
import React from 'react';
import { render } from 'react-dom';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

import { App } from './components/App';
import { sentryDsn } from './utils/settings';

init({ dsn: sentryDsn });

const serviceWorkerRegistrationPromise =
  runtime.register() || Promise.reject(new Error('Service worker not available'));

render(
  <App serviceWorkerRegistrationPromise={serviceWorkerRegistrationPromise} />,
  document.getElementById('app'),
);

window.appsembleHasLoaded = true;
