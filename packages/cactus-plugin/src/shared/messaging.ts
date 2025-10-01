import type { InspectorEvent } from './types';

export type CactusEvent =
  | { type: 'llm:start'; event: Extract<InspectorEvent, { kind: 'llm:start' }> }
  | { type: 'llm:chunk'; event: Extract<InspectorEvent, { kind: 'llm:chunk' }> }
  | { type: 'llm:end'; event: Extract<InspectorEvent, { kind: 'llm:end' }> }
  | { type: 'llm:error'; event: Extract<InspectorEvent, { kind: 'llm:error' }> }
  | {
      type: 'rag:retrieve';
      event: Extract<InspectorEvent, { kind: 'rag:retrieve' }>;
    };

export type CactusEventMap = {
  [K in CactusEvent['type']]: Extract<CactusEvent, { type: K }>;
};

// Re-export for convenience
export type { InspectorEvent };
