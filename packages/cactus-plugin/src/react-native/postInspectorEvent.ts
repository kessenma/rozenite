import { getRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { InspectorEvent } from '../shared/types';

let devToolsClient: any = null;

// Initialize the client once
const initializeClient = async () => {
  if (!devToolsClient) {
    devToolsClient = await getRozeniteDevToolsClient('cactus-rozenite');
  }
  return devToolsClient;
};

export const postInspectorEvent = (event: InspectorEvent): void => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  initializeClient()
    .then(client => {
      if (client) {
        // Send the event to the DevTools panel
        client.send?.('cactus-inspector:event', event);
      }
    })
    .catch(error => {
      console.warn('Rozenite Cactus Plugin: Failed to initialize client:', error);
    });
};
