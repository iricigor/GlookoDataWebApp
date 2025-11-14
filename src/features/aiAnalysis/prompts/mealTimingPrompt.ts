/**
 * Meal Timing AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * meal timing and insulin delivery patterns.
 */

import { base64Decode } from '../../../utils/formatting';

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

1. **Detailed Meal Analysis for Last 3 Days**
   - Goal: Provide a comprehensive, day-by-day breakdown of meals and insulin timing for the most recent 3 days in the dataset.
   - For each of the last 3 days, identify and report:
     - All meal events (detected by significant bolus insulin doses, typically > 2 units)
     - For each meal:
       * Date and time of the bolus insulin dose
       * Amount of insulin delivered (units)
       * Estimated meal type (Breakfast/Lunch/Dinner/Snack) based on time of day
       * Time elapsed between insulin bolus and subsequent BG rise (if applicable)
       * Post-meal BG pattern (stable, spike, or drop)
   - Present this information in a clear, structured format (table or list) showing the chronological sequence of meals and insulin for each day.
   - Note any patterns such as: consistent pre-bolusing, reactive bolusing (after BG rise), or missed meal coverage.

2. **Temporal Trends (Day-Specific Performance)**
   - BG Control Ranking: Rank all seven days of the week (Mon-Sun) based on the Average BG In Range (%) (TIR, 3.9-10.0 mmol/L).
   - Day Type Comparison: Calculate and report the difference in Average Daily TIR and Average Total Daily Insulin between Workdays (Mon-Fri) and Weekends (Sat-Sun).

3. **Insulin Efficacy Tiering (Dose vs. Control)**
   - Total Dose Tier Analysis: Divide days into Low, Medium, and High Total Daily Insulin (Bolus + Basal) tiers.
   - Calculate and report the Average BG In Range (%) and Average BG Above (%) for each tier. (This verifies if high dosing is correlated with failure to control BG.)

4. **Post-Meal Timing Efficacy (The "Pre-Bolus" Check)**
   A. Estimated Meal Times:
      - Estimate the average bolus time (as a proxy for meal time) for Breakfast, Lunch, and Dinner.
      - Crucially, break down these average times separately for EACH Day of the Week (Mon, Tue, Wed, etc.).
   B. Post-Meal Spike Analysis:
      - For each meal (Breakfast, Lunch, Dinner), calculate the Spike Rate (% of meal boluses that lead to a BG > 10.0 mmol/L within 3 hours).
      - Calculate the Average Time to Peak BG (in minutes) after the bolus for each meal.
      - Note: This analysis should be performed on a representative sample of days (e.g., Medium Dose Tier, High TIR).

5. **Nocturnal Basal Efficacy**
   - Goal: Validate the stability of the overnight basal rate and identify potential Dawn Phenomenon timing.
   - Analysis: Calculate the average BG change (mmol/L) between 03:00 AM and the time of the first morning bolus, broken down by:
     - Workdays
     - Weekends
   - A large positive change (BG drift up) indicates insufficient nocturnal basal or a need to adjust the basal rate schedule earlier.

**Actionable Summary and Recommendations**
Provide a structured, clinically-focused final report:
1. 3-Point Summary: Summarize the three most significant findings from all analyses, including insights from the detailed 3-day meal review (e.g., "In the last 3 days, you consistently bolused 10 minutes after meals," "Tuesday is the worst day for TIR," "The average time to peak after Lunch is 31 minutes," "BG drifts up 1.5 mmol/L overnight on Weekends").
2. 3-4 Actionable Recommendations: Provide specific, immediately useful advice based on the data findings:
   - Recent Patterns: Highlight any concerning patterns from the last 3 days' detailed meal analysis (e.g., late bolusing, missed meals, inadequate doses).
   - Timing: Adjust pre-bolus times for specific meals based on the detailed meal data and overall patterns.
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

Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable.

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
