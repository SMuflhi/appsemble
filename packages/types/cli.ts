import { type AppVisibility } from './app.js';

export interface AppsembleContext {
  /**
   * If `remote` is specified, this will override `--remote` passed by the command line.
   */
  remote?: string;

  /**
   * If `organization` is specified, this will override `--organization` passed by the command line
   * when creating apps.
   */
  organization?: string;

  icon?: string;

  iconBackground?: string;

  maskableIcon?: string;

  /**
   * If `id` is specified, this will override `--id` passed by the command line when
   * updating an app.
   */
  id?: number;

  /**
   * The Google Analytics ID that should be used for the app.
   */
  googleAnalyticsId?: string;

  /**
   * The custom Sentry DSN for the app.
   */
  sentryDsn?: string;

  /**
   * The environment for the custom Sentry DSN for the app.
   */
  sentryEnvironment?: string;

  /**
   * If `visibility` is specified, this will override `--visibility` passed on the command line.
   */
  visibility?: AppVisibility;

  /**
   * If `template` is specified, this will override `--template` passed on the command line.
   */
  template?: boolean;
}

export interface AppsembleRC {
  /**
   * The background color to use for maskable icons.
   */
  iconBackground?: string;

  context?: Record<string, AppsembleContext>;
}