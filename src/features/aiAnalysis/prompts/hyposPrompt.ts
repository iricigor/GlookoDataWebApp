/**
 * Hypoglycemia Analysis AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * hypoglycemia patterns, risk factors, and actionable recommendations.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';

/**
 * Generate AI prompt for hypoglycemia analysis
 * 
 * @param base64HypoEventsData - Base64 encoded CSV data with CGM readings around hypo events (+/-1 hour)
 * @param base64HypoSummaryData - Base64 encoded CSV data with daily hypo summaries
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit for response (mmol/L or mg/dL) - note: CSV data is always in mmol/L
 * @param provider - AI provider being used (optional)
 * @param base64HypoEventSummaryData - Base64 encoded CSV data with per-event summary including bolus info (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateHyposPrompt(
  base64HypoEventsData: string,
  base64HypoSummaryData: string,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider,
  base64HypoEventSummaryData?: string
): string {
  const hypoEventsData = base64Decode(base64HypoEventsData);
  const hypoSummaryData = base64Decode(base64HypoSummaryData);
  const hypoEventSummaryData = base64HypoEventSummaryData ? base64Decode(base64HypoEventSummaryData) : '';
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  // CSV data is always in mmol/L, but we show thresholds in both units for clarity
  // User's preferred display unit determines which unit to emphasize in the response
  const lowThresholdMmol = '3.9';
  const lowThresholdMgdl = '70';
  const veryLowThresholdMmol = '3.0';
  const veryLowThresholdMgdl = '54';
  const targetLowTime = '<4%';
  const targetVeryLowTime = '<1%';
  const lbgiLowRisk = '2.5';
  const lbgiModerateRisk = '5.0';
  
  // Format thresholds showing both units
  const lowThresholdDisplay = `${lowThresholdMmol} mmol/L (${lowThresholdMgdl} mg/dL)`;
  const veryLowThresholdDisplay = `${veryLowThresholdMmol} mmol/L (${veryLowThresholdMgdl} mg/dL)`;
  
  // User's preferred response unit
  const responseUnit = unit;
  
  // Build the hypo event summary dataset section if data is available
  const hypoEventSummarySection = hypoEventSummaryData ? `

**Dataset 3: Hypo Event Summary with Bolus Context (hypo_event_summary.csv)**
Per-event summary including the last bolus that occurred 2-4 hours before each hypo (if any).
This data helps identify the percentage of hypos that may be related to meal boluses.
**Important: All glucose values in the CSV are in mmol/L.**
\`\`\`csv
${hypoEventSummaryData}
\`\`\`` : '';
  
  return `**Data Context**
This analysis examines your hypoglycemia events and patterns to identify root causes, assess risk levels, and provide actionable recommendations for preventing low blood glucose episodes while maintaining good overall glycemic control.

**Role and Goal**
You are an expert endocrinologist specialized in type-1 diabetes and CGM/insulin pump data analysis. I am providing aggregated and anonymized data only — never guess or invent missing raw data points.

**Task**
Analyze hypoglycemia risk with focus on patterns, root causes and actionable recommendations.

**IMPORTANT FORMATTING RULES**
- Do NOT start your response with greetings like "Hello", "Good morning", "Good afternoon", or similar
- Do NOT include procedural statements like "I am analyzing", "Let me extract", "I will now look at", etc.
- Start directly with the analysis findings
- **Use tables wherever possible** to present data comparisons, statistics, and findings in a clear and structured format
- When presenting glucose values in your response, use ${responseUnit} as the preferred unit

**Reference Thresholds**
- Low glucose: <${lowThresholdDisplay}
- Very low glucose (severe): <${veryLowThresholdDisplay}
- Consensus targets: ${targetLowTime} time below low threshold, ${targetVeryLowTime} time below very low threshold
- LBGI risk levels: <${lbgiLowRisk} low risk, ${lbgiLowRisk}-${lbgiModerateRisk} moderate risk, >${lbgiModerateRisk} high risk

**Required Analysis and Findings**

**A. Current Hypoglycemia Risk Assessment**
Analyze the provided data and report:
- Overall LBGI (Low Blood Glucose Index) and interpretation
- Percentage of days with LBGI >${lbgiLowRisk} or >${lbgiModerateRisk}
- Frequency of severe hypos (nadir <${veryLowThresholdDisplay})
- Estimated % time below very low threshold based on the hypo event data
- Compare with consensus targets (${targetLowTime} <${lowThresholdDisplay}, ${targetVeryLowTime} <${veryLowThresholdDisplay}, LBGI <${lbgiLowRisk})
- Present summary in a table format

**B. Pattern Analysis**
Answer these exact questions with evidence from the data:

1. **Time-of-day distribution and risk periods**
   - Analyze hypo timing across these periods: Night (00:00–06:00), Morning (06:00–12:00), Afternoon (12:00–18:00), Evening (18:00–24:00)
   - Present as a table showing count and percentage by time period
   - Calculate if nocturnal hypos are overrepresented compared to daytime
   - **Identify specific high-risk time windows** (e.g., "Most hypos occur between 2-4 AM" or "Highest risk 3-5 hours after dinner")
   - Calculate the percentage of all hypos occurring in each period and highlight any period with disproportionate risk

2. **Glucose trajectory analysis (preceding factors)**
   From the CGM data before each hypo event, calculate and report:
   - **Rapid drop percentage**: What percentage of hypos were preceded by a rapid glucose drop (>1 mmol/L per 5min, or >18 mg/dL per 5min) in the 30 minutes before the hypo?
   - **Gradual decline percentage**: What percentage of hypos showed a gradual, sustained decline over 30-60 minutes before the hypo?
   - **Post-meal/bolus pattern**: What percentage of hypos occurred 2-4 hours after a bolus? (Use the "Last Bolus" data from the hypo event summary if provided)
   - Present these percentages in a summary table
   - Identify the most common trajectory pattern

3. **Active insulin stacking visible?**
   - Look for patterns suggesting high insulin-on-board at hypo start
   - Multiple rapid drops in close succession
   - If bolus data is available, check for multiple boluses within 2-4 hours before hypo

4. **Any days with clustering (>2 hypos/day)?**
   - Identify days with multiple hypo events
   - Analyze what happened on those specific days

5. **Recovery patterns**
   - Typical time to recover from hypo (return to >${lowThresholdDisplay})
   - Presence of rebound hyperglycemia after hypo treatment

**C. Risk Stratification**
Based on the analysis, classify current hypoglycemia risk as:
- **Low risk**: Few hypos, LBGI <${lbgiLowRisk}, meeting consensus targets
- **Moderate risk**: Regular mild hypos, LBGI ${lbgiLowRisk}-${lbgiModerateRisk}, some severe events
- **High risk**: Frequent hypos, LBGI >${lbgiModerateRisk}, multiple severe events
- **Very high risk**: Daily hypos, very high LBGI, frequent severe events, signs of hypoglycemia unawareness

Identify the biggest 1–3 levers to reduce hypo risk without worsening overall glucose control.

**D. Concrete, Prioritized, and Quantified Recommendations**
Provide 3-5 specific, actionable recommendations ranked by expected impact. Examples of the level of specificity expected:
- "Reduce lunch bolus carb ratio from 1:8 to 1:10 (if current pre-lunch hypos appear in data)"
- "Lower basal rates 23:00–04:00 by 15–20% (if X% of hypo time is nocturnal)"
- "Set extended bolus or square wave for high-fat meals (if post-meal hypos common)"
- "Consider moving to automated mode if LBGI high and nocturnal hypos indicate impaired awareness risk"

**Output Structure**

1. **Risk Summary Table**
   Present key metrics in a summary table

2. **Time Distribution Analysis**
   Show hypo frequency by time period (table format) and identify high-risk time windows

3. **Trajectory Analysis**
   Present a table showing percentage breakdown of hypo trajectories (rapid drop vs gradual decline vs post-bolus)

4. **Pattern Findings**
   Detailed answers to each pattern analysis question

5. **Risk Classification**
   Clear statement of risk level with supporting evidence

6. **Prioritized Recommendations**
   Numbered list of specific, quantified recommendations

Base every statement on the provided data only. If something cannot be determined from the data, explicitly state "cannot be determined from provided data".

**Dataset 1: Hypo Events with Surrounding CGM Data (hypo_events.csv)**
Each hypo event includes CGM readings from 1 hour before to 1 hour after the hypo period.
**Important: All glucose values in the CSV are in mmol/L.**
\`\`\`csv
${hypoEventsData}
\`\`\`

**Dataset 2: Daily Hypo Summaries (hypo_summaries.csv)**
Aggregated daily statistics including hypo counts, durations, nadirs, and LBGI.
**Important: All glucose values in the CSV are in mmol/L.**
\`\`\`csv
${hypoSummaryData}
\`\`\`${hypoEventSummarySection}

All glucose values in the provided CSV data are in mmol/L. When presenting values in your response, please use ${responseUnit} as the preferred unit (convert if needed: 1 mmol/L = 18 mg/dL). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable. ${languageInstruction}${disclaimerInstruction}`;
}
