declare module 'service-worker-mock' {
  export default function makeServiceWorkerEnv(): makeServiceWorkerEnv.ServiceWorkerGlobalScopeMock;

  namespace makeServiceWorkerEnv {
    interface Caches {
      [key: string]: Cache;
    }

    interface Listeners {
      [type: string]: Function;
    }

    interface Snapshot {
      /**
       * A key/value map of current cache contents.
       */
      caches: Caches;

      // This should extend Client, but we can’t use the service worker globals.
      /**
       * A list of active clients.
       */
      clients: any[];

      /**
       * A list of active notifications.
       */
      notifications: Notification[];
    }

    // This should extend ServiceWorkerGlobalScope, but using service worker globals causes
    // conflicts with the DOM environment.
    interface ServiceWorkerGlobalScopeMock {
      /**
       * A key/value map of active listeners (`install`/`activate`/`fetch`/etc).
       */
      listeners: Listeners;
      /**
       * Used to trigger active listeners.
       */
      trigger(type: string): Promise<void>;
      /**
       * Used to generate a snapshot of the service worker internals.
       */
      snapshot(): Snapshot;
    }
  }
}
