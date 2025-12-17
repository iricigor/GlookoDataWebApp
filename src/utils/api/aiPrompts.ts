/**
 * AI Prompts Constants
 * 
 * This module contains shared prompt constants used across different AI providers.
 */

/**
 * Unified system prompt used for all AI providers
 * 
 * This prompt defines the AI assistant's role and core behavior across all AI queries.
 * It specifies:
 * - Role as an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis
 * - Critical instruction to never guess or invent missing raw data points
 * - Requirements for clear, actionable, evidence-based recommendations
 * - Communication style (direct, second person)
 * 
 * This system prompt is used in:
 * - Backend AI query endpoint (api/src/functions/aiQuery.ts)
 * - All frontend prompt generation functions
 * - API documentation examples
 * 
 * IMPORTANT: This constant exists in both frontend and backend:
 * - Frontend: src/utils/api/aiPrompts.ts (this file)
 * - Backend: api/src/utils/aiPrompts.ts
 * These MUST be kept in sync manually. Any changes to this prompt should be made in both locations.
 */
export const AI_SYSTEM_PROMPT = 'You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.';
