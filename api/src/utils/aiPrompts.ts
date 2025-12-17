/**
 * AI Prompts Constants for Backend
 * 
 * This module contains shared prompt constants used across AI provider integrations
 * in the backend API.
 */

/**
 * Unified system prompt used for all AI providers
 * 
 * This prompt defines the AI assistant's role and core behavior across all AI queries.
 * It specifies:
 * - Role as an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis
 * - Critical instruction to never guess or invent missing raw data points
 * 
 * This system prompt ensures:
 * - Consistent AI role definition across all queries
 * - Focus on data-driven analysis without hallucination
 * - Expert-level domain knowledge in diabetes care
 * 
 * Note: This constant must be kept in sync with the frontend version at
 * src/utils/api/aiPrompts.ts to ensure consistent behavior across the application.
 */
export const AI_SYSTEM_PROMPT = 'You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.';
