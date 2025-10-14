import { LogEntry } from './mockLogs';

export type LogLevel = 'log' | 'warn' | 'error';
export type LogProvider = 'LLM' | 'RAG' | 'Embedding' | 'Unknown';

export interface LogEventData {
  level: LogLevel;
  provider: LogProvider;
  message: string;
  details?: Record<string, any>;
}

class LoggingService {
  private listeners: ((log: LogEntry) => void)[] = [];
  private logHistory: LogEntry[] = [];

  // Subscribe to log events
  subscribe(listener: (log: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Log an event
  log(data: LogEventData): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: data.level,
      provider: data.provider,
      message: data.message,
      details: data.details || {}
    };

    this.logHistory.push(logEntry);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logHistory];
  }

  // Clear all logs
  clearLogs(): void {
    this.logHistory = [];
  }

  // Convenience methods for different log levels
  info(provider: LogProvider, message: string, details?: Record<string, any>): void {
    this.log({ level: 'log', provider, message, details });
  }

  warn(provider: LogProvider, message: string, details?: Record<string, any>): void {
    this.log({ level: 'warn', provider, message, details });
  }

  error(provider: LogProvider, message: string, details?: Record<string, any>): void {
    this.log({ level: 'error', provider, message, details });
  }
}

// Global instance
export const loggingService = new LoggingService();

// Helper functions for specific event types
export const logModelEvent = {
  loading: (modelId: string, modelType: 'llm' | 'embedding') => {
    const provider = modelType === 'llm' ? 'LLM' : 'Embedding';
    loggingService.info(provider, `Loading ${modelType} model: ${modelId}`, { modelId, modelType });
  },
  loaded: (modelId: string, modelType: 'llm' | 'embedding', loadTime?: number) => {
    const provider = modelType === 'llm' ? 'LLM' : 'Embedding';
    loggingService.info(provider, `Successfully loaded ${modelType} model: ${modelId}`, { 
      modelId, 
      modelType, 
      loadTime: loadTime ? `${loadTime}ms` : undefined 
    });
  },
  failed: (modelId: string, modelType: 'llm' | 'embedding', error: string) => {
    const provider = modelType === 'llm' ? 'LLM' : 'Embedding';
    loggingService.error(provider, `Failed to load ${modelType} model: ${modelId}`, { 
      modelId, 
      modelType, 
      error 
    });
  },
  selected: (modelId: string, modelType: 'llm' | 'embedding') => {
    const provider = modelType === 'llm' ? 'LLM' : 'Embedding';
    loggingService.info(provider, `Selected ${modelType} model: ${modelId}`, { modelId, modelType });
  }
};

export const logLLMEvent = {
  messageStart: (messageId: string, prompt: string) => {
    loggingService.info('LLM', `Starting LLM generation for message: ${messageId}`, { 
      messageId, 
      promptLength: prompt.length 
    });
  },
  messageComplete: (messageId: string, responseLength: number, generationTime: number, tokensUsed?: number) => {
    loggingService.info('LLM', `Completed LLM generation for message: ${messageId}`, { 
      messageId, 
      responseLength, 
      generationTime: `${generationTime}ms`,
      tokensUsed 
    });
  },
  messageError: (messageId: string, error: string) => {
    loggingService.error('LLM', `LLM generation failed for message: ${messageId}`, { 
      messageId, 
      error 
    });
  },
  contextUpdate: (contextLength: number, documentsAttached: number) => {
    loggingService.info('LLM', `Context updated`, { 
      contextLength, 
      documentsAttached 
    });
  }
};

export const logRAGEvent = {
  documentAttached: (documentId: string, documentName: string, chunkCount: number) => {
    loggingService.info('RAG', `Document attached: ${documentName}`, { 
      documentId, 
      documentName, 
      chunkCount 
    });
  },
  documentRemoved: (documentId: string, documentName: string) => {
    loggingService.info('RAG', `Document removed: ${documentName}`, { 
      documentId, 
      documentName 
    });
  },
  embeddingGenerated: (documentId: string, chunkCount: number, processingTime: number) => {
    loggingService.info('Embedding', `Generated embeddings for document`, { 
      documentId, 
      chunkCount, 
      processingTime: `${processingTime}ms` 
    });
  }
};