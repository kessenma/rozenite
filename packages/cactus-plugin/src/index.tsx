import type { InspectorEvent } from './shared/types';

// Export types for app-side usage
export * from './shared/types';

// Export integration functions for app-side logging
export * from './integration';

// This function safely posts messages only when Rozenite DevTools is available.
// App code should import this from the plugin package and call it to emit events.
export function postInspectorEvent(evt: InspectorEvent): void {
  // Rozenite's bridge injects a client in dev; keep this defensive.
  // @ts-expect-error -- Global injected by Rozenite in development
  const client = globalThis.__ROZENITE_DEVTOOLS_CLIENT__;
  if (client && __DEV__) {
    client.send('cactus-plugin:event', evt);
  }
}
