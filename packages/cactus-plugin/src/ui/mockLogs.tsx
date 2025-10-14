interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'warn' | 'error';
  provider: 'LLM' | 'RAG' | 'Embedding' | 'Unknown';
  message: string;
  details?: any;
}

export function generateMockLogs(): LogEntry[] {
  return [
    {
      id: '1',
      timestamp: new Date(),
      level: 'log',
      provider: 'LLM',
      message: '🔄 CactusProvider: Initializing LLM model with path: /path/to/model.gguf',
      details: { modelPath: '/path/to/model.gguf', n_ctx: 512 }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5000),
      level: 'log',
      provider: 'RAG',
      message: '🎯 RAG: Attempting vector-based retrieval for relevant chunks',
      details: { documentsCount: 3, maxChunks: 10 }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10000),
      level: 'warn',
      provider: 'Embedding',
      message: '⚠️ CactusEmbeddingProvider: LLM provider is currently active, this may cause conflicts',
      details: { globalState: 'llm_active' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 15000),
      level: 'log',
      provider: 'RAG',
      message: '✅ RAG: Using vector-based retrieval for chunk selection',
      details: { selectedChunks: 8, queryType: 'factual' }
    }
  ];
}

export type { LogEntry };