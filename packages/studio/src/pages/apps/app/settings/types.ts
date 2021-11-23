import { AppVisibility } from 'types/src/app';

export interface FormValues {
  googleAnalyticsID: string;
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
