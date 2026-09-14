import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  CHROMA_DIR: process.env.CHROMA_DIR || './chroma_db',
  DATA_DIR: process.env.DATA_DIR || './data',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-5-mini',
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '800', 10),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '120', 10),
  K: parseInt(process.env.K || '4', 10),
  COLLECTION: process.env.COLLECTION || 'docs',
};

export function requireOpenAiOrGeminiKey(): { hasKey: boolean; provider: 'gemini' | 'openai' | 'mock' } {
  if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return { hasKey: true, provider: 'gemini' };
  }
  if (CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== 'your-key-here') {
    return { hasKey: true, provider: 'openai' };
  }
  return { hasKey: false, provider: 'mock' };
}
