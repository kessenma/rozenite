# Cactus Plugin Integration Guide

This guide shows how to integrate the Cactus Plugin logging into your React Native app to capture model loading, LLM interactions, and RAG events.

## Installation

First, import the logging functions from the cactus plugin:

```typescript
import { cactusLogger, useCactusModelLogging, useCactusLLMLogging, useCactusRAGLogging } from './plugins-wip/rozenite/packages/cactus-plugin/src';
```

## Model Store Integration

### In `stores/model-store/loadingOperations.ts`

Add logging to the `setLoadedModel` function:

```typescript
import { cactusLogger } from '../../../plugins-wip/rozenite/packages/cactus-plugin/src';

setLoadedModel: (modelId: string | null, modelType?: 'llm' | 'embedding') => {
  if (!modelType) return;

  const currentState = get();
  
  if (modelType === 'llm') {
    const currentId = currentState.loadedLLMId;
    
    if (currentId === modelId) {
      const shouldBeLoaded = modelId !== null;
      if (currentLoadedFlag !== shouldBeLoaded) {
        set({ isLLMLoadedFlag: shouldBeLoaded });
      }
      return;
    }

    const shouldBeLoaded = modelId !== null;
    
    if (shouldBeLoaded) {
      // Log model loading start
      cactusLogger.modelLoading(modelId, modelType);
      
      set({
        loadedLLMId: modelId,
        isLLMLoadedFlag: shouldBeLoaded,
        loadedEmbeddingId: null,
        isEmbeddingLoadedFlag: false,
      });
      storage.set(LOADED_LLM_KEY, modelId);
      storage.delete(LOADED_EMBEDDING_KEY);
      
      // Log successful model load
      cactusLogger.modelLoaded(modelId, modelType);
    } else {
      set({
        loadedLLMId: modelId,
        isLLMLoadedFlag: shouldBeLoaded,
      });
      storage.delete(LOADED_LLM_KEY);
    }
  }
  // Similar for embedding models...
},

setIsLoadingModel: (isLoading: boolean) => {
  set({ isLoadingModel: isLoading });
  
  // Log loading state changes
  if (isLoading) {
    const currentState = get();
    const modelId = currentState.loadedLLMId || currentState.loadedEmbeddingId;
    const modelType = currentState.loadedLLMId ? 'llm' : 'embedding';
    if (modelId) {
      cactusLogger.modelLoading(modelId, modelType);
    }
  }
},
```

### In `components/chat/utils/useModelSelection.ts`

Add logging to model selection:

```typescript
import { cactusLogger } from '../../../../plugins-wip/rozenite/packages/cactus-plugin/src';

const handleModelSelect = useCallback(async (model: ModelInfo) => {
  try {
    console.log('🎯 LLMChatInterface: Selecting model:', {
      id: model.id,
      name: model.name,
      filename: model.filename,
      provider: model.provider
    });

    // Log model selection
    cactusLogger.modelSelected(model.id, model.modelType);

    // If model is already loaded, just return
    const currentLoadedId = model.modelType === 'llm' ? loadedLLMId : loadedEmbeddingId;
    if (currentLoadedId === model.id) {
      return;
    }

    // Prevent loading if another model is already loading
    if (isLoadingModel) {
      console.log('🎯 LLMChatInterface: Another model is already loading');
      return;
    }

    // Start loading the model
    console.log('🎯 LLMChatInterface: Starting to load model:', model.name);
    setIsLoadingModel(true);

    try {
      const modelPath = `${RNFS.DocumentDirectoryPath}/models/${model.filename}`;
      console.log('🎯 LLMChatInterface: Model path:', modelPath);

      // Log loading start
      cactusLogger.modelLoading(model.id, model.modelType);

      // Call onLoadModel to load the model in the background
      if (onLoadModel) {
        console.log('🎯 LLMChatInterface: Calling onLoadModel to load model:', modelPath);
        onLoadModel(modelPath);
      }

    } catch (error) {
      console.error('LLMChatInterface: Error selecting model:', error);
      setIsLoadingModel(false);
      setLoadedModel(null);
      
      // Log model loading failure
      cactusLogger.modelFailed(model.id, model.modelType, error.message);
    }
  } catch (error) {
    console.error('Error selecting model:', error);
    Alert.alert('Error', 'Failed to select the model. Please try again.');
    
    // Log model selection failure
    cactusLogger.modelFailed(model.id, model.modelType, error.message);
  }
}, [loadedLLMId, loadedEmbeddingId, isLoadingModel, setIsLoadingModel, setLoadedModel, onLoadModel]);
```

## LLM Chat Interface Integration

### In `components/chat/LLMChatInterface.tsx`

Add logging to message generation:

