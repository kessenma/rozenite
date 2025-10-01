import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { useEffect } from 'react';
import type { CactusEventMap } from '../shared/messaging';

export interface UseCactusDevToolsOptions {
  /** Enable/disable dev tools (default: true in dev) */
  enabled?: boolean;
}

export const useCactusDevTools = (options: UseCactusDevToolsOptions = {}) => {
  const { enabled = process.env.NODE_ENV === 'development' } = options;
  const client = useRozeniteDevToolsClient();

  useEffect(() => {
    if (!enabled || !client) return;

    // Set up your Cactus integration here
    // This hook provides the client for sending events to DevTools
    // The actual event sending would happen in your app's Cactus usage

  }, [client, enabled]);

  return client;
};
