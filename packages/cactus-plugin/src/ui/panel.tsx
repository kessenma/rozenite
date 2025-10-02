import { useEffect, useMemo, useState } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { InspectorEvent } from '../shared/messaging';

export function CactusPanel() {
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

  return (
    <div style={{ padding: 12 }}>
      <h2>Cactus Inspector</h2>
      {sessions.map(([rid, evts]) => (
        <div
          key={rid}
          style={{ border: '1px solid #ddd', margin: '8px 0', borderRadius: 8 }}
        >
          <div style={{ padding: 8, background: '#fafafa' }}>
            <strong>Request</strong> {rid}
          </div>
          <div style={{ padding: 8 }}>
            {evts.map((e, i) => (
              <EventRow key={i} e={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventRow({ e }: { e: InspectorEvent }) {
  switch (e.kind) {
    case 'llm:start':
      return (
        <div>
          🟢 LLM start — <code>{e.model}</code>
        </div>
      );
    case 'llm:chunk':
      return <pre style={{ whiteSpace: 'pre-wrap' }}>{e.delta}</pre>;
    case 'llm:end':
      return <div>✅ LLM end — {e.latencyMs} ms</div>;
    case 'rag:retrieve':
      return (
        <div>
          📚 Retrieved {e.k} docs in {e.latencyMs.toFixed(0)} ms
          <ul>
            {e.sources.slice(0, 5).map((s) => (
              <li key={s.id}>
                <code>{s.score?.toFixed(3)}</code> — {s.title ?? s.id}
              </li>
            ))}
          </ul>
        </div>
      );
    case 'llm:error':
      return <div>❌ {e.message}</div>;
  }
}
