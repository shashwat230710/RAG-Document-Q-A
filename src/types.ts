export interface SourceCitation {
  source: string;
  page: string;
  snippet?: string;
  score?: number;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: SourceCitation[];
  _meta?: {
    latencyMs: number;
    retrievedDocsCount: number;
    retrievalOccurrences: number;
  };
}

export interface DocumentItem {
  name: string;
  path: string;
  size: number;
  pagesCount: number;
  preview: string;
}

export interface ChunkItem {
  id: string;
  source: string;
  page: number;
  index: number;
  snippet: string;
  contentLength: number;
}

export interface EvalSample {
  user_input: string;
  response: string;
  retrieved_contexts: string[];
  reference: string;
  faithfulness: number;
  response_relevancy: number;
  llm_context_precision_with_reference: number;
  llm_context_recall: number;
}

export interface EvalResultData {
  samples: EvalSample[];
  averages: {
    faithfulness: number;
    response_relevancy: number;
    context_precision: number;
    context_recall: number;
  };
  csvPath: string;
}

export interface SpecIssue {
  id: number;
  title: string;
  description: string;
}

export interface SpecData {
  title: string;
  stack: {
    embeddings: string;
    vectorDb: string;
    lcel: string;
    api: string;
    eval: string;
    llm: string;
  };
  issuesFixed: SpecIssue[];
  futureIterations: string[];
}
