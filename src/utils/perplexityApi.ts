/**
 * Perplexity API utility functions
 * 
 * This module provides functions to interact with the Perplexity API
 * for AI-powered analysis of glucose data.
 */

/**
 * Perplexity API response structure
 */
export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Error response from Perplexity API
 */
export interface PerplexityError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Result of calling Perplexity API
 */
export interface PerplexityResult {
  success: boolean;
  content?: string;
  error?: string;
  errorType?: 'unauthorized' | 'network' | 'api' | 'unknown';
}

/**
 * Call Perplexity API with a prompt
 * 
 * @param apiKey - Perplexity API key
 * @param prompt - The prompt to send to the AI
 * @returns Promise with the result containing success status and content or error
 */
export async function callPerplexityApi(
  apiKey: string,
  prompt: string
): Promise<PerplexityResult> {
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant specializing in diabetes care and continuous glucose monitoring analysis. Provide clear, actionable, and evidence-based recommendations. IMPORTANT: All glucose measurements are in mmol/L (European standard). Communicate directly with the user in second person (use "you/your" instead of "patient"). Do not assume there is a healthcare provider intermediary.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
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
        const errorData = await response.json() as PerplexityError;
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
    const data = await response.json() as PerplexityResponse;
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
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
  return `My percent time-in-range (TIR) from continuous glucose monitoring is ${tirPercentage.toFixed(1)}%. Provide a brief assessment and 2-3 specific, actionable recommendations to improve my glucose management. Remember that all glucose values are in mmol/L (not mg/dL). The target TIR for most adults with diabetes is 70% or higher. Keep your response concise (under 200 words) and practical. Address me directly using "you/your" language.`;
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
 * Generate AI prompt for glucose and insulin analysis with tiering
 * 
 * @param base64CsvData - Base64 encoded CSV data containing date, day of week, BG ranges, and insulin doses
 * @returns Formatted prompt for AI analysis
 */
export function generateGlucoseInsulinPrompt(base64CsvData: string): string {
  const csvData = base64Decode(base64CsvData);
  
  return `**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Your goal is to analyze the provided daily blood glucose (BG) and insulin data over the specified period and identify actionable trends and anomalies to help optimize diabetes control. The analysis must be clear, concise, and focus on practical recommendations.

**Required Analysis**
Perform the following specific analyses on provided data set and report the findings:

1. Temporal Trends (Day of Week & Time):
- Identify the best and worst days of the week based on the average BG In Range (%).
- Highlight any significant multi-day patterns (e.g., weekend vs. weekday differences).

2. Insulin Efficacy Tiers (Simplified and Actionable):
- Total Dose Tiering: Group all days into Low, Medium, and High Total Insulin tiers. Report the average BG In Range (%) for each tier.
- Bolus Ratio Impact: Calculate the average BG Above (%) for days where the Bolus-to-Total-Insulin Ratio is above the dataset median and compare it to days below the median.

3. Anomalies and Key Events:
- Identify the 3 best days (highest BG In Range %) and the 3 worst days (lowest BG In Range %).
- Report the average Basal dose and average Bolus dose for the 3 best days and for the 3 worst days, and note the key difference between these two averages.

4. Actionable Summary:
- Provide a 3-point summary of the most significant findings.
- Offer 2-3 specific, actionable recommendations based on the tier and outlier data (e.g., 'Days with a high bolus ratio show significantly less time above range; consider an increase in your meal-time insulin-to-carb ratio').

**Dataset (CSV format)**
\`\`\`csv
${csvData}
\`\`\`

Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language. Keep your response clear and actionable.`;
}
