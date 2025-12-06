/**
 * Pump Settings Verification AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * and verifying pump basal and correction settings.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';
import type { AIProvider } from '../../../utils/api/aiApi';
import { getLanguageInstruction, getDisclaimerInstruction } from './promptUtils';

/**
 * Generate AI prompt for pump settings verification analysis
 * 
 * @param base64CgmData - Base64 encoded CSV data with CGM readings (Timestamp, CGM Glucose Value)
 * @param base64BolusData - Base64 encoded CSV data with bolus insulin (Timestamp, Insulin Delivered)
 * @param base64BasalData - Base64 encoded CSV data with basal insulin (Timestamp, Insulin Delivered/Rate)
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @param provider - AI provider being used (optional)
 * @returns Formatted prompt for AI analysis
 */
export function generatePumpSettingsPrompt(
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
  
  // Unit-specific values
  const targetGlucose = unit === 'mg/dL' ? '110' : '6.1';
  const lowThreshold = unit === 'mg/dL' ? '70' : '3.9';
  const severeLowThreshold = unit === 'mg/dL' ? '54' : '3.0';
  const highThreshold = unit === 'mg/dL' ? '180' : '10.0';
  const severeHighThreshold = unit === 'mg/dL' ? '250' : '13.9';
  const isfConversionThreshold = unit === 'mg/dL' ? '9' : '0.5';
  const isfMinBG = unit === 'mg/dL' ? '126' : '7.0';
  
  return `**Data Context**
This analysis examines your CGM readings, bolus insulin records, and basal delivery data to infer your current pump settings (basal rates, ISF, ICR) and evaluate their effectiveness across different time segments, helping optimize your pump configuration for better glucose control.

**IMPORTANT FORMATTING RULES**
- Do NOT start your response with greetings like "Hello", "Good morning", "Good afternoon", or similar
- Do NOT include procedural statements like "I am analyzing", "Let me extract", "I will now look at", etc.
- Start directly with the analysis findings
- **Use tables wherever possible** to present data comparisons, statistics, and findings in a clear and structured format

**Time in Range Reference**
- Calculate overall TIR (% of readings in ${lowThreshold}–${highThreshold} ${unit} range) from the CGM data
- Use this as your reference value and verify all percentage calculations are consistent
- Ensure segmented TIR values align with overall TIR calculation

**IMPORTANT NOTE ON ESTIMATED SETTINGS**
This analysis estimates your pump settings from observed data. Since we are inferring these values rather than reading them directly from your pump, there is inherent uncertainty. For each estimated value, consider the implications if our estimate is higher or lower than your actual setting:

You are an expert endocrinologist and certified diabetes pump trainer with deep experience analyzing Medtronic, Tandem, Omnipod, and DIY Loop/APS data. I have three datasets:

1. **CGM sheet**: Columns: Timestamp, CGM Glucose Value (${unit}), [Serial Number]
2. **Bolus sheet**: Columns: Timestamp, Insulin Type, Blood Glucose Input (${unit}), Carbs Input (g), Carbs Ratio, Insulin Delivered (U), Initial Delivery (U), Extended Delivery (U), [Serial Number]
3. **Basal sheet**: Columns: Timestamp, Insulin Type, Duration (minutes), Percentage (%), Rate, Insulin Delivered (U), [Serial Number]

My target glucose is ${targetGlucose} ${unit}. I use different pump settings for day and night. I also want to compare **workdays (Mon–Fri)** vs **weekends (Sat–Sun)**.

Using ONLY the data, perform a complete, step-by-step analysis to INFER my current pump settings and evaluate control across all time segments. Do NOT assume any settings or boundaries — derive everything from the data.

Target BG: ${targetGlucose} ${unit}
Standard ranges:
- Hypo: <${lowThreshold} ${unit}
- Severe hypo: <${severeLowThreshold} ${unit}
- TIR: ${lowThreshold}–${highThreshold} ${unit}
- Hyper: >${highThreshold} ${unit}
- Severe hyper: >${severeHighThreshold} ${unit}

---

### STEP 1: Detect Day/Night Split (Timing Estimation)
- From "basal" sheet, extract all "Scheduled" entries with Rate > 0.
- Convert every 5–15 min delivery to instantaneous rate: Rate = Insulin Delivered / (time delta in hours).
- Round time to nearest 30 min, find the two most common rate clusters using simple mode per time-of-day bin.
- Use clustering (e.g., two dominant rate groups) to define:
  - **Day period**: higher basal rate block (contiguous)
  - **Night period**: lower basal rate block (contiguous)
- Report exact switch times: "Detected Day: HH:MM–HH:MM | Night: HH:MM–HH:MM"
- **Estimation Uncertainty**: Include a note explaining:
  - If the estimated day/night boundary is EARLIER than actual: Recommendations may incorrectly apply day settings during night hours, potentially causing hypoglycemia
  - If the estimated day/night boundary is LATER than actual: Recommendations may incorrectly apply night settings during day hours, potentially causing hyperglycemia

---

### STEP 2: Infer Basal Profile
- Using detected Day/Night periods:
  - Compute **median Rate (U/h)** in each period (not mode — median is more robust).
  - Report to two decimals: Day basal = ?.?? U/h, Night basal = ?.?? U/h
- **Estimation Uncertainty**: Include a note explaining:
  - If the estimated basal rate is HIGHER than actual: The patient may be receiving more insulin than we think, so recommendations to increase basal could cause hypoglycemia
  - If the estimated basal rate is LOWER than actual: The patient may be receiving less insulin than we think, so recommendations to decrease basal could cause hyperglycemia

---

### STEP 3: Infer Insulin Sensitivity Factor (ISF)
- From "bolus" sheet, extract **pure correction boluses**:
  - Carbs Input = 0 or blank
  - Blood Glucose Input ≥ ${isfMinBG} ${unit} (to avoid noise from low values)
  - Insulin Delivered ≥ 0.3 U (filter out micro-corrections)
  - No extended delivery or extended delivery = 0
- For each: ISF = (BG – ${targetGlucose}) / Insulin Delivered
- Compute **median ISF** separately for:
  - Day period
  - Night period
- If difference < ${isfConversionThreshold} ${unit} per U → report as **same ISF**
- Report: ISF = ?.? ${unit} per U (same / Day: ?.? / Night: ?.?)
- Also report 25th–75th percentile range and number of corrections used
- **Estimation Uncertainty**: Include a note explaining:
  - If the estimated ISF is HIGHER than actual: The patient is more sensitive than we think; correction recommendations may cause hypoglycemia
  - If the estimated ISF is LOWER than actual: The patient is less sensitive than we think; correction recommendations may be insufficient and cause hyperglycemia

---

### STEP 4: Validate ISF Accuracy
- Using inferred ISF:
  - Expected U = (BG – ${targetGlucose}) / ISF
  - Compare to Actual Insulin Delivered
- Report:
  - Median |Expected – Actual| (in units)
  - % within ±0.3 U
  - % over/under-delivered by >0.5 U
  - Systematic over- or under-delivery (if any)

---

### STEP 5: Infer Carb Ratio (ICR)
- From boluses with:
  - Carbs Input > 10 g
  - No extended bolus portion >30% of total (filter out combo/extended meal boluses)
- When pump recorded Carbs Ratio → take mode/median of recorded values (often very accurate)
- When not recorded → infer ICR = Carbs_Input / Insulin_Delivered (carb portion only)
- Report most common ICR overall and any obvious weekday vs weekend difference

---

### STEP 6: Define Time Segments
- Combine:
  - **Workday (Mon–Fri)** vs **Weekend (Sat–Sun)**
  - **Day period** vs **Night period**
- This creates **4 segments**:
  1. Workday Day
  2. Workday Night
  3. Weekend Day
  4. Weekend Night

---

### STEP 7: CGM Summary (Per Segment)
- From "cgm" sheet, compute for **each of the 4 segments** + **Overall** (use proper time-in-range math on 5-min data):
  - Mean glucose (${unit})
  - Standard deviation (SD)
  - Coefficient of Variation (CV %) = (SD / Mean) × 100
  - Time in Range (${lowThreshold}–${highThreshold} ${unit})
  - Time <${lowThreshold} ${unit}
  - Time <${severeLowThreshold} ${unit} (severe hypoglycemia — clinically important)
  - Time >${highThreshold} ${unit}
  - Time >${severeHighThreshold} ${unit} (severe hyperglycemia — clinically important)
  - GMI = 3.31 + 0.02392 × (mean glucose in mg/dL)
- Present in a clean table

---

### STEP 8: Are Settings Optimal? (Segmented Evaluation)
- Compare:
  - Is control **worse on weekends**? Statistically describe the differences.
  - Are **daytime highs** worse on workdays?
  - Are **night lows** more frequent on weekends?
- Diagnose and quantify:
  - Basal drift (rising/falling trends in CGM overnight)
  - Under-correction (high BG → insufficient bolus)
  - Over-correction (low BG after bolus)
  - Meal timing differences
  - Post-meal peaks >${highThreshold} ${unit} on weekends?
  - Overnight drift direction and magnitude
  - Frequency of hypoglycemia 02:00–06:00
  - Stacking corrections (multiple corrections <2h apart)
  - Late pre-bolus evidence (BG rising sharply at meal bolus time)

---

### STEP 9: Extended Recommendations
Provide **maximum 6 prioritized, data-backed changes** for:
1. **Basal rates** – e.g., "Increase Workday Day basal by 0.15–0.20 U/h (current median 1.10 → 1.30 U/h)"
2. **ISF** – e.g., "Tighten Weekend Day ISF from current ~2.8 to 2.2 ${unit}/U (corrections currently under-dose by median 0.6 U)"
3. **ICR** – e.g., "Lower ICR to 6–7 g/U on weekends (current effective ~9 g/U causing 2–3h peaks >${highThreshold} ${unit})"
4. **Behavioral adjustments** – e.g., "Pre-bolus meals by 20–25 min on weekends (average rise 3.8 ${unit} from meal announcement to bolus)"
5. **Temporary profiles** – e.g., "Create 'Weekend Day' profile: +15% basal 10:00–16:00" or "Consider temporary +20% basal profile Sat–Sun 10:00–16:00"

Be specific with numbers, times, and expected impact. Limit to 6 recommendations maximum to prevent overwhelming wall of text.

---

### FINAL OUTPUT FORMAT

DETECTED DAY/NIGHT SPLIT
Day: HH:MM–HH:MM | Night: HH:MM–HH:MM

INFERRED PUMP SETTINGS
Target: ${targetGlucose} ${unit}
ISF: ?.? ${unit} per U [same / Day: ?.? / Night: ?.?]
Basal: ?.?? U/h (Day), ?.?? U/h (Night)
ICR: ~? g/U (most common)

ISF VALIDATION
Median error: ?.?? U | % within ±0.3 U: ??%

CGM SUMMARY (4 SEGMENTS)
| Segment         | Mean  | SD   | CV%  | TIR   | <${lowThreshold} | <${severeLowThreshold} | >${highThreshold} | >${severeHighThreshold} | GMI  |
|-----------------|-------|------|------|-------|---------|---------|-------|---------|------|
| Overall         | ?.??  | ?.?? | ?.?  | ??%   | ??%     | ??%     | ??%   | ??%     | ?.?? |
| Workday Day     | ?.??  | ?.?? | ?.?  | ??%   | ??%     | ??%     | ??%   | ??%     | ?.?? |
| Workday Night   | ?.??  | ?.?? | ?.?  | ??%   | ??%     | ??%     | ??%   | ??%     | ?.?? |
| Weekend Day     | ?.??  | ?.?? | ?.?  | ??%   | ??%     | ??%     | ??%   | ??%     | ?.?? |
| Weekend Night   | ?.??  | ?.?? | ?.?  | ??%   | ??%     | ??%     | ??%   | ??%     | ?.?? |

SEGMENTED ASSESSMENT
• [Key insight 1 with statistical description of weekday/weekend differences]
• [Key insight 2]
• [Root cause with quantification]

RECOMMENDATIONS (ACTIONABLE - MAX 6 ITEMS)
1. Basal: [e.g., "Increase Workday Day basal from 1.3 → 1.5 U/h"]
2. ISF:   [e.g., "Keep 2.2 — accurate" or "Tighten to X from current Y"]
3. ICR:   [e.g., "Use 6 g/U on weekends"]
4. Timing: [e.g., "Pre-bolus 15–20 min for weekend meals"]
5. Profile: [e.g., "Create 'Weekend Day' temp profile: +0.3 U/h 09:00–15:00"]
6. [Optional 6th recommendation if highly impactful]

Be rigorous. Show calculations. Use tables. Derive everything from data only. Analyze rigorously with maximum statistical detail.

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
