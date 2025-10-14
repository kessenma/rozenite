// Integration hooks for the main app to send events to the cactus plugin
import { loggingService, logModelEvent, logLLMEvent, logRAGEvent } from '../ui/loggingService';

// Export the logging service and helper functions for use in the main app
export { loggingService, logModelEvent, logLLMEvent, logRAGEvent };

// Hook for model store integration
export const useCactusModelLogging = () => {
  return {
    logModelLoading: (modelId: string, modelType: 'llm' | 'embedding') => {
      logModelEvent.loading(modelId, modelType);
    },
    logModelLoaded: (modelId: string, modelType: 'llm' | 'embedding', loadTime?: number) => {
      logModelEvent.loaded(modelId, modelType, loadTime);
    },
    logModelFailed: (modelId: string, modelType: 'llm' | 'embedding', error: string) => {
      logModelEvent.failed(modelId, modelType, error);
    },
    logModelSelected: (modelId: string, modelType: 'llm' | 'embedding') => {
      logModelEvent.selected(modelId, modelType);
    }
  };
};

// Hook for LLM chat interface integration
export const useCactusLLMLogging = () => {
  return {
    logMessageStart: (messageId: string, prompt: string) => {
      logLLMEvent.messageStart(messageId, prompt);
    },
    logMessageComplete: (messageId: string, responseLength: number, generationTime: number, tokensUsed?: number) => {
      logLLMEvent.messageComplete(messageId, responseLength, generationTime, tokensUsed);
    },
    logMessageError: (messageId: string, error: string) => {
      logLLMEvent.messageError(messageId, error);
    },
    logContextUpdate: (contextLength: number, documentsAttached: number) => {
      logLLMEvent.contextUpdate(contextLength, documentsAttached);
    }
  };
};

// Hook for RAG/document integration
export const useCactusRAGLogging = () => {
  return {
    logDocumentAttached: (documentId: string, documentName: string, chunkCount: number) => {
      logRAGEvent.documentAttached(documentId, documentName, chunkCount);
    },
    logDocumentRemoved: (documentId: string, documentName: string) => {
      logRAGEvent.documentRemoved(documentId, documentName);
    },
    logEmbeddingGenerated: (documentId: string, chunkCount: number, processingTime: number) => {
      logRAGEvent.embeddingGenerated(documentId, chunkCount, processingTime);
    }
  };
};

// Direct logging functions for simple integration
export const cactusLogger = {
  // Model events
  modelLoading: (modelId: string, modelType: 'llm' | 'embedding') => {
    logModelEvent.loading(modelId, modelType);
  },
  modelLoaded: (modelId: string, modelType: 'llm' | 'embedding', loadTime?: number) => {
    logModelEvent.loaded(modelId, modelType, loadTime);
  },
  modelFailed: (modelId: string, modelType: 'llm' | 'embedding', error: string) => {
    logModelEvent.failed(modelId, modelType, error);
  },
  modelSelected: (modelId: string, modelType: 'llm' | 'embedding') => {
    logModelEvent.selected(modelId, modelType);
  },
  
  // LLM events
  messageStart: (messageId: string, prompt: string) => {
    logLLMEvent.messageStart(messageId, prompt);
  },
  messageComplete: (messageId: string, responseLength: number, generationTime: number, tokensUsed?: number) => {
    logLLMEvent.messageComplete(messageId, responseLength, generationTime, tokensUsed);
  },
  messageError: (messageId: string, error: string) => {
    logLLMEvent.messageError(messageId, error);
  },
  contextUpdate: (contextLength: number, documentsAttached: number) => {
    logLLMEvent.contextUpdate(contextLength, documentsAttached);
  },
  
  // RAG events
  documentAttached: (documentId: string, documentName: string, chunkCount: number) => {
    logRAGEvent.documentAttached(documentId, documentName, chunkCount);
  },
  documentRemoved: (documentId: string, documentName: string) => {
    logRAGEvent.documentRemoved(documentId, documentName);
  },
  embeddingGenerated: (documentId: string, chunkCount: number, processingTime: number) => {
    logRAGEvent.embeddingGenerated(documentId, chunkCount, processingTime);
  }
};