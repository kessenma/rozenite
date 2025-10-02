import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { InspectorEvent } from '../shared/types';

let devToolsClient: any = null;

// Initialize the client once
const initializeClient = () => {
  if (!devToolsClient) {
    devToolsClient = useRozeniteDevToolsClient();
  }
  return devToolsClient;
};

export const postInspectorEvent = (event: InspectorEvent): void => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const client = initializeClient();
    if (client) {
      // Send the event to the DevTools panel
      client.send?.('cactus-inspector:event', event);
    }
  } catch (error) {
    console.warn('Rozenite Cactus Plugin: Failed to post inspector event:', error);
  }
};
