/**
 * Google Gemini API utility functions
 * 
 * This module provides functions to interact with Google's Gemini API
 * for AI-powered analysis of glucose data.
 */

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Error response from Gemini API
 */
export interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Result of calling Gemini API
 */
export interface GeminiResult {
  success: boolean;
  content?: string;
  error?: string;
  errorType?: 'unauthorized' | 'network' | 'api' | 'unknown';
}

/**
 * Call Google Gemini API with a prompt
 * 
 * @param apiKey - Google Gemini API key
 * @param prompt - The prompt to send to the AI
 * @returns Promise with the result containing success status and content or error
 */
export async function callGeminiApi(
  apiKey: string,
  prompt: string
): Promise<GeminiResult> {
  // Validate inputs
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'API key is required',
      errorType: 'unauthorized',
    };
  }

  if (!prompt || prompt.trim() === '') {
    return {
      success: false,
      error: 'Prompt is required',
      errorType: 'api',
    };
  }

  try {
    // Using gemini-2.0-flash-exp model as specified
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful medical assistant specializing in diabetes care and continuous glucose monitoring analysis. Provide clear, actionable, and evidence-based recommendations.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Invalid API key or unauthorized access. Please check your API key in Settings.',
          errorType: 'unauthorized',
        };
      }

      // Try to parse error message from response
      try {
        const errorData = await response.json() as GeminiError;
        return {
          success: false,
          error: errorData.error?.message || `API error: ${response.status} ${response.statusText}`,
          errorType: 'api',
        };
      } catch {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
          errorType: 'api',
        };
      }
    }

    // Parse successful response
    const data = await response.json() as GeminiResponse;
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      const content = data.candidates[0].content.parts[0].text;
      return {
        success: true,
        content: content.trim(),
      };
    }

    return {
      success: false,
      error: 'Invalid response format from API',
      errorType: 'api',
    };

  } catch (error) {
    // Handle network errors or other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        errorType: 'network',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown',
    };
  }
}

/**
 * Generate AI prompt for time-in-range analysis
 * 
 * @param tirPercentage - Time in range percentage (0-100)
 * @returns Formatted prompt for AI analysis
 */
export function generateTimeInRangePrompt(tirPercentage: number): string {
  return `Given a patient's percent time-in-range (TIR) from continuous glucose monitoring is ${tirPercentage.toFixed(1)}%, provide a brief clinical assessment and 2-3 specific, actionable recommendations to improve their glucose management. The target TIR for most adults with diabetes is 70% or higher. Keep your response concise (under 200 words) and practical.`;
}

/**
 * Convert base64 data to string
 * 
 * @param base64Data - Base64 encoded string
 * @returns Decoded string
 */
export function base64Decode(base64Data: string): string {
  return atob(base64Data);
}

/**
 * Convert string to base64
 * 
 * @param data - String to encode
 * @returns Base64 encoded string
 */
export function base64Encode(data: string): string {
  return btoa(data);
}

/**
 * Generate AI prompt for glucose and insulin correlation analysis
 * 
 * @param base64CsvData - Base64 encoded CSV data containing date, day of week, BG ranges, and insulin doses
 * @returns Formatted prompt for AI analysis
 */
export function generateGlucoseInsulinPrompt(base64CsvData: string): string {
  const csvData = base64Decode(base64CsvData);
  
  return `**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Your goal is to analyze the provided daily blood glucose (BG) and insulin data over the specified period and identify actionable correlations, trends, and anomalies to help optimize diabetes control. The analysis must be clear, concise, and focus on practical recommendations.

**Required Analysis and Correlations**
Perform the following specific analyses on provided data set and report the findings:

1. Temporal Trends (Day of Week & Time):
- Identify the best and worst days of the week based on the average BG In Range (%).
- Highlight any significant multi-day patterns (e.g., performance dips every 3 days, or weekend vs. weekday differences).

2. Insulin Efficacy Correlation:
- Determine the correlation between Total Insulin (Units) and BG In Range (%). Is higher total insulin associated with better or worse time-in-range?
- Analyze the separate correlations for Basal and Bolus insulin against the BG In Range (%) and BG Above (%). Does a higher bolus dose correlate with reduced time above range?

3. Anomalies and Key Events:
- Identify the 3 best days (highest BG In Range %) and the 3 worst days (lowest BG In Range %) in the entire dataset.
- For these 6 outlier days, report the corresponding Basal and Bolus doses. (This is for the user to manually correlate with diet/activity on those specific dates).

4. Actionable Summary
- Provide a 3-point summary of the most significant findings.
- Offer 2-3 specific, actionable recommendations based on the correlation data (e.g., 'Consider reducing basal on Sundays,' or 'Your BG Above % appears to spike on days where your total insulin is less than X units').

**Dataset (CSV format)**
\`\`\`csv
${csvData}
\`\`\`

Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language. Keep your response clear and actionable.`;
}
