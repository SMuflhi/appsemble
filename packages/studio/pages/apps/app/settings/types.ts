import { type AppVisibility } from '@appsemble/types';

export interface FormValues {
  emailName: string;
  googleAnalyticsID: string;
  sentryDsn: string;
  sentryEnvironment: string;
  icon: File | string;
  maskableIcon?: File;
  iconBackground: string;
  path: string;
  visibility: AppVisibility;
  domain: string;
  locked: boolean;
  longDescription: string;
  showAppDefinition: boolean;
}