```typescript
import { cactusLogger } from '../../../plugins-wip/rozenite/packages/cactus-plugin/src';

// In your message sending function
const sendMessage = useCallback(async (messageText: string) => {
  const messageId = generateMessageId();
  
  // Log message start
  cactusLogger.messageStart(messageId, messageText);
  
  const startTime = Date.now();
  
  try {
    setIsGenerating(true);
    setGenerationStartTime(startTime);
    
    // Your existing message generation logic...
    const response = await generateResponse(messageText);
    
    const endTime = Date.now();
    const generationTime = endTime - startTime;
    
    // Log successful message completion
    cactusLogger.messageComplete(
      messageId, 
      response.length, 
      generationTime, 
      response.tokensUsed
    );
    
  } catch (error) {
    console.error('Error generating message:', error);
    
    // Log message error
    cactusLogger.messageError(messageId, error.message);
    
  } finally {
    setIsGenerating(false);
    setGenerationStartTime(null);
  }
}, []);

// Log context updates when documents are attached/removed
useEffect(() => {
  const contextLength = messages.reduce((total, msg) => total + msg.content.length, 0);
  const documentsAttached = attachedDocuments.length;
  
  cactusLogger.contextUpdate(contextLength, documentsAttached);
}, [messages, attachedDocuments]);
```

## RAG/Document Integration

### In `components/chat/utils/useDocumentState.ts`

Add logging to document operations:

```typescript
import { cactusLogger } from '../../../../plugins-wip/rozenite/packages/cactus-plugin/src';

const handleDocumentSelect = async (document: DocumentInfo) => {
  console.log('📄 DOC: Starting document selection process');
  
  const isAlreadyAttached = attachedDocuments.some(doc => doc.id === document.id);

  if (isAlreadyAttached) {
    // Remove document if already attached
    console.log('⚠️ DOC: Document already attached, removing:', document.id);
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== document.id));
    
    // Log document removal
    cactusLogger.documentRemoved(document.id, document.name);
  } else {
    // Load chunks for the document before attaching
    try {
      console.log('🔍 DOC: Loading chunks for document:', document.id);
      const embeddingChunks = await loadEmbeddings(document.id);
      const documentWithChunks = {
        ...document,
        chunks: embeddingChunks ? embeddingChunks.map(chunk => chunk.text) : []
      };

      console.log('✅ DOC: Chunks loaded successfully:', {
        chunkCount: documentWithChunks.chunks.length,
      });

      setAttachedDocuments(prev => [...prev, documentWithChunks]);
      
      // Log document attachment
      cactusLogger.documentAttached(
        document.id, 
        document.name, 
        documentWithChunks.chunks.length
      );

    } catch (error) {
      console.error('📄 DOC: Error loading document chunks:', error);
    }
  }
};
```

### In embedding generation code

```typescript
import { cactusLogger } from '../../../plugins-wip/rozenite/packages/cactus-plugin/src';

// When generating embeddings for a document
const generateEmbeddings = async (documentId: string, chunks: string[]) => {
  const startTime = Date.now();
  
  try {
    // Your embedding generation logic...
    const embeddings = await processEmbeddings(chunks);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Log successful embedding generation
    cactusLogger.embeddingGenerated(documentId, chunks.length, processingTime);
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};
```

## Using React Hooks

You can also use the provided React hooks for cleaner integration:

```typescript
import { useCactusModelLogging, useCactusLLMLogging, useCactusRAGLogging } from '../../../plugins-wip/rozenite/packages/cactus-plugin/src';

function MyComponent() {
  const modelLogger = useCactusModelLogging();
  const llmLogger = useCactusLLMLogging();
  const ragLogger = useCactusRAGLogging();
  
  const handleModelLoad = (modelId: string) => {
    modelLogger.logModelLoading(modelId, 'llm');
    // ... your model loading logic
    modelLogger.logModelLoaded(modelId, 'llm', loadTime);
  };
  
  const handleMessageSend = (messageId: string, prompt: string) => {
    llmLogger.logMessageStart(messageId, prompt);
    // ... your message generation logic
    llmLogger.logMessageComplete(messageId, responseLength, generationTime);
  };
  
  const handleDocumentAttach = (doc: DocumentInfo) => {
    ragLogger.logDocumentAttached(doc.id, doc.name, doc.chunks?.length || 0);
  };
}
```

## Viewing Logs

Once integrated, you can:

1. Open the Rozenite DevTools
2. Navigate to the Cactus Plugin panel
3. Use the "Show Mock Logs" button to toggle between mock and real logs
4. View real-time logs as they come in from your app
5. Filter logs by provider (LLM, RAG, Embedding)
6. Export logs for analysis

The logs will show up in real-time as your app performs model loading, LLM interactions, and document operations.