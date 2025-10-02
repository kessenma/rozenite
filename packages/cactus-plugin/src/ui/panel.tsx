import { useEffect, useMemo, useState } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { InspectorEvent } from '../shared/messaging';

export default function CactusPanel() {
  const client = useRozeniteDevToolsClient();
  const [events, setEvents] = useState<InspectorEvent[]>([]);

  useEffect(() => {
    if (!client) return;

    // Subscribe to our custom event channel
    const subscription = client.subscribe<InspectorEvent>(
      'cactus-inspector:event',
      (event) => {
        setEvents((prev) => [...prev, event]);
      }
    );

    return () => subscription.unsubscribe();
  }, [client]);

  // Group by requestId into sessions
  const sessions = useMemo(() => {
    const m = new Map<string, InspectorEvent[]>();
    for (const e of events) {
      const id = 'requestId' in e ? e.requestId : 'unknown';
      if (!m.has(id)) m.set(id, []);
      m.get(id)?.push(e);
    }
    return Array.from(m.entries());
  }, [events]);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: '#e5e5e5', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '12px 16px', 
        borderBottom: '1px solid #333', 
        backgroundColor: '#2a2a2a' 
      }}>
        <span style={{ fontSize: '18px' }}>🌵</span>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e5e5' }}>
          Cactus / RAG Inspector
        </span>
        <div style={{ flex: 1 }} />
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Events
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sessions.length === 0 ? (
          <WelcomePage />
        ) : (
          <div style={{ padding: '16px' }}>
            {sessions.map(([rid, evts]) => (
              <div
                key={rid}
                style={{ 
                  border: '1px solid #444', 
                  margin: '12px 0', 
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a'
                }}
              >
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#333',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderBottom: '1px solid #444'
                }}>
                  <strong style={{ color: '#60a5fa' }}>Request ID:</strong> {rid}
                </div>
                <div style={{ padding: '16px' }}>
                  {evts.map((e, i) => (
                    <EventRow key={i} e={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%', 
      textAlign: 'center',
      padding: '32px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌵</div>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#e5e5e5', 
        marginBottom: '12px',
        margin: 0
      }}>
        Welcome to Cactus RAG Inspector
      </h2>
      <p style={{ 
        color: '#a3a3a3', 
        fontSize: '14px', 
        marginBottom: '32px',
        maxWidth: '400px',
        lineHeight: '1.5',
        margin: '12px 0 32px 0'
      }}>
        Monitor your RAG (Retrieval-Augmented Generation) operations in real-time. 
        Events will appear here when your app performs LLM calls or document retrieval.
      </p>
      
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        border: '1px solid #444', 
        borderRadius: '8px', 
        padding: '20px',
        maxWidth: '500px',
        textAlign: 'left'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '500', 
          color: '#e5e5e5', 
          marginBottom: '12px',
          margin: '0 0 12px 0'
        }}>
          How to use:
        </h3>
        <ul style={{ 
          color: '#a3a3a3', 
          fontSize: '14px', 
          lineHeight: '1.6',
          paddingLeft: '20px',
          margin: 0
        }}>
          <li>Use <code style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '13px'
          }}>postInspectorEvent()</code> in your React Native app</li>
          <li>Trigger LLM calls or RAG operations</li>
          <li>Watch events appear here in real-time</li>
          <li>Monitor performance, sources, and responses</li>
        </ul>
      </div>
    </div>
  );
}

function EventRow({ e }: { e: InspectorEvent }) {
  const eventStyle = {
    marginBottom: '12px',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    lineHeight: '1.4'
  };

  switch (e.kind) {
    case 'llm:start':
      return (
        <div style={{ ...eventStyle, backgroundColor: '#1e3a2e', border: '1px solid #22c55e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🟢</span>
            <strong style={{ color: '#22c55e' }}>LLM Start</strong>
            <code style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '13px',
              color: '#e5e5e5'
            }}>
              {e.model}
            </code>
          </div>
        </div>
      );
    case 'llm:chunk':
      return (
        <div style={{ ...eventStyle, backgroundColor: '#1e293b', border: '1px solid #64748b' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>
            💬 LLM Response Chunk
          </div>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            margin: 0,
            color: '#e5e5e5',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace'
          }}>
            {e.delta}
          </pre>
        </div>
      );
    case 'llm:end':
      return (
        <div style={{ ...eventStyle, backgroundColor: '#1e3a2e', border: '1px solid #22c55e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span>
            <strong style={{ color: '#22c55e' }}>LLM Complete</strong>
            <span style={{ color: '#a3a3a3' }}>—</span>
            <span style={{ color: '#60a5fa' }}>{e.latencyMs} ms</span>
          </div>
        </div>
      );
    case 'rag:retrieve':
      return (
        <div style={{ ...eventStyle, backgroundColor: '#2d1b69', border: '1px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span>📚</span>
            <strong style={{ color: '#8b5cf6' }}>Document Retrieval</strong>
            <span style={{ color: '#a3a3a3' }}>—</span>
            <span style={{ color: '#60a5fa' }}>{e.k} docs in {e.latencyMs.toFixed(0)} ms</span>
          </div>
          {e.sources.length > 0 && (
            <div>
              <div style={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '8px' }}>
                Top {Math.min(5, e.sources.length)} results:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {e.sources.slice(0, 5).map((s) => (
                  <li key={s.id} style={{ marginBottom: '4px', color: '#e5e5e5' }}>
                    <code style={{ 
                      backgroundColor: '#1a1a1a', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#fbbf24',
                      marginRight: '8px'
                    }}>
                      {s.score?.toFixed(3)}
                    </code>
                    <span style={{ fontSize: '13px' }}>{s.title ?? s.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    case 'llm:error':
      return (
        <div style={{ ...eventStyle, backgroundColor: '#3f1e1e', border: '1px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❌</span>
            <strong style={{ color: '#dc2626' }}>Error</strong>
            <span style={{ color: '#e5e5e5' }}>{e.message}</span>
          </div>
        </div>
      );
  }
}
