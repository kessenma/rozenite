export let useCactusDevTools: typeof import('./src/react-native/useCactusDevTools').useCactusDevTools;
export let postInspectorEvent: typeof import('./src/react-native/postInspectorEvent').postInspectorEvent;

const isWeb =
  typeof window !== 'undefined' && window.navigator.product !== 'ReactNative';
const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

if (isDev && !isWeb && !isServer) {
  useCactusDevTools =
    require('./src/react-native/useCactusDevTools').useCactusDevTools;
  postInspectorEvent =
    require('./src/react-native/postInspectorEvent').postInspectorEvent;
} else {
  useCactusDevTools = () => ({
    client: { subscribe: () => ({ unsubscribe: () => {} }) },
    postEvent: () => {}
  });
  postInspectorEvent = () => {};
}
