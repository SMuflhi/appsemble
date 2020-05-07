import type { Action } from '@appsemble/sdk';
import type {
  ActionDefinition,
  AppDefinition,
  Block,
  BlockManifest,
  UserInfo,
} from '@appsemble/types';
import type { EventEmitter } from 'events';
import type { RouteComponentProps } from 'react-router-dom';
import type { JsonValue } from 'type-fest';

declare module '@appsemble/sdk' {
  interface Actions {
    [K: string]: ActionDefinition;
  }

  interface EventEmitters {
    [K: string]: {};
  }

  interface EventListeners {
    [K: string]: {};
  }

  interface Parameters {
    [K: string]: JsonValue;
  }
}

export interface User extends UserInfo {
  scope: string;
}

declare global {
  interface Window {
    /**
     * This boolean indicates if Appsemble has loaded normally.
     *
     * If this is not been set, this means Appsemble didn’t load, probably because it doesn’t
     * recognize newer JavaScript features.
     */
    appsembleHasLoaded: boolean;

    settings: {
      apiUrl: string;
      blockManifests: BlockManifest[];
      vapidPublicKey: string;
      id: number;
      definition: AppDefinition;
      sentryDsn: string;
    };
  }
}

export interface ShowDialogParams {
  actionCreators: { [key: string]: () => Action };
  blocks: Block[];
  closable?: boolean;
  data: any;
  close: () => void;
  fullscreen: boolean;
  prefix: string;
  title?: string;
}

export type ShowDialogAction = (params: ShowDialogParams) => () => void;

export interface FlowActions {
  back: (data: any) => Promise<any>;
  cancel: (data: any) => Promise<any>;
  finish: (data: any) => Promise<any>;
  next: (data: any) => Promise<any>;
}

export interface MakeActionParameters<D extends ActionDefinition> {
  app: AppDefinition;
  definition: D;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  onSuccess?: Action;
  onError?: Action;
  showDialog: ShowDialogAction;
  prefix: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  ee: EventEmitter;
}

export type Permission = NotificationPermission | 'pending';

export interface ServiceWorkerRegistrationContextType {
  subscribe(): Promise<PushSubscription>;
  unsubscribe(): Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission(): Promise<NotificationPermission>;
}
