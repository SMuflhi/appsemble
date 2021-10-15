import { IconName } from '@appsemble/sdk';

export interface Button {
  /**
   * A [Font Awesome icon](https://fontawesome.com/icons?m=free) name to render on the button.
   *
   * By default a cared pointing left or right respectively will be rendered.
   */
  icon?: IconName;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The configuration for the back button.
     */
    back?: Button | false;

    /**
     * The configuration for the forward button.
     */
    forward?: Button | false;
  }

  interface Actions {
    /**
     * This actions gets triggered then the back button is clicked.
     *
     * It will be called with the page data.
     */
    onBack: never;

    /**
     * This actions gets triggered then the back button is clicked.
     *
     * It will be called with the page data.
     */
    onForward: never;
  }

  interface Messages {
    /**
     * The label that’s used on the back button.
     */
    back: never;

    /**
     * The label that’s used on the forward button.
     */
    forward: never;
  }
}