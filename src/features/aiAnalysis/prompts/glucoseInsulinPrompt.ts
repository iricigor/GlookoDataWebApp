/**
 * Glucose & Insulin Correlation AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * correlations between glucose levels and insulin doses.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import { getLanguageInstruction } from './promptUtils';

/**
 * Generate AI prompt for glucose and insulin analysis with tiering
 * 
 * @param base64CsvData - Base64 encoded CSV data containing date, day of week, BG ranges, and insulin doses
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @returns Formatted prompt for AI analysis
 */
export function generateGlucoseInsulinPrompt(base64CsvData: string, language: ResponseLanguage = 'english', unit: GlucoseUnit = 'mmol/L'): string {
  const csvData = base64Decode(base64CsvData);
  const languageInstruction = getLanguageInstruction(language);
  
  const unitInstruction = unit === 'mg/dL'
    ? 'Remember that all glucose values are in mg/dL (not mmol/L).'
    : 'Remember that all glucose values are in mmol/L (not mg/dL).';
  
  return `**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Your goal is to analyze the provided daily blood glucose (BG) and insulin data over the specified period and identify actionable trends and anomalies to help optimize diabetes control. The analysis must be clear, concise, and focus on practical recommendations.

**CRITICAL: Data Integrity**
NEVER hallucinate or invent data. Before performing any analysis:
- Check if insulin columns (Basal Insulin, Bolus Insulin, Total Insulin) contain actual values or are empty/incomplete.
- If insulin data is missing or incomplete for any days, explicitly note this limitation and skip analyses that depend on insulin values for those days.
- Only analyze CGM/BG data if sufficient glucose readings are available.
- If critical data is missing, state what analyses cannot be performed and why.

**Required Analysis**
Perform the following specific analyses on provided data set and report the findings:

1. Temporal Trends (Day of Week & Time):
- Identify the best and worst days of the week based on the average BG In Range (%).
- Highlight any significant multi-day patterns (e.g., weekend vs. weekday differences).
- Calculate and report variance: Compute the standard deviation of BG In Range (%) for the entire dataset, for each day of the week, and separately for weekends vs. workdays (Monday-Friday). Highlight which periods show the most variability.

2. Insulin Efficacy Analysis Using Terciles (Statistically Valid):
- IMPORTANT: Use terciles instead of arbitrary tiers. Divide all days with complete insulin data into three roughly equal groups based on Total Daily Insulin Dose: Low Tercile (bottom 33%), Medium Tercile (middle 33%), and High Tercile (top 33%).
- Report the average BG In Range (%) for each tercile.
- Bolus Ratio Impact: Calculate the average BG Above (%) for days where the Bolus-to-Total-Insulin Ratio is above the dataset median and compare it to days below the median.
- If fewer than 3 days have complete insulin data, note this limitation and skip tercile analysis.

3. Basal Drift Test (Overnight & Fasting Analysis):
- Identify overnight periods (approximately 10 PM – 6 AM) in the dataset.
- Also identify any fasting periods (no food/bolus for more than 4-5 hours during the day).
- For these periods, check if BG rises or falls significantly (more than 30-50 mg/dL or 1.7-2.8 mmol/L) with zero bolus insulin.
- If such drift is detected, it indicates that basal insulin dosing may need adjustment:
  * Rising BG suggests insufficient basal insulin.
  * Falling BG suggests excessive basal insulin.
- Note: This analysis requires timestamp-level data. If only daily summaries are available, note that detailed basal drift analysis cannot be performed with current data granularity.

4. Hypoglycemia Risk Analysis:
- Calculate the average BG In Range (%) specifically for days where BG Below range is near zero (≤2%) versus days where BG Below is above a critical threshold (≥10%).
- Analyze correlation patterns:
  * If days with high Total Insulin correlate strongly with high BG Below (%), this suggests the dosage volume is generally too aggressive.
  * If high BG Below (%) correlates specifically with high Basal dose (relative to total), it points to nocturnal hypoglycemia risk.
- Provide specific recommendations based on these patterns.

5. Anomalies and Key Events:
- Identify the 3 best days (highest BG In Range %) and the 3 worst days (lowest BG In Range %).
- Report the average Basal dose and average Bolus dose for the 3 best days and for the 3 worst days, and note the key difference between these two averages.

6. Actionable Summary:
- Provide a 3-point summary of the most significant findings.
- Offer 2-3 specific, actionable recommendations based on the tercile analysis, variance analysis, basal drift test, and hypoglycemia risk data (e.g., 'Days with high bolus ratio show significantly less time above range; consider increasing your meal-time insulin-to-carb ratio', or 'Your BG shows a consistent overnight rise of 40 mg/dL during fasting periods, suggesting your basal rate may be insufficient').

**Dataset (CSV format)**
\`\`\`csv
${csvData}
\`\`\`

${unitInstruction} Address me directly using "you/your" language. Keep your response clear and actionable. ${languageInstruction}

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
