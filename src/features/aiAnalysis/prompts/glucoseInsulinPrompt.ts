/**
 * Glucose & Insulin Correlation AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * correlations between glucose levels and insulin doses.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';

/**
 * Generate AI prompt for glucose and insulin analysis with tiering
 * 
 * @param base64CsvData - Base64 encoded CSV data containing date, day of week, BG ranges, and insulin doses
 * @param language - Response language (english or czech)
 * @returns Formatted prompt for AI analysis
 */
export function generateGlucoseInsulinPrompt(base64CsvData: string, language: ResponseLanguage = 'english'): string {
  const csvData = base64Decode(base64CsvData);
  const languageInstruction = language === 'czech' 
    ? 'Respond in Czech language (česky).'
    : 'Respond in English.';
  
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

Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language. Keep your response clear and actionable. ${languageInstruction}

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
