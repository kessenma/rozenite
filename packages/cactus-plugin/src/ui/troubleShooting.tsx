export const TroubleshootingGuide = () => (
  <div style={{ padding: '16px', color: '#e5e5e5' }}>
    <h3 style={{ color: '#22c55e', marginBottom: '16px', fontSize: '16px' }}>
      🔧 Troubleshooting Guide
    </h3>
    
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ color: '#f59e0b', marginBottom: '8px', fontSize: '14px' }}>
        ❌ Panel shows but no logs appear
      </h4>
      <div style={{ backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
          <strong>Problem:</strong> Cactus panel is visible in DevTools but no logs are captured.
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
          <strong>Solutions:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '13px' }}>
          <li>Ensure you've added <code style={{ backgroundColor: '#1a1a1a', padding: '2px 4px', borderRadius: '3px' }}>postInspectorEvent</code> calls to your Cactus operations</li>
          <li>Check that your app is running in development mode (<code style={{ backgroundColor: '#1a1a1a', padding: '2px 4px', borderRadius: '3px' }}>__DEV__ === true</code>)</li>
          <li>Verify React Native DevTools is properly connected to your app</li>
          <li>Try interacting with your LLM/RAG features to generate events</li>
        </ul>
      </div>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ color: '#f59e0b', marginBottom: '8px', fontSize: '14px' }}>
        ⚠️ Plugin installed but panel missing
      </h4>
      <div style={{ backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
          <strong>Problem:</strong> Installed cactus-rozenite but don't see the panel in DevTools.
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
          <strong>Solutions:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '13px' }}>
          <li>Restart your React Native development server</li>
          <li>Close and reopen React Native DevTools</li>
          <li>Check that <code style={{ backgroundColor: '#1a1a1a', padding: '2px 4px', borderRadius: '3px' }}>cactus-rozenite</code> is listed in your package.json dependencies</li>
          <li>Ensure you're using a compatible version of Rozenite DevTools</li>
        </ul>
      </div>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ color: '#f59e0b', marginBottom: '8px', fontSize: '14px' }}>
        🔌 Integration Setup
      </h4>
      <div style={{ backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
          <strong>Quick Integration Example:</strong>
        </p>
        <pre style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '12px', 
          borderRadius: '4px', 
          fontSize: '12px', 
          overflow: 'auto',
          margin: '8px 0'
        }}>
{`import { postInspectorEvent } from 'cactus-rozenite';

// Wrap your LLM calls
async function monitoredQuery(query: string) {
  const requestId = \`req-\${Date.now()}\`;
  
  postInspectorEvent({
    kind: 'llm:start',
    requestId,
    model: 'your-model',
    promptPreview: query,
    time: Date.now(),
  });

  try {
    const result = await yourLLMCall(query);
    
    postInspectorEvent({
      kind: 'llm:end',
      requestId,
      totalTokens: result.tokens,
      latencyMs: result.latency,
      time: Date.now(),
    });
    
    return result;
  } catch (error) {
    postInspectorEvent({
      kind: 'llm:error',
      requestId,
      message: error.message,
      time: Date.now(),
    });
    throw error;
  }
}`}
        </pre>
      </div>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ color: '#22c55e', marginBottom: '8px', fontSize: '14px' }}>
        ✅ Verification Checklist
      </h4>
      <div style={{ backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '13px' }}>
          <li>✓ <code style={{ backgroundColor: '#1a1a1a', padding: '2px 4px', borderRadius: '3px' }}>cactus-rozenite</code> installed in package.json</li>
          <li>✓ React Native DevTools connected and running</li>
          <li>✓ App running in development mode</li>
          <li>✓ <code style={{ backgroundColor: '#1a1a1a', padding: '2px 4px', borderRadius: '3px' }}>postInspectorEvent</code> calls added to LLM operations</li>
          <li>✓ Cactus panel visible in DevTools tabs</li>
          <li>✓ Logs appearing when interacting with LLM features</li>
        </ul>
      </div>
    </div>

    <div style={{ 
      backgroundColor: '#1e40af', 
      padding: '12px', 
      borderRadius: '6px',
      border: '1px solid #3b82f6'
    }}>
      <p style={{ margin: '0', fontSize: '13px' }}>
        <strong>💡 Need more help?</strong> Check the README for detailed integration examples and visit the Cactus documentation for advanced usage patterns.
      </p>
    </div>
  </div>
);