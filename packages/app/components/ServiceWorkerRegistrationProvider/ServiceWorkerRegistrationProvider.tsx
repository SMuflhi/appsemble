import axios from 'axios';
import * as React from 'react';

import settings from '../../utils/settings';
import urlB64ToUint8Array from '../../utils/urlB64ToUint8Array';

interface ServiceWorkerRegistrationProviderProps {
  children: React.ReactNode;
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

interface ServiceWorkerRegistrationContextType {
  subscribe(): Promise<boolean>;
  unsubscribe(): Promise<boolean>;
  permission: Permission;
  subscription: PushSubscription;
  requestPermission(): Promise<NotificationPermission>;
}

export type Permission = NotificationPermission | 'pending';

const ServiceWorkerRegistrationContext = React.createContext<ServiceWorkerRegistrationContextType>(
  null,
);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return React.useContext(ServiceWorkerRegistrationContext);
}

export default function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): React.ReactElement {
  const [permission, setPermission] = React.useState<Permission>(window.Notification.permission);
  const [subscription, setSubscription] = React.useState<PushSubscription>();

  React.useEffect(() => {
    serviceWorkerRegistrationPromise.then(registration => {
      if (registration) {
        registration.pushManager.getSubscription().then(setSubscription);
      }
    });
  }, [serviceWorkerRegistrationPromise]);

  const requestPermission = React.useCallback(async () => {
    if (window.Notification.permission === 'default') {
      setPermission('pending');
    }

    const newPermission = await window.Notification.requestPermission();
    setPermission(newPermission);

    return newPermission;
  }, []);

  const subscribe = React.useCallback(async () => {
    const registration = await serviceWorkerRegistrationPromise;

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        return false;
      }
    }

    let sub = await registration.pushManager.getSubscription();

    if (!sub) {
      const { vapidPublicKey, id } = settings;
      const options = {
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
        userVisibleOnly: true,
      };

      sub = await registration.pushManager.subscribe(options);
      await axios.post(`${settings.apiUrl}/api/apps/${id}/subscriptions`, sub);
    }

    setSubscription(sub);

    return true;
  }, [permission, requestPermission, serviceWorkerRegistrationPromise]);

  const unsubscribe = React.useCallback(async () => {
    if (!subscription) {
      return false;
    }
    const result = subscription.unsubscribe();
    setSubscription(null);
    return result;
  }, [subscription]);

  const value = React.useMemo(
    () => ({
      subscribe,
      subscription,
      requestPermission,
      permission,
      unsubscribe,
    }),
    [permission, requestPermission, subscribe, subscription, unsubscribe],
  );

  return (
    <ServiceWorkerRegistrationContext.Provider value={value}>
      {children}
    </ServiceWorkerRegistrationContext.Provider>
  );
}
