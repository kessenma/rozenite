// Cactus Rozenite Plugin Entry Point - CommonJS compatible
// This file provides the main exports for the package

const isWeb = typeof window !== 'undefined' && window.navigator.product !== 'ReactNative';
const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

let useCactusDevTools;
let postInspectorEvent;

if (isDev && !isWeb && !isServer) {
  // In development React Native environment, use the actual imported functions
  // Note: For npm packages, we'll simulate the imports here
  useCactusDevTools = function(options = {}) {
    const { enabled = process.env.NODE_ENV !== 'production' } = options;

    // Initialize plugin bridge client
    let client;
    try {
      // This would use the actual plugin bridge in a real environment
      const { useRozeniteDevToolsClient } = require('@rozenite/plugin-bridge');
      if (useRozeniteDevToolsClient) {
        client = useRozeniteDevToolsClient();
      }
    } catch (e) {
      // Fallback if plugin bridge is not available
      client = null;
    }

    return {
      client: client,
      postEvent: postInspectorEvent
    };
  };

  postInspectorEvent = function(event) {
    // Post event to Rozenite DevTools
    try {
      const client = typeof globalThis !== 'undefined' &&
                    globalThis.__ROZENITE_DEVTOOLS_CLIENT__;
      if (client) {
        client.send('cactus-inspector:event', event);
      }
    } catch (error) {
      console.warn('Rozenite Cactus Plugin: Failed to post event:', error);
    }
  };
} else {
  // In production or other environments, provide no-op functions
  useCactusDevTools = function() {
    return {
      client: { subscribe: () => ({ unsubscribe: () => {} }) },
      postEvent: () => {}
    };
  };

  postInspectorEvent = function() {};
}

// Export functions
module.exports.useCactusDevTools = useCactusDevTools;
module.exports.postInspectorEvent = postInspectorEvent;

// Support both CommonJS and ES modules
if (typeof exports !== 'undefined') {
  exports.useCactusDevTools = useCactusDevTools;
  exports.postInspectorEvent = postInspectorEvent;
}

// ES module support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { useCactusDevTools, postInspectorEvent };
}
