/**
 * Pump Settings Verification AI prompt generation
 * 
 * This module provides the prompt generation logic for analyzing
 * and verifying pump basal and correction settings.
 */

import { base64Decode } from '../../../utils/formatting';
import type { ResponseLanguage } from '../../../hooks/useResponseLanguage';
import type { GlucoseUnit } from '../../../types';

/**
 * Generate AI prompt for pump settings verification analysis
 * 
 * @param base64CgmData - Base64 encoded CSV data with CGM readings (Timestamp, CGM Glucose Value)
 * @param base64BolusData - Base64 encoded CSV data with bolus insulin (Timestamp, Insulin Delivered)
 * @param base64BasalData - Base64 encoded CSV data with basal insulin (Timestamp, Insulin Delivered/Rate)
 * @param language - Response language (english, czech, german, or serbian)
 * @param unit - Glucose unit (mmol/L or mg/dL)
 * @returns Formatted prompt for AI analysis
 */
export function generatePumpSettingsPrompt(
  base64CgmData: string,
  base64BolusData: string,
  base64BasalData: string,
  language: ResponseLanguage = 'english',
  unit: GlucoseUnit = 'mmol/L'
): string {
  const cgmData = base64Decode(base64CgmData);
  const bolusData = base64Decode(base64BolusData);
  const basalData = base64Decode(base64BasalData);
  let languageInstruction = 'Respond in English.';
  
  if (language === 'czech') {
    languageInstruction = 'Respond in Czech language (česky).';
  } else if (language === 'german') {
    languageInstruction = 'Respond in German language (auf Deutsch).';
  } else if (language === 'serbian') {
    languageInstruction = 'Respond in Serbian language using Latin script (na srpskom latiničnim pismom).';
  }
  
  // Unit-specific values
  const targetGlucose = unit === 'mg/dL' ? '110' : '6.1';
  const lowThreshold = unit === 'mg/dL' ? '70' : '3.9';
  const highThreshold = unit === 'mg/dL' ? '180' : '10.0';
  const isfConversionThreshold = unit === 'mg/dL' ? '9' : '0.5';
  
  return `You are an expert diabetes data analyst. I have three datasets:

1. **CGM sheet**: Columns: Timestamp, CGM Glucose Value (${unit}), [Serial Number]
2. **Bolus sheet**: Columns: Timestamp, Insulin Type, Blood Glucose Input (${unit}), Carbs Input (g), Carbs Ratio, Insulin Delivered (U), Initial Delivery (U), Extended Delivery (U), [Serial Number]
3. **Basal sheet**: Columns: Timestamp, Insulin Type, Duration (minutes), Percentage (%), Rate, Insulin Delivered (U), [Serial Number]

My target glucose is ${targetGlucose} ${unit}. I use different pump settings for day and night. I also want to compare **workdays (Mon–Fri)** vs **weekends (Sat–Sun)**.

Using ONLY the data, perform a complete, step-by-step analysis to INFER my current pump settings and evaluate control across all time segments. Do NOT assume any settings or boundaries — derive everything from the data.

---

### STEP 1: Detect Day/Night Split
- From "basal" sheet, extract all "Scheduled" entries with Rate > 0.
- Group by start time (HH:MM).
- Use clustering (e.g., two dominant rate groups) to define:
  - **Day period**: higher basal rate block
  - **Night period**: lower basal rate block
- Report: "Detected Day: HH:MM–HH:MM | Night: HH:MM–HH:MM"

---

### STEP 2: Infer Basal Profile
- Using detected Day/Night periods:
  - Compute **most frequent Rate (U/h)** in each.
  - Report: Day basal = ?.? U/h, Night basal = ?.? U/h

---

### STEP 3: Infer Insulin Sensitivity Factor (ISF)
- From "bolus" sheet, extract **pure correction boluses**:
  - Carbs Input = 0
  - Blood Glucose Input > 6.1 and not blank
  - Insulin Delivered > 0
  - No extended delivery
- For each: ISF = (BG – ${targetGlucose}) / Insulin Delivered
- Compute **median ISF** separately for:
  - Day period
  - Night period
- If difference < ${isfConversionThreshold} ${unit} per U → report as **same ISF**
- Report: ISF = ?.? ${unit} per U (same / Day: ?.? / Night: ?.?)

---

### STEP 4: Validate ISF Accuracy
- Using inferred ISF:
  - Expected U = (BG – ${targetGlucose}) / ISF
  - Compare to Actual Insulin Delivered
- Report:
  - Median |Expected – Actual|
  - % within ±0.3 U
  - % over/under-delivered by >0.5 U

---

### STEP 5: Infer Carb Ratio (ICR)
- From boluses with Carbs Input > 0 and Carbs Ratio not blank:
  - Report most frequent value
- Report: ICR ≈ ? g/U

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
- From "cgm" sheet, compute for **each of the 4 segments** + **Overall**:
  - Average glucose
  - Standard deviation
  - Time in Range (${lowThreshold}–${highThreshold} ${unit})
  - Time <${lowThreshold} ${unit}
  - Time >${highThreshold} ${unit}
  - GMI = 3.31 + 0.02392 × (mean glucose in mg/dL)

---

### STEP 8: Are Settings Optimal? (Segmented Evaluation)
- Compare:
  - Is control **worse on weekends**?
  - Are **daytime highs** worse on workdays?
  - Are **night lows** more frequent on weekends?
- Diagnose:
  - Basal drift (rising/falling trends in CGM)
  - Under-correction (high BG → insufficient bolus)
  - Over-correction (low BG after bolus)
  - Meal timing differences

---

### STEP 9: Extended Recommendations
Provide **specific, data-backed changes** for:
1. **Basal rates** – e.g., "Increase Workday Day basal by 0.2 U/h"
2. **ISF** – e.g., "Tighten Weekend Day ISF to 2.0"
3. **ICR** – e.g., "Use 6 g/U on weekends"
4. **Behavioral adjustments** – e.g., "Pre-bolus 20 min on weekends"
5. **Temporary profiles** – e.g., "Create 'Weekend Day' profile: +15% basal 10:00–16:00"

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
| Segment         | Avg   | TIR   | >10   | <3.9  | GMI  |
|-----------------|-------|-------|-------|-------|------|
| Overall         | ?.??  | ??%   | ??%   | ??%   | ?.?? |
| Workday Day     | ?.??  | ??%   | ??%   | ??%   | ?.?? |
| Workday Night   | ?.??  | ??%   | ??%   | ??%   | ?.?? |
| Weekend Day     | ?.??  | ??%   | ??%   | ??%   | ?.?? |
| Weekend Night   | ?.??  | ??%   | ??%   | ??%   | ?.?? |

SEGMENTED ASSESSMENT
• [Key insight 1]
• [Key insight 2]
• [Root cause]

RECOMMENDATIONS (ACTIONABLE)
1. Basal: [e.g., "Increase Workday Day basal from 1.3 → 1.5 U/h"]
2. ISF:   [e.g., "Keep 2.2 — accurate"]
3. ICR:   [e.g., "Use 6 g/U on weekends"]
4. Timing: [e.g., "Pre-bolus 15–20 min for weekend meals"]
5. Profile: [e.g., "Create 'Weekend Day' temp profile: +0.3 U/h 09:00–15:00"]

Be rigorous. Show calculations. Use tables. Derive everything from data only.

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

Remember that all glucose values are in ${unit} (not ${unit === 'mg/dL' ? 'mmol/L' : 'mg/dL'}). Address me directly using "you/your" language. Keep your response clear, detailed, and actionable. ${languageInstruction}

IMPORTANT: End your response with "--- END OF ANALYSIS ---" on a new line to confirm your analysis is complete.`;
}
