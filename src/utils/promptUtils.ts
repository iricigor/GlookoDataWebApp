/**
 * AI Prompt Generation Utilities
 * 
 * This module provides provider-agnostic prompt generation functions
 * and utility functions for encoding/decoding data for AI analysis.
 */

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
 * Convert base64 data to string
 * 
 * @param base64Data - Base64 encoded string
 * @returns Decoded string
 */
export function base64Decode(base64Data: string): string {
  return atob(base64Data);
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
