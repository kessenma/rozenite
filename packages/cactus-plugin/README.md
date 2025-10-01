# @rozenite/cactus-plugin

A Rozenite plugin for analyzing Cactus LLM logic and RAG operations in React Native development.

This plugin provides a DevTools panel that streams real-time events from your Cactus-powered RAG chatbot, allowing you to inspect:

- LLM requests and responses
- Token streaming
- RAG retrieval results and scores
- Latency and error tracking
- Per-request timelines

## Installation

Install in your React Native app along with Rozenite dev tools:

```bash
npm install @rozenite/cactus-plugin
```

## Usage

### In your app (dev only)

Wrap your Cactus calls with event emission to feed data to the plugin:

```typescript
import { postInspectorEvent } from '@rozenite/cactus-plugin';

// Example: Wrap a Cactus completion call
async function withLlmInspection(
  args: { model: string; params: any; prompt: string; requestId: string },
  run: (onChunk: (delta: string) => void) => Promise<any>
) {
  const start = Date.now();
  postInspectorEvent({
    kind: 'llm:start',
    requestId: args.requestId,
    model: args.model,
    params: args.params,
    promptPreview: args.prompt.slice(0, 500),
    time: start,
  });

  // ... run your Cactus logic and emit chunk/end/error events
}

// For RAG retrieval:
postInspectorEvent({
  kind: 'rag:retrieve',
  requestId,
  query,
  k: hits.length,
  sources: hits.map((h) => ({
    id: h.id,
    score: h.score,
    uri: h.uri,
    title: h.metadata?.title,
    preview: h.text?.slice(0, 240),
  })),
  latencyMs: performance.now() - t0,
  time: Date.now(),
});
```

### In React Native DevTools

Open React Native DevTools, and you'll see the "Cactus / RAG" panel. It will automatically display live events from your app when running in development mode.

## Development

```bash
npm install
npm run dev  # Watch mode for building
npm run build  # Production build
```

## License

MIT

## Contributing

Contributions welcome! Please check the issues and submit PRs.
