/**
 * Meal Timing AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * meal timing and insulin delivery patterns.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';

/**
 * Generate AI prompt for meal timing analysis
 * 
 * @param base64CgmData - Base64 encoded CSV data with CGM readings (Timestamp, CGM Glucose Value)
 * @param base64BolusData - Base64 encoded CSV data with bolus insulin (Timestamp, Insulin Delivered)
 * @param base64BasalData - Base64 encoded CSV data with basal insulin (Timestamp, Insulin Delivered/Rate)
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateMealTimingPrompt(
  base64CgmData: string,
  base64BolusData: string,
  base64BasalData: string,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider
): string {
  const cgmData = base64Decode(base64CgmData);
  const bolusData = base64Decode(base64BolusData);
  const basalData = base64Decode(base64BasalData);
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  // Unit-specific values for ranges
  const lowThreshold = unit === 'mg/dL' ? '70' : '3.9';
  const highThreshold = unit === 'mg/dL' ? '180' : '10.0';
  // Pre-bolus rise threshold: used to detect when glucose starts rising after a meal
  // This is the minimum rise to consider a sustained glucose increase
  const preBolusRiseThreshold = unit === 'mg/dL' ? '27' : '1.5';
  
  return `**Data Context**
This analysis examines your CGM glucose readings, bolus insulin timing, and basal insulin patterns to identify meal-specific and day-of-week patterns, helping optimize pre-bolus timing and insulin dosing for better glucose control.

**Role and Goal**
You are an expert Data Analyst and Diabetes Management Specialist. Analyze the provided time-series data to provide a day-of-the-week specific and meal-specific optimization report. The analysis must identify Basal, Bolus, and Timing issues to offer practical, specific recommendations for improving time-in-range (TIR).

**IMPORTANT FORMATTING RULES**
- Do NOT start your response with greetings like "Hello", "Good morning", "Good afternoon", or similar
- Do NOT include procedural statements like "I am analyzing", "Let me extract", "I will now look at", etc.
- Start directly with the analysis findings

**Time in Range Reference**
- Calculate overall TIR (% of readings in ${lowThreshold}-${highThreshold} ${unit} range) from the CGM data
- Use this as your reference value and verify all percentage calculations are consistent
- Ensure daily TIR values align with overall TIR calculation

**Required Analysis and Findings**

1. **Detailed Meal Analysis for Last 3 Complete Days**
   - Goal: Provide a comprehensive, day-by-day breakdown of MAIN MEALS ONLY (no snacks) for the most recent 3 COMPLETE days in the dataset.
   - **Meal Detection Criteria (CRITICAL - Follow Precisely):**
     * A meal bolus is defined as a bolus ≥ 3.0 U (this filters out corrections and snacks)
     * **DO NOT count correction boluses or snacks** - only main meals with ≥ 3.0 U boluses
     * Cluster boluses within 15 minutes as a single meal event
     * This ensures only significant meal events (Breakfast, Lunch, Dinner) are captured
   - **Table Format Requirements:**
     * Present as a table with the following columns (split post-meal data into TWO separate columns):
       - Date: Format as "ddd MMM-dd" (e.g., "Mon Jan-15", "Tue Jan-16")
       - Time: Round to nearest 30 minutes (e.g., 07:30, 12:00, 18:30)
       - Meal Type: Breakfast/Lunch/Dinner only (no snacks)
       - Bolus (U): Display with ONE decimal place (e.g., 5.2, 8.0)
       - Pre-bolus (min): Time before/after glucose rise starts
       - Peak Height (${unit}): Post-meal peak glucose value
       - Time to Peak (min): Minutes from bolus to peak glucose
     * Add an explanation row under the table: "Pre-bolus column: Positive values (+) = bolus given BEFORE glucose rise (good timing). Negative values (-) = bolus given AFTER glucose rise started (reactive/late bolusing). Zero or small values = bolus given at meal start."
   - Note any patterns such as: consistent pre-bolusing, reactive bolusing (after BG rise), or missed meal coverage.

2. **Temporal Trends (Day-Specific Performance)**
   - BG Control Ranking: Rank all seven days of the week (Mon-Sun) based on the Average BG In Range (%) (TIR, ${lowThreshold}-${highThreshold} ${unit}).
   - Day Type Comparison: Calculate and report the difference in Average Daily TIR and Average Total Daily Insulin between Workdays (Mon-Fri) and Weekends (Sat-Sun).

3. **Insulin Efficacy Tiering (Dose vs. Control)**
   - Total Dose Tier Analysis: Divide days into Low, Medium, and High Total Daily Insulin (Bolus + Basal) tiers.
   - Calculate and report the Average BG In Range (%) and Average BG Above (%) for each tier. (This verifies if high dosing is correlated with failure to control BG.)

4. **Weekday vs Weekend Meal Timing Analysis**
   - **CRITICAL: Separate Analysis for Weekdays (Mon-Fri) vs Weekends (Sat-Sun)**
   - For EACH meal type (Breakfast, Lunch, Dinner):
     A. **Weekday Analysis (Mon-Fri):**
        * Typical bolus time rounded to nearest 30 min (e.g., Breakfast: 07:30, with variance noted separately)
        * Average pre-bolus time (using true pre-bolus calculation from section 1)
        * % of meals with postprandial peak > ${highThreshold} ${unit}
        * Average peak height (${unit}) and time-to-peak (minutes)
        * Average 3-hour post-meal TIR (%)
     B. **Weekend Analysis (Sat-Sun):**
        * Same metrics as weekday analysis but calculated separately for Sat-Sun
        * Note typical differences in timing patterns between weekdays and weekends
   - This separation reveals important lifestyle patterns (e.g., later breakfasts on weekends, different meal timing)

5. **Basal Rate Check**
   A. **Overnight Stability (00:00-06:00):**
      - **Overnight period definition:** 00:00 – 06:00
      - Calculate average ΔBG from 00:00 to 06:00 separately for:
        * Workdays (Mon-Fri nights)
        * Weekends (Sat-Sun nights)
      - Large positive ΔBG indicates insufficient overnight basal rate
   B. **Fasting Test:**
      - On days with NO bolus between 00:00-12:00, analyze if BG is flat (±${preBolusRiseThreshold} ${unit})
      - This validates basal rate adequacy during fasting periods
   C. **Dawn Phenomenon:**
      - **Dawn phenomenon window:** 03:00 – first morning bolus
      - Calculate average BG change from 03:00 to first morning bolus
      - Separate analysis for workdays vs weekends
      - Large rise suggests need for increased basal rate in early morning hours
   D. **Missing Basal Data Handling:**
      - If basal data is incomplete or missing, clearly state this limitation
      - Provide analysis based on available data
      - Note that recommendations may be less comprehensive without complete basal information

6. **Hypoglycemia Risk Analysis**
   - Identify patterns of low BG (< ${lowThreshold} ${unit}) in relation to:
     * Time of day (morning, afternoon, evening, overnight)
     * Meal boluses (post-meal lows indicating over-bolusing)
     * Exercise or activity patterns (if discernible from BG drops)
   - Calculate frequency of hypoglycemic events per day
   - Identify any correlation between high pre-bolus times and subsequent hypoglycemia
   - Note time periods with highest hypoglycemia risk

**Output Structure**

1. **3-Point Summary**
   Summarize the three most significant findings from all analyses, including insights from the detailed 3-day meal review (e.g., "In the last 3 days, you consistently bolused 10 minutes after meals," "Tuesday is the worst day for TIR," "The average time to peak after Lunch is 31 minutes," "BG drifts up overnight on Weekends").

2. **Actionable Insights (3-5 recommendations)**
   Each recommendation MUST be:
   - **Extremely specific** with precise timing, values, and context
     * Good example: "Move weekday breakfast bolus from 07:45 to 07:15 (15-20 min pre-bolus)"
     * Good example: "Increase basal segment 04:00-07:00 by 0.15 U/h on weekends only"
     * Bad example: "Try to bolus earlier" (too vague)
   - **Ranked by expected impact on TIR** (highest impact first)
   - **Include expected improvement** where possible (e.g., "+8-12% TIR", "+6-10% TIR")
   
   Categories to address (select most impactful):
   - **Recent Patterns:** Highlight any concerning patterns from the last 3 days' detailed meal analysis (e.g., late bolusing, missed meals, inadequate doses)
   - **Timing:** Adjust pre-bolus times for specific meals based on weekday/weekend patterns
   - **Basal:** Adjust overnight, dawn phenomenon, or daytime basal rates, with specific time segments and rate changes
   - **Dosing:** Address high-dose/low-TIR situations with specific meal or correction adjustments
   - **Hypoglycemia:** Address patterns of low BG with specific timing or dose reductions

3. **Optional Quick Wins Table** (only include if there are 2+ clear, high-impact opportunities):
   
   | Issue                     | Current       → Recommended      | Expected TIR gain |
   |---------------------------|----------------------------------|-------------------|
   | Breakfast pre-bolus       | –5 min        → +18 min          | +8–12%            |
   | Weekend basal 03:00–08:00 | 0.8 U/h       → 1.05 U/h         | +6–10%            |
   
   Note: Only include this table if you identify clear, quantifiable improvements with reliable impact estimates.

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

Remember that all glucose values are in ${unit} (not ${unit === 'mg/dL' ? 'mmol/L' : 'mg/dL'}). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable. ${languageInstruction}${disclaimerInstruction}`;
}
