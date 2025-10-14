<h1 align="center">🌵 Cactus Plugin for Rozenite</h1>
<p align="center">Real-time LLM inspection and RAG monitoring for Cactus-powered React Native apps</p>

<p align="center">
  <em>Built with ❤️ for the Cactus & Rozenite ecosystem</em>
</p>

[![mit licence][license-badge]][license] [![npm downloads][npm-downloads-badge]][npm-downloads] [![Chat][chat-badge]][chat] [![PRs Welcome][prs-welcome-badge]][prs-welcome]

The Rozenite Cactus Plugin provides real-time LLM inspection + monitoring for Cactus-powered chatbots within your React Native DevTools environment. Track LLM + Embedding requests, token streaming, RAG retrievals, and performance metrics in real-time.

Learn more about [Cactus here](https://cactuscompute.com)! 

## Features

- **Real-time LLM Inspection**: Monitor Cactus LLM requests, responses, and streaming tokens
- **RAG Operations Tracking**: View retrieval-augmented generation operations with scores and sources
- **Performance Metrics**: Track latency, token counts, and operation timing
- **Event-Driven Architecture**: Stream events from your Cactus integrations automatically
- **React Native DevTools Integration**: Seamless integration with existing RN DevTools workflow
- **Type-Safe Event Handling**: Full TypeScript support for all event types and callbacks

### 🆕 Enhanced Logging Features

- **📜 All Logs Tab**: Chronological view of all LLM, RAG, and embedding operations
- **📋 Advanced Export Options**: Export logs to Markdown with custom file locations
- **🎯 Provider-Specific Filtering**: Separate tabs for LLM, RAG, and Embedding providers
- **⚠️ Error & Warning Filters**: Quick access to errors and warnings across all providers
- **💾 Persistent Settings**: Custom export locations are saved between DevTools sessions
- **🔧 Built-in Troubleshooting**: Interactive help guide for common setup issues
- **📊 Live Status Indicator**: Real-time log count and capture status in the header

## Installation

Install the Cactus plugin as a dependency:

```bash
npm install cactus-rozenite
```

**Note**: This plugin requires Cactus libraries as peer dependencies. Make sure you have Cactus React installed:

```bash
npm install cactus-react
```

## Quick Start

### 1. Install the Plugin

```bash
npm install cactus-rozenite
```

### 2. Integrate with Your App

Add Cactus event emission to your React Native app - wrap your Cactus operations:

```typescript
import { postInspectorEvent } from 'cactus-rozenite';
import { CactusAgent } from 'cactus-react';

// Example: Initialize Cactus with event monitoring
const cactusAgent = new CactusAgent({...});

// Wrap your chat/rag operations
async function monitoredQuery(query: string, conversationId: string) {
  const requestId = `${conversationId}-${Date.now()}`;

  // Emit start event
  postInspectorEvent({
    kind: 'llm:start',
    requestId,
    model: cactusAgent.getModel(),
    params: cactusAgent.getConfig(),
    promptPreview: query.slice(0, 500),
    time: Date.now(),
  });

  try {
    const result = await cactusAgent.query(query);

    // Emit successful completion
    postInspectorEvent({
      kind: 'llm:end',
      requestId,
      totalTokens: result.usage?.total_tokens,
      latencyMs: Date.now() - (result.startTime || 0),
      finishReason: result.finish_reason,
      time: Date.now(),
    });

    // Emit RAG retrieval if available
    if (result.sources) {
      postInspectorEvent({
        kind: 'rag:retrieve',
        requestId,
        query,
        k: result.sources.length,
        sources: result.sources.map(s => ({
          id: s.id,
          title: s.metadata?.title,
          score: s.score,
          uri: s.metadata?.uri,
          preview: s.text?.slice(0, 240),
        })),
        latencyMs: result.searchLatency || 0,
        time: Date.now(),
      });
    }

    return result;
  } catch (error) {
    // Emit error event
    postInspectorEvent({
      kind: 'llm:error',
      requestId,
      message: String(error),
      time: Date.now(),
    });
    throw error;
  }
}
```

### 3. Access DevTools

Start your development server and open React Native DevTools. You'll find the "Cactus / RAG" panel displaying live LLM and RAG event streams.

## Real Application Integration

To connect the plugin to your actual Cactus application and see real-time events instead of mock data, follow these integration steps:

### Step 1: Import Event Monitoring

Add the monitoring utilities to your LLM interface components:

```typescript
// In your chat/LLM interface component
import { withLLMMonitoring, postInspectorEvent } from 'cactus-rozenite';
```

### Step 2: Wrap LLM Operations

Wrap your existing Cactus LLM calls with monitoring:

```typescript
// Before: Direct LLM call
const response = await generateResponse(messages, model);

// After: Monitored LLM call
const response = await withLLMMonitoring(
  () => generateResponse(messages, model),
  {
    requestId: `chat-${Date.now()}`,
    model: model.name,
    promptPreview: messages[messages.length - 1]?.content?.slice(0, 500),
  }
);
```

### Step 3: Add RAG Event Tracking

For RAG operations, emit retrieval events when documents are used:

```typescript
// After successful RAG response generation
if (attachedDocuments?.length > 0) {
  postInspectorEvent({
    kind: 'rag:retrieve',
    requestId: `rag-${Date.now()}`,
    query: userMessage,
    k: attachedDocuments.length,
    sources: attachedDocuments.map(doc => ({
      id: doc.id,
      title: doc.name,
      preview: doc.chunks?.[0]?.slice(0, 200) || '',
      score: 1.0 // Use actual relevance scores if available
    })),
    latencyMs: responseTime,
    time: Date.now(),
  });
}
```

### Step 4: Monitor Embedding Operations

Track embedding generation for document processing:

```typescript
// When processing documents for embeddings
const embeddingStart = Date.now();
try {
  const embeddings = await generateEmbeddings(documents);
  
  postInspectorEvent({
    kind: 'embedding:end',
    requestId: `embed-${Date.now()}`,
    inputTokens: documents.reduce((sum, doc) => sum + doc.length, 0),
    latencyMs: Date.now() - embeddingStart,
    time: Date.now(),
  });
} catch (error) {
  postInspectorEvent({
    kind: 'llm:error',
    requestId: `embed-error-${Date.now()}`,
    message: `Embedding failed: ${error.message}`,
    time: Date.now(),
  });
}
```

### Step 5: Conditional Tab Display

The plugin automatically shows RAG and Embedding tabs only when those providers are actively used. Tabs will appear as soon as the first event of each type is detected:

- **RAG Tab**: Appears when `rag:retrieve` events are emitted
- **Embedding Tab**: Appears when `embedding:start` or `embedding:end` events are emitted
- **LLM Tab**: Always visible (default provider)

### Step 6: Verify Integration

Test your integration by:

1. **Triggering LLM Operations**: Send messages through your chat interface
2. **Using RAG Features**: Attach documents and ask questions about them
3. **Processing Documents**: Upload and embed new documents
4. **Checking DevTools**: Verify events appear in real-time in the Cactus panel

### Example: Complete Chat Interface Integration

Here's a complete example of integrating the plugin with a chat interface:

```typescript
import React from 'react';
import { withLLMMonitoring, postInspectorEvent } from 'cactus-rozenite';
import { useCactus } from 'cactus-react';

export function ChatInterface() {
  const { generateResponse, generateRAGResponse } = useCactus();

  const handleSendMessage = async (message: string, attachedDocs: Document[]) => {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (attachedDocs.length > 0) {
        // RAG-enabled response with monitoring
        response = await withLLMMonitoring(
          () => generateRAGResponse(message, attachedDocs),
          {
            requestId: `rag-chat-${Date.now()}`,
            model: 'cactus-rag-model',
            promptPreview: message.slice(0, 500),
          }
        );
        
        // Emit RAG retrieval event
        const generationTime = Date.now() - startTime;
        postInspectorEvent({
          kind: 'rag:retrieve',
          requestId: `rag-${Date.now()}`,
          query: message,
          k: attachedDocs.length,
          sources: attachedDocs.map(doc => ({
            id: doc.id,
            title: doc.name,
            preview: doc.content?.slice(0, 200) || '',
            score: 1.0
          })),
          latencyMs: generationTime,
          time: Date.now(),
        });
      } else {
        // Standard LLM response with monitoring
        response = await withLLMMonitoring(
          () => generateResponse(message),
          {
            requestId: `chat-${Date.now()}`,
            model: 'cactus-model',
            promptPreview: message.slice(0, 500),
          }
        );
      }
      
      return response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  };

  // ... rest of component
}
```

## DevTools Interface

The Cactus panel provides a comprehensive interface for monitoring your LLM operations:

### 📊 Overview Tab
- **Live Status**: Shows total log count and real-time capture status
- **Quick Stats**: Summary of operations by provider type
- **Recent Activity**: Latest log entries across all providers

### 📜 All Logs Tab
- **Chronological Feed**: All logs sorted by timestamp (newest first)
- **Universal Actions**: Copy, export, and clear operations for all logs
- **Provider Filtering**: Quick access to provider-specific actions

### 🤖 Provider-Specific Tabs
- **LLM Provider**: Monitor language model requests, responses, and streaming
- **RAG Helper**: Track retrieval operations, sources, and similarity scores  
- **Embedding Provider**: View embedding generation and vector operations

### ❓ Help Tab
- **Troubleshooting Guide**: Step-by-step solutions for common setup issues
- **Integration Examples**: Code snippets for proper event emission
- **Verification Checklist**: Ensure your plugin is configured correctly

### 🛠️ Action Buttons

Each tab includes powerful action buttons:

- **Copy All**: Copy all logs to clipboard in formatted text
- **Export MD**: Export logs to Markdown file with timestamps
- **Custom Export**: Choose custom location for exported files
- **Set Location**: Configure persistent export directory
- **Copy Errors**: Copy only error-level logs
- **Copy Errors + Warnings**: Copy errors and warnings together
- **Clear All**: Remove all logs from the current view

### 💾 Persistent Settings

Your preferences are automatically saved:
- **Custom Export Location**: Remembers your preferred export directory
- **Tab Selection**: Returns to your last active tab
- **Filter Preferences**: Maintains your log filtering choices

## Advanced Integration

### Streaming Token Events

For token-by-token streaming, wrap your streaming handlers:

```typescript
// Create a streaming wrapper
function withStreamingInspection(requestId: string) {
  let chunkCount = 0;
  let fullResponse = '';

  return (token: string) => {
    chunkCount++;
    fullResponse += token;

    postInspectorEvent({
      kind: 'llm:chunk',
      requestId,
      delta: token,
      time: Date.now(),
    });
  };
}

// Use with Cactus streaming
const requestId = `stream-${Date.now()}`;
cactusAgent.streamingQuery(query, withStreamingInspection(requestId));
```

### Error Handling

Always wrap operations in try/catch to capture errors:

```typescript
try {
  await cactusAgent.embedDocuments(documents);
} catch (error) {
  postInspectorEvent({
    kind: 'llm:error',
    requestId: 'embed-operation',
    message: `Embedding failed: ${error.message}`,
    time: Date.now(),
  });
}
```

## Event Types

The plugin tracks these Cactus operations:

- **`llm:start`**: Request initialization with model, parameters, and prompt preview
- **`llm:chunk`**: Streaming token deltas (if streaming is enabled)
- **`llm:end`**: Request completion with latency, token counts, and finish reason
- **`llm:error`**: Failed requests with error messages
- **`rag:retrieve`**: RAG source retrievals with similarity scores and document metadata

## Troubleshooting

### Panel Shows But No Logs Appear

If the Cactus panel is visible but no logs are captured:

1. **Check Event Integration**: Ensure you've added `postInspectorEvent` calls to your Cactus operations
2. **Verify Development Mode**: Plugin only works when `__DEV__ === true`
3. **Test DevTools Connection**: Confirm React Native DevTools is properly connected
4. **Trigger Events**: Interact with your LLM/RAG features to generate events

### Plugin Installed But Panel Missing

If you don't see the Cactus panel in DevTools:

1. **Restart Development Server**: Stop and restart your React Native dev server
2. **Refresh DevTools**: Close and reopen React Native DevTools
3. **Check Installation**: Verify `cactus-rozenite` is in your package.json dependencies
4. **Version Compatibility**: Ensure you're using a compatible Rozenite DevTools version

### Quick Integration Check

```typescript
import { postInspectorEvent } from 'cactus-rozenite';

// Test event emission
postInspectorEvent({
  kind: 'llm:start',
  requestId: 'test-123',
  model: 'test-model',
  promptPreview: 'Hello, world!',
  time: Date.now(),
});
```

If this test event appears in the panel, your integration is working correctly.

## Data Privacy

The plugin automatically:
- **Truncates prompts** to first 500 characters to avoid sensitive data exposure
- **Limits source previews** to 240 characters per document
- **Only runs in development builds** (__DEV__ mode)
- **Gates all operations** behind development checks

## Usage Examples

### React Hook Integration

For React components, you can create custom hooks:

```typescript
import { useCallback } from 'react';
import { useCactusDevTools, postInspectorEvent } from 'cactus-rozenite';

function useMonitoredCactus() {
  // Initialize DevTools (optional)
  useCactusDevTools();

  const monitoredQuery = useCallback(async (query: string) => {
    const requestId = `query-${Date.now()}`;

    postInspectorEvent({
      kind: 'llm:start',
      requestId,
      model: 'cactus-model',
      params: { temperature: 0.7 },
      promptPreview: query,
      time: Date.now(),
    });

    return cactusAgent.query(query).finally(() => {
      // Emit end/error events here
    });
  }, []);

  return { monitoredQuery };
}
```

### Performance Monitoring

Track performance bottlenecks in your RAG pipeline:

```typescript
// Measure retrieval performance
const retrieveStart = performance.now();
const sources = await vectorIndex.search(query, { k: 5 });
const latencyMs = performance.now() - retrieveStart;

postInspectorEvent({
  kind: 'rag:retrieve',
  requestId,
  query,
  k: sources.length,
  sources: sources.map(s => ({
    id: s.id,
    score: s.score,
    title: s.metadata?.title,
    preview: s.text?.slice(0, 100),
  })),
  latencyMs,
  time: Date.now(),
});
```

## Made with ❤️ for the Cactus + Rozenite Ecosystem

`cactus-rozenite` is an open-source project that enhances the Cactus experience for React Native developers.

Contribute to the ongoing evolution of local LLM tooling!

## Links

- [Cactus Organization](https://github.com/cactus-compute/)
- [Cactus Core Library](https://github.com/cactus-compute/cactus)
- [Cactus React Integration](https://github.com/cactus-compute/cactus-react)
- [Rozenite DevTools](https://github.com/callstackincubator/rozenite)

[license-badge]: https://img.shields.io/npm/l/rozenite?style=for-the-badge
[license]: https://github.com/callstackincubator/rozenite/blob/main/LICENSE
[npm-downloads-badge]: https://img.shields.io/npm/dm/rozenite?style=for-the-badge
[npm-downloads]: https://www.npmjs.com/package/cactus-rozenite
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-welcome]: https://github.com/callstackincubator/rozenite/blob/main/CONTRIBUTING.md
[chat-badge]: https://img.shields.io/discord/426714625279524876.svg?style=for-the-badge
[chat]: https://discord.gg/xgGt7KAjxv

#### License

By contributing to Rozenite, you agree that your contributions will be licensed under its MIT license.
