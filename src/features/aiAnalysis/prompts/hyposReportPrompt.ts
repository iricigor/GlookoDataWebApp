/**
 * Hypoglycemia Report AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * hypoglycemia events on the Reports page (daily view).
 * Results are returned in a compact JSON format using eventId for matching.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getLanguageInstruction, getDisclaimerInstruction, getSystemPrompt } from './promptUtils';

/**
 * Generate AI prompt for daily hypoglycemia event analysis
 * 
 * This prompt asks the AI to analyze each hypo event and return results
 * in a compact JSON format using eventId for matching.
 * 
 * @param base64EventsData - Base64 encoded CSV data with detailed hypo events
 * @param totalEventCount - Total number of events in the dataset
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit for response (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateHyposReportPrompt(
  base64EventsData: string,
  totalEventCount: number,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider
): string {
  const eventsData = base64Decode(base64EventsData);
  const systemPrompt = getSystemPrompt();
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  // User's preferred response unit
  const responseUnit = unit;
  
  return `${systemPrompt}

**Task**
Your task is to analyze the provided dataset of N=${totalEventCount} hypoglycemic events. This analysis must rely **strictly** on the numerical data provided below; **no external assumptions** about exercise, unrecorded carbs, or detailed sleep are allowed, except through deduction from the \`Time_of_Day_Code\`.

**IMPORTANT FORMATTING RULES**
- Do NOT start your response with greetings like "Hello", "Good morning", "Good afternoon", or similar
- Do NOT include procedural statements like "I am analyzing", "Let me extract", "I will now look at", etc.
- Start directly with the analysis findings
- **Return results as a compact JSON array** inside a markdown code block (see format below)
- When presenting glucose values in your response, use ${responseUnit}

**1. Analysis Goals & Output Format**

1. **Event-Specific Analysis:** Analyze every single event individually.
2. **Compact Output:** Use the **eventId** from the dataset to identify each event (do NOT repeat date/time/nadir - we already have this data).
3. **Output Format:** Return the findings as a **valid JSON array** inside a \`\`\`json code block.

**2. Required Deductions and Insights**

For **every individual event**, perform the following deductions:

* **Primary Suspect:** Determine the most probable single cause category based on the data:
    * **Bolus Overlap/Stacking:** High confidence if \`Last_Bolus_Mins_Prior\` is close (e.g., < 180 min) to \`Second_Bolus_Mins_Prior\`.
    * **Bolus Overdose/Timing:** High confidence if a large \`Last_Bolus_Units\` is present and the event occurs 1.5 to 4 hours later.
    * **Basal Excess (Nocturnal/Early AM):** High confidence if \`Time_of_Day_Code\` is 00-06 and low Bolus activity is present.
    * **Time/Hormonal Shift:** Used for unexplained midday lows with no clear Bolus/Basal fault.
* **Meal Time Deduction:** If the \`Last_Bolus_Units\` is large (e.g., > 2.0U) and the event occurs between 90 and 240 minutes later, deduce the approximate meal time. Format as "HH:MM" or null if not applicable.
* **Actionable Insight:** Provide a **short, specific, and actionable recommendation** (1 sentence) tied directly to the calculated features. Be specific about what adjustments to consider, e.g., "Consider reducing the lunch bolus carb ratio from 1:8 to 1:10, as the hypo occurred 3 hours post-meal with a moderate bolus."

**3. Pitfalls and Guardrails (Safety & Accuracy)**

1. **Avoid Absolute Medical Advice:** Use advisory language only (e.g., "Consider," "Review," "A potential adjustment would be").
2. **Avoid Diagnosis:** Do not use clinical diagnostic terms.
3. **Acknowledge Limits:** Clearly state when the cause is ambiguous due to the lack of exercise/carb data (e.g., use the "Time/Hormonal Shift" suspect category).

**4. Required Output Format (Column-Oriented JSON)**

Return your analysis using a **column-oriented JSON format** where column names are defined ONCE at the beginning, followed by data rows. This reduces redundancy and response size.

**CRITICAL RULES:**
1. Your response MUST contain valid JSON inside a \`\`\`json code block
2. Define columns ONCE in the "columns" array, then list data rows in "data" array
3. Each data row is an array of values in the SAME ORDER as columns
4. Use **eventId** to identify each event (matches \`Event_ID\` from the dataset, e.g., "E-001")
5. Do NOT include date, eventTime, or nadirValue - we already have this data
6. The **actionableInsight** should be concise (1 sentence) with a specific recommendation
7. For null values, use \`null\` (not "null" string)

**JSON Schema:**
\`\`\`json
{
  "columns": ["eventId", "primarySuspect", "mealTime", "actionableInsight"],
  "data": [
    ["E-001", "Category name", "HH:MM or null", "Detailed recommendation"]
  ]
}
\`\`\`

**Example output:**
\`\`\`json
{
  "columns": ["eventId", "primarySuspect", "mealTime", "actionableInsight"],
  "data": [
    ["E-001", "Basal Excess (Nocturnal)", null, "Consider reducing overnight basal by 10-15% between 01:00 and 04:00 when insulin sensitivity is highest."],
    ["E-002", "Bolus Overlap (B1+B2)", "12:45", "Consider waiting at least 3 hours between meal and correction boluses to prevent insulin stacking."]
  ]
}
\`\`\`

**Dataset: Hypoglycemic Events (hypo_events.csv)**

The dataset contains the following fields per event:
- \`Event_ID\`: Unique identifier for each event (use this in your response as "eventId")
- \`Start_Time\`: ISO 8601 timestamp when glucose dropped below threshold
- \`Nadir_Value_mg_dL\`: Lowest glucose value reached (in mg/dL)
- \`Duration_Mins\`: Total time glucose remained below threshold
- \`Max_RoC_mg_dL_min\`: Steepest 5-minute rate of glucose drop in 60 mins before event
- \`Time_To_Nadir_Mins\`: Time from start to nadir
- \`Initial_RoC_mg_dL_min\`: Rate of change in last 10 mins before start
- \`Last_Bolus_Units\`: Most recent bolus dose before event
- \`Last_Bolus_Mins_Prior\`: Minutes from last bolus to event start
- \`Second_Bolus_Units\`: Second-most recent bolus dose
- \`Second_Bolus_Mins_Prior\`: Minutes from second bolus to event start
- \`Programmed_Basal_U_hr\`: Standard basal rate for the hour
- \`Basal_Units_H5_Prior\`, \`Basal_Units_H3_Prior\`, \`Basal_Units_H1_Prior\`: Total basal in 5th, 3rd, 1st hour before event
- \`Time_of_Day_Code\`: Hour of day (0-23), used to identify nocturnal events
- \`G_T_Minus_60\`, \`G_T_Minus_30\`, \`G_T_Minus_10\`: Glucose readings 60, 30, 10 mins before start
- \`G_Nadir_Plus_15\`: Glucose reading 15 mins after nadir (proxy for treatment response)

\`\`\`csv
${eventsData}
\`\`\`

Base every statement on the provided data only. If something cannot be determined from the data, explicitly state "cannot be determined" in the actionableInsight field.

Address me directly using "you/your" language. Keep your response focused on the JSON output - a brief introduction is OK but the main content must be the JSON array inside a \`\`\`json code block. After your JSON response, add the marker "--- CONCLUSIO DATAE ---" to indicate you have completed the analysis. ${languageInstruction}${disclaimerInstruction}`;
}
