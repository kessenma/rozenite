// Temporary type declarations for @rozenite/plugin-bridge
// These should be removed once the official package is available

declare module '@rozenite/plugin-bridge' {
  export function useRozeniteDevToolsClient(): {
    subscribe: <T>(
      eventType: string,
      callback: (event: T) => void
    ) => {
      unsubscribe: () => void;
    };
  };
}
