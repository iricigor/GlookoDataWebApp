/**
 * Glucose & Insulin Correlation AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * correlations between glucose levels and insulin doses.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';

/**
 * Generate AI prompt for glucose and insulin analysis with tercile-based statistical analysis
 * 
 * @param base64CsvData - Base64 encoded CSV data containing date, day of week, BG ranges, and insulin doses
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis with tercile analysis, hypoglycemia risk, and variance analysis
 */
export function generateGlucoseInsulinPrompt(base64CsvData: string, language: Exclude<ResponseLanguage, 'auto'> = 'english', unit: GlucoseUnit = 'mmol/L', provider?: AIProvider): string {
  const csvData = base64Decode(base64CsvData);
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  const unitInstruction = unit === 'mg/dL'
    ? 'Remember that all glucose values are in mg/dL (not mmol/L).'
    : 'Remember that all glucose values are in mmol/L (not mg/dL).';
  
  return `**Data Context**
This analysis examines daily blood glucose ranges and insulin dosing patterns from CGM and pump data to identify correlations between insulin delivery and glucose control, helping optimize diabetes management.

**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Your goal is to analyze the provided daily blood glucose (BG) and insulin data over the specified period and identify actionable trends and anomalies to help optimize diabetes control. The analysis must be clear, concise, and focus on practical recommendations.

**IMPORTANT FORMATTING RULES**
- Do NOT start your response with greetings like "Hello", "Good morning", "Good afternoon", or similar
- Do NOT include procedural statements like "I am analyzing", "Let me extract", "I will now look at", etc.
- Start directly with the analysis findings
- **Use tables wherever possible** to present data comparisons, statistics, and findings in a clear and structured format

**Time in Range Reference**
- Use the "BG In Range (%)" column from the dataset as the authoritative Time in Range (TIR) values
- Calculate overall average TIR from the dataset and verify your calculations align with individual daily values
- All percentage calculations in your analysis should be consistent with the provided daily TIR values

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
- Present day-of-week statistics in a table format.
- Highlight any significant multi-day patterns (e.g., weekend vs. weekday differences).
- Calculate and report variance: Compute the standard deviation of BG In Range (%) for the entire dataset, for each day of the week, and separately for weekends vs. workdays (Monday-Friday). Highlight which periods show the most variability.

2. Insulin Efficacy Analysis Using Terciles (Statistically Valid):
- IMPORTANT: Use terciles instead of arbitrary tiers. Divide all days with complete insulin data into three roughly equal groups based on Total Daily Insulin Dose: Low Tercile (bottom 33%), Medium Tercile (middle 33%), and High Tercile (top 33%).
- Report the average BG In Range (%) for each tercile in a table.
- Bolus Ratio Impact: Calculate the average BG Above (%) for days where the Bolus-to-Total-Insulin Ratio is above the dataset median and compare it to days below the median.
- If fewer than 9 days have complete insulin data, note this limitation and skip tercile analysis (as meaningful terciles require at least 3 days per group).

3. Hypoglycemia Risk Analysis:
- Calculate the average BG In Range (%) specifically for days where BG Below range is near zero (≤2%) versus days where BG Below is above a critical threshold (≥10%).
- Present findings in a table comparing low vs. high hypoglycemia days.
- Analyze correlation patterns:
  * If days with high Total Insulin correlate strongly with high BG Below (%), this suggests the dosage volume is generally too aggressive.
  * If high BG Below (%) correlates specifically with high Basal dose (relative to total), it points to nocturnal hypoglycemia risk.
- Provide specific recommendations based on these patterns.

4. Anomalies and Key Events:
- Identify the 3 best days (highest BG In Range %) and the 3 worst days (lowest BG In Range %).
- Present these in a comparison table with Date, TIR%, Basal, Bolus, and Total Insulin columns.
- Report the average Basal dose and average Bolus dose for the 3 best days and for the 3 worst days, and note the key difference between these two averages.

**Output Structure**

5. Summary:
- Provide a 3-point summary of the most significant findings from the analysis above.
- Focus on key patterns, notable statistics, and important observations.

6. Recommendations:
- Offer 2-3 specific, actionable recommendations based on the tercile analysis, variance analysis, and hypoglycemia risk data.
- Each recommendation should be concrete and specific (e.g., 'Days with high bolus ratio show significantly less time above range; consider increasing your meal-time insulin-to-carb ratio').
- Rank recommendations by expected impact on glucose control.

**Dataset (CSV format)**
\`\`\`csv
${csvData}
\`\`\`

${unitInstruction} Address me directly using "you/your" language. Keep your response clear and actionable. ${languageInstruction}${disclaimerInstruction}`;
}
