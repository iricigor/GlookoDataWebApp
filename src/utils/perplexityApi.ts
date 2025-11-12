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

/**
 * Generate AI prompt for meal timing analysis
 * 
 * @param base64CgmData - Base64 encoded CSV data with CGM readings (Timestamp, CGM Glucose Value)
 * @param base64BolusData - Base64 encoded CSV data with bolus insulin (Timestamp, Insulin Delivered)
 * @param base64BasalData - Base64 encoded CSV data with basal insulin (Timestamp, Insulin Delivered/Rate)
 * @returns Formatted prompt for AI analysis
 */
export function generateMealTimingPrompt(
  base64CgmData: string,
  base64BolusData: string,
  base64BasalData: string
): string {
  const cgmData = base64Decode(base64CgmData);
  const bolusData = base64Decode(base64BolusData);
  const basalData = base64Decode(base64BasalData);
  
  return `**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Analyze the provided time-series data to provide a day-of-the-week specific and meal-specific optimization report. The analysis must identify Basal, Bolus, and Timing issues to offer practical, specific recommendations for improving time-in-range (TIR).

**Required Analysis and Findings**

1. **Temporal Trends (Day-Specific Performance)**
   - BG Control Ranking: Rank all seven days of the week (Mon-Sun) based on the Average BG In Range (%) (TIR, 3.9-10.0 mmol/L).
   - Day Type Comparison: Calculate and report the difference in Average Daily TIR and Average Total Daily Insulin between Workdays (Mon-Fri) and Weekends (Sat-Sun).

2. **Insulin Efficacy Tiering (Dose vs. Control)**
   - Total Dose Tier Analysis: Divide days into Low, Medium, and High Total Daily Insulin (Bolus + Basal) tiers.
   - Calculate and report the Average BG In Range (%) and Average BG Above (%) for each tier. (This verifies if high dosing is correlated with failure to control BG.)

3. **Post-Meal Timing Efficacy (The "Pre-Bolus" Check)**
   A. Estimated Meal Times:
      - Estimate the average bolus time (as a proxy for meal time) for Breakfast, Lunch, and Dinner.
      - Crucially, break down these average times separately for EACH Day of the Week (Mon, Tue, Wed, etc.).
   B. Post-Meal Spike Analysis:
      - For each meal (Breakfast, Lunch, Dinner), calculate the Spike Rate (% of meal boluses that lead to a BG > 10.0 mmol/L within 3 hours).
      - Calculate the Average Time to Peak BG (in minutes) after the bolus for each meal.
      - Note: This analysis should be performed on a representative sample of days (e.g., Medium Dose Tier, High TIR).

4. **Nocturnal Basal Efficacy**
   - Goal: Validate the stability of the overnight basal rate and identify potential Dawn Phenomenon timing.
   - Analysis: Calculate the average BG change (mmol/L) between 03:00 AM and the time of the first morning bolus, broken down by:
     - Workdays
     - Weekends
   - A large positive change (BG drift up) indicates insufficient nocturnal basal or a need to adjust the basal rate schedule earlier.

**Actionable Summary and Recommendations**
Provide a structured, clinically-focused final report:
1. 3-Point Summary: Summarize the three most significant findings (e.g., "Tuesday is the worst day for TIR," "The average time to peak after Lunch is 31 minutes," "BG drifts up 1.5 mmol/L overnight on Weekends").
2. 3-4 Actionable Recommendations: Provide specific, immediately useful advice based on the data findings:
   - Timing: Adjust pre-bolus times for specific meals.
   - Basal: Adjust nocturnal or morning basal rates, particularly for specific days of the week (e.g., Monday morning, Weekend mornings).
   - Dosing: Address the conditions that cause days to fall into the "High Dose, Low TIR" tier.

**Dataset 1: CGM Data (cgm.csv)**
Raw, high-frequency continuous glucose monitoring data:
\`\`\`csv
${cgmData}
\`\`\`

**Dataset 2: Bolus Data (bolus.csv)**
Event-based bolus insulin delivery data:
\`\`\`csv
${bolusData}
\`\`\`

**Dataset 3: Basal Data (basal.csv)**
Pump basal insulin delivery data:
\`\`\`csv
${basalData}
\`\`\`

Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable.`;
}
