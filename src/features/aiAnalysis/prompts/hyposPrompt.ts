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
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generateHyposPrompt(
  base64HypoEventsData: string,
  base64HypoSummaryData: string,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L',
  provider?: AIProvider
): string {
  const hypoEventsData = base64Decode(base64HypoEventsData);
  const hypoSummaryData = base64Decode(base64HypoSummaryData);
  const languageInstruction = getLanguageInstruction(language);
  const disclaimerInstruction = getDisclaimerInstruction(provider, language);
  
  // Unit-specific values
  const lowThreshold = unit === 'mg/dL' ? '70' : '3.9';
  const veryLowThreshold = unit === 'mg/dL' ? '54' : '3.0';
  const targetLowTime = '<4%';
  const targetVeryLowTime = '<1%';
  const lbgiLowRisk = '2.5';
  const lbgiModerateRisk = '5.0';
  
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

**Reference Thresholds**
- Low glucose: <${lowThreshold} ${unit}
- Very low glucose (severe): <${veryLowThreshold} ${unit}
- Consensus targets: ${targetLowTime} time <${lowThreshold} ${unit}, ${targetVeryLowTime} time <${veryLowThreshold} ${unit}
- LBGI risk levels: <${lbgiLowRisk} low risk, ${lbgiLowRisk}-${lbgiModerateRisk} moderate risk, >${lbgiModerateRisk} high risk

**Required Analysis and Findings**

**A. Current Hypoglycemia Risk Assessment**
Analyze the provided data and report:
- Overall LBGI (Low Blood Glucose Index) and interpretation
- Percentage of days with LBGI >${lbgiLowRisk} or >${lbgiModerateRisk}
- Frequency of severe hypos (nadir <${veryLowThreshold} ${unit})
- Estimated % time <${veryLowThreshold} ${unit} based on the hypo event data
- Compare with consensus targets (${targetLowTime} <${lowThreshold}, ${targetVeryLowTime} <${veryLowThreshold}, LBGI <${lbgiLowRisk})
- Present summary in a table format

**B. Pattern Analysis**
Answer these exact questions with evidence from the data:

1. **Time-of-day distribution**
   - Nocturnal hypos (00:00–06:00) vs daytime hypos
   - Present as a table showing count and percentage by time period
   - Calculate if nocturnal hypos are overrepresented compared to daytime

2. **Most common preceding factors** (from CGM trajectory before hypo):
   - Rapid glucose drop (>1 ${unit}/5min) before hypo
   - Gradual decline over extended period
   - Post-meal pattern (bolus within 2-4h before hypo)
   - Identify any patterns from the glucose data before each hypo event

3. **Active insulin stacking visible?**
   - Look for patterns suggesting high insulin-on-board at hypo start
   - Multiple rapid drops in close succession

4. **Any days with clustering (>2 hypos/day)?**
   - Identify days with multiple hypo events
   - Analyze what happened on those specific days

5. **Recovery patterns**
   - Typical time to recover from hypo (return to >${lowThreshold} ${unit})
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
   Show hypo frequency by time period (table format)

3. **Pattern Findings**
   Detailed answers to each pattern analysis question

4. **Risk Classification**
   Clear statement of risk level with supporting evidence

5. **Prioritized Recommendations**
   Numbered list of specific, quantified recommendations

Base every statement on the provided data only. If something cannot be determined from the data, explicitly state "cannot be determined from provided data".

**Dataset 1: Hypo Events with Surrounding CGM Data (hypo_events.csv)**
Each hypo event includes CGM readings from 1 hour before to 1 hour after the hypo period:
\`\`\`csv
${hypoEventsData}
\`\`\`

**Dataset 2: Daily Hypo Summaries (hypo_summaries.csv)**
Aggregated daily statistics including hypo counts, durations, nadirs, and LBGI:
\`\`\`csv
${hypoSummaryData}
\`\`\`

Remember that all glucose values are in ${unit} (not ${unit === 'mg/dL' ? 'mmol/L' : 'mg/dL'}). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable. ${languageInstruction}${disclaimerInstruction}`;
}
