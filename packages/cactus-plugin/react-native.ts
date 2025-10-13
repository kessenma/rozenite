export let useCactusDevTools: typeof import('./src/react-native/useCactusDevTools').useCactusDevTools;
export let postInspectorEvent: typeof import('./src/react-native/postInspectorEvent').postInspectorEvent;

if (process.env.NODE_ENV !== 'production') {
  useCactusDevTools =
    require('./src/react-native/useCactusDevTools').useCactusDevTools;
  postInspectorEvent =
    require('./src/react-native/postInspectorEvent').postInspectorEvent;
} else {
  useCactusDevTools = () => ({ subscribe: () => ({ unsubscribe: () => {} }) });
  postInspectorEvent = () => {};
}
