import { IconName } from '@fortawesome/fontawesome-common-types';

export interface Field {
  /**
   * The name of the property to render.
   */
  name: string;

  /**
   * The fontawesome icon to render.
   */
  icon: IconName;

  /**
   * The label to render.
   *
   * This defaults to the field name.
   */
  label?: string;
}

declare module '@appsemble/sdk' {
  interface EventListeners {
    data: {};
  }

  interface Parameters {
    fields: Field[];
  }
}
