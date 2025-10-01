export type RagSource = {
  id: string;                // doc or chunk id
  title?: string;
  score?: number;            // similarity score
  uri?: string;              // where it came from
  preview?: string;          // first N chars
};

export type LlmStart = {
  kind: 'llm:start';
  requestId: string;
  model: string;
  params: Record<string, unknown>; // temp, topP, max_tokens, tools, etc.
  promptPreview: string;           // trim to, say, 500 chars
  time: number;
};

export type LlmChunk = {
  kind: 'llm:chunk';
  requestId: string;
  delta: string;              // streamed tokens
  time: number;
};

export type LlmEnd = {
  kind: 'llm:end';
  requestId: string;
  totalTokens?: number;
  latencyMs: number;
  finishReason?: string;
  time: number;
};

export type RagRetrieve = {
  kind: 'rag:retrieve';
  requestId: string;
  query: string;
  k: number;
  sources: RagSource[];
  latencyMs: number;
  time: number;
};

export type LlmError = {
  kind: 'llm:error';
  requestId: string;
  message: string;
  time: number;
};

export type InspectorEvent = LlmStart | LlmChunk | LlmEnd | RagRetrieve | LlmError;
