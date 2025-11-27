# GlucoStats Library Comparison

**Analysis Date:** November 27, 2025

This document compares the statistics implemented in GlookoDataWebApp with the [GlucoStats Python library](https://glucostats.readthedocs.io/en/latest/), identifying gaps and recommending the most useful statistics to implement.

## Overview

The GlucoStats Python library provides 59 CGM-derived statistics organized into 6 categories and 16 subcategories. This comparison identifies which statistics are already implemented in GlookoDataWebApp and which would be most valuable to add.

## Statistics Comparison

### ✅ Already Implemented in GlookoDataWebApp

| Statistic | GlucoStats Name | GlookoDataWebApp Location | Notes |
|-----------|-----------------|---------------------------|-------|
| Mean Glucose | `mean` | `glucoseRangeUtils.ts` → `calculateAverageGlucose()` | ✅ Implemented |
| Standard Deviation | `std` | `rocDataUtils.ts` → `calculateRoCStats()` → `sdRoC` | ✅ Implemented for RoC |
| Min/Max Glucose | `min`, `max` | `rocDataUtils.ts` → `calculateRoCStats()` | ✅ Implemented for RoC |
| Time in Range (TIR) | `pt_ir` | `glucoseRangeUtils.ts` → `calculateGlucoseRangeStats()` | ✅ Implemented as percentage |
| Time Above Range (TAR) | `pt_ar` | `glucoseRangeUtils.ts` | ✅ Implemented (high/veryHigh) |
| Time Below Range (TBR) | `pt_br` | `glucoseRangeUtils.ts` | ✅ Implemented (low/veryLow) |
| Estimated HbA1c (GMI) | `gmi`, `eA1C` | `glucoseRangeUtils.ts` → `calculateEstimatedHbA1c()` | ✅ Implemented |
| Coefficient of Variation (CV) | `cv` | Derivable from existing stats | ⚠️ Partially - could add explicit calculation |
| Rate of Change (RoC) | Related to variability | `rocDataUtils.ts` | ✅ Comprehensive implementation |
| Hypoglycemia Detection | Related to control stats | `hypoDataUtils.ts` | ✅ Implemented with episode detection |
| Percentiles (p10, p25, p50, p75, p90) | `quartile_*` | `AGPGraph.tsx` → AGP report | ✅ Implemented for AGP visualization |

### 🔶 Partially Implemented / Could Be Enhanced

| Statistic | GlucoStats Name | Current State | Enhancement Needed |
|-----------|-----------------|---------------|-------------------|
| CV% | `cv` | Derivable from existing stats | Add explicit CV calculation and display |
| IQR (Interquartile Range) | `iqr` | Calculated in AGP but not displayed | Add as summary metric |
| Daily Pattern Analysis | `time_in_ranges` with windowing | Basic day-of-week grouping exists | Add temporal pattern analysis |

### ❌ Not Implemented (Recommended Additions)

#### Priority 1: High Clinical Value, Low Implementation Complexity

| Statistic | Description | Clinical Value | Complexity |
|-----------|-------------|----------------|------------|
| **Coefficient of Variation (CV%)** | SD/Mean × 100, target ≤36% | High - standard CGM metric | Low |
| **Glucose Management Indicator (GMI)** | Already have `calculateEstimatedHbA1c()`, same formula | High - display standardization | Low |
| **LBGI (Low Blood Glucose Index)** | Risk index for hypoglycemia | High - risk assessment | Medium |
| **HBGI (High Blood Glucose Index)** | Risk index for hyperglycemia | High - risk assessment | Medium |
| **BGRI (Blood Glucose Risk Index)** | LBGI + HBGI combined | High - overall risk | Low (after LBGI/HBGI) |

#### Priority 2: Medium Clinical Value, Medium Implementation Complexity

| Statistic | Description | Clinical Value | Complexity |
|-----------|-------------|----------------|------------|
| **MAGE (Mean Amplitude of Glycemic Excursions)** | Average of significant glucose swings | Medium - variability metric | Medium |
| **J-Index** | 0.001 × (Mean + SD)² | Medium - combined control metric | Low |
| **GRI (Glycemia Risk Index)** | Weighted hypo/hyper risk score | Medium - composite risk | Medium |
| **GRADE (Glycemic Risk Assessment)** | Risk score with hypo/eu/hyper breakdown | Medium - risk stratification | Medium |
| **MAG (Mean Absolute Glucose change)** | Sum of |ΔG| / total time | Medium - variability | Low |

#### Priority 3: Advanced/Research Metrics

| Statistic | Description | Clinical Value | Complexity |
|-----------|-------------|----------------|------------|
| **MODD (Mean of Daily Differences)** | Day-to-day variability | Research | High |
| **CONGA (Continuous Overall Net Glycemic Action)** | n-hour glucose SD | Research | High |
| **DFA (Detrended Fluctuation Analysis)** | Fractal/complexity analysis | Research | High |
| **Entropy** | Signal complexity measure | Research | High |
| **AUC (Area Under Curve)** | Above/below threshold | Medium | Medium |
| **GVP (Glycemic Variability Percentage)** | CGM trace length normalized | Research | Medium |

## Detailed Recommendations

### 1. Coefficient of Variation (CV%)

**What it is:** CV = (Standard Deviation / Mean) × 100

**Why it's important:**
- Standard CGM metric recommended by international consensus
- Target: ≤36% indicates stable glycemic control
- >36% indicates high glycemic variability and increased hypoglycemia risk

**Implementation:**
```typescript
export function calculateCV(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  const mean = calculateAverageGlucose(readings);
  if (!mean || mean === 0) return null;
  
  // Calculate sample standard deviation (using n-1 for sample variance)
  const sumSquaredDiffs = readings.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0);
  const sd = Math.sqrt(sumSquaredDiffs / (readings.length - 1));
  
  return (sd / mean) * 100;
}
```

### 2. LBGI & HBGI (Blood Glucose Indices)

**What they are:**
- LBGI: Measures risk of hypoglycemia
- HBGI: Measures risk of hyperglycemia
- Based on symmetric transformation of glucose scale

**Why they're important:**
- Validated risk indices used in diabetes research
- Predict future hypoglycemic events
- Provide asymmetric risk assessment (lows are weighted more heavily)

**Formula (GlucoStats implementation):**
```python
# Note: Input validation should ensure glucose_mg_dl > 0 to avoid log(0) errors
# Formula is based on the Kovatchev risk function
risk = ((np.log(glucose_mg_dl) ** 1.084) - 5.381) * 1.509
risk_l = 10 * (risk ** 2) if risk < 0 else 0  # LBGI component
risk_h = 10 * (risk ** 2) if risk > 0 else 0  # HBGI component
LBGI = mean(risk_l)
HBGI = mean(risk_h)
```

### 3. MAGE (Mean Amplitude of Glycemic Excursions)

**What it is:** Average amplitude of significant glucose excursions (peaks > 1 SD from mean)

**Why it's important:**
- Captures postprandial glucose spikes
- Differentiates between stable and oscillating glucose patterns
- More clinically meaningful than simple SD in some contexts

**Implementation complexity:** Medium - requires peak/nadir detection algorithm

### 4. J-Index

**What it is:** J = 0.001 × (Mean + SD)²

**Why it's important:**
- Simple composite metric combining average and variability
- Higher values indicate poorer control
- Easy to calculate and interpret

**Implementation:**
```typescript
export function calculateJIndex(readings: GlucoseReading[]): number | null {
  const mean = calculateAverageGlucose(readings);
  if (!mean || readings.length < 2) return null;
  
  // Calculate sample standard deviation (using n-1 for sample variance)
  const sumSquaredDiffs = readings.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0);
  const sd = Math.sqrt(sumSquaredDiffs / (readings.length - 1));
  
  // Convert to mg/dL for standard J-index calculation
  // Conversion factor: 1 mmol/L = 18.0182 mg/dL (molecular weight of glucose / 10)
  const MMOL_TO_MGDL = 18.0182;
  const meanMgdl = mean * MMOL_TO_MGDL;
  const sdMgdl = sd * MMOL_TO_MGDL;
  
  return 0.001 * Math.pow(meanMgdl + sdMgdl, 2);
}
```

## Implementation Roadmap

### Phase 1: Quick Wins (Low complexity, High value)
1. ✅ CV% - Add to BGOverviewReport
2. ✅ Standardize GMI display (already have formula)
3. ✅ J-Index - Simple calculation

### Phase 2: Risk Indices (Medium complexity, High value)
1. LBGI/HBGI/BGRI - New risk assessment section
2. GRI - Weighted risk score

### Phase 3: Advanced Variability (Medium-High complexity)
1. MAGE - Peak detection algorithm
2. MAG - Cumulative glucose changes

### Phase 4: Research Metrics (High complexity, research value)
1. MODD, CONGA - Day-to-day patterns
2. DFA, Entropy - Complexity analysis

## GlucoStats Full Statistics List (59 metrics)

Based on the GlucoStats source code, here are all 59 metrics organized by category:

### 1. Descriptive Statistics (13 metrics)
- `mean`, `mean_ir`, `mean_ar`, `mean_br`, `mean_or`
- `max`, `min`, `max_diff`
- `std`, `quartile_0.25`, `quartile_0.5`, `quartile_0.75`, `iqr`
- `dfa` (Detrended Fluctuation Analysis)
- `entropy`
- `auc` (Area Under Curve)

### 2. Variability Statistics (6 metrics)
- `dt` (Distance Travelled)
- `mag` (Mean Absolute Glucose)
- `gvp` (Glycemic Variability Percentage)
- `cv` (Coefficient of Variation)
- `mage` (Mean Amplitude of Glycemic Excursions)
- `ef` (Excursion Frequency)

### 3. Risk Statistics (12 metrics)
- `lbgi`, `hbgi`, `max_lbgi`, `max_hbgi`, `bgri`
- `vlow`, `low`, `high`, `vhigh`, `gri`
- `grade`, `grade_hypo`, `grade_eu`, `grade_hyper`

### 4. Control Statistics (8 metrics)
- `hypo_index`, `hyper_index`, `igc`
- `gmi`, `eA1C`
- `m_value`, `j_index`

### 5. Time Statistics (8 metrics)
- `t_ir`, `t_ar`, `t_br`, `t_or` (time in minutes)
- `pt_ir`, `pt_ar`, `pt_br`, `pt_or` (percentages)

### 6. Observation Statistics (8 metrics)
- `n_ir`, `n_ar`, `n_br`, `n_or` (counts)
- `pn_ir`, `pn_ar`, `pn_br`, `pn_or` (percentages)

## Conclusion

GlookoDataWebApp already implements the most essential CGM statistics (TIR, TAR, TBR, HbA1c estimation, percentiles). The most valuable additions would be:

1. **CV%** - Standard consensus metric, easy to implement
2. **LBGI/HBGI** - Important risk indices
3. **J-Index** - Simple composite metric
4. **MAGE** - Captures glucose variability patterns

These additions would bring the application closer to clinical CGM reporting standards while maintaining the current user-friendly interface.

## References

- [GlucoStats Documentation](https://glucostats.readthedocs.io/en/latest/)
- [GlucoStats GitHub Repository](https://github.com/ai4healthurjc/GlucoStats)
- [International Consensus on CGM Metrics (Battelino et al., 2019)](https://diabetesjournals.org/care/article/42/8/1593/36174/Clinical-Targets-for-Continuous-Glucose-Monitoring)
- [CGM Metrics for Clinical Practice (ADA Standards of Care)](https://diabetesjournals.org/care)
