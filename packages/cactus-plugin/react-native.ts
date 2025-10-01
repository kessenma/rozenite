export let useCactusDevTools: typeof import('./src/react-native/useCactusDevTools').useCactusDevTools;

const isWeb =
  typeof window !== 'undefined' && window.navigator.product !== 'ReactNative';
const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

if (isDev && !isWeb && !isServer) {
  useCactusDevTools =
    require('./src/react-native/useCactusDevTools').useCactusDevTools;
} else {
  useCactusDevTools = () => null;
}
