import type { InspectorEvent } from './types';

// Export types for app-side usage
export * from './types';

// This function safely posts messages only when Rozenite DevTools is available.
// App code should import this from the plugin package and call it to emit events.
export function postInspectorEvent(evt: InspectorEvent): void {
  // Rozenite's bridge injects a client in dev; keep this defensive.
  // @ts-ignore
  const client = globalThis.__ROZENITE_DEVTOOLS_CLIENT__;
  if (client && __DEV__) {
    client.send('cactus-plugin:event', evt);
  }
}
