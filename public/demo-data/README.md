# Demo Data for GlookoDataWebApp

This folder contains demo datasets for the Glooko Data Web App. These datasets are based on real, anonymized continuous glucose monitoring (CGM) data from individuals with Type 1 Diabetes.

## Available Demo Datasets

The following 6 demo datasets are available, each based on real anonymized data from the AZT1D study:

1. **Joshua (Male, 25-45)** - `joshua-demo-data.zip`
   - Active lifestyle with moderate carb intake (35g/meal average)
   - Based on **Subject 5** from the AZT1D dataset
   - Average glucose: 134.6 mg/dL (7.5 mmol/L)
   - Characteristics: Good glucose control, 396 bolus entries showing active diabetes management

2. **Charles (Male, 45-65)** - `charles-demo-data.zip`
   - Regular schedule with balanced diet (47.6g/meal average)
   - Based on **Subject 12** from the AZT1D dataset
   - Average glucose: 135.6 mg/dL (7.5 mmol/L)
   - Characteristics: Excellent control, larger meals, exercise tracking enabled, balanced management approach

3. **Albert (Male, 65-85)** - `albert-demo-data.zip`
   - Retired with consistent routine
   - Based on **Subject 15** from the AZT1D dataset
   - Average glucose: 133.5 mg/dL (7.4 mmol/L)
   - Characteristics: Good control, extensive sleep mode tracking, stable and predictable patterns

4. **Hannah (Female, 25-45)** - `hannah-demo-data.zip`
   - Active lifestyle with varied schedule (28.3g/meal average)
   - Based on **Subject 13** from the AZT1D dataset
   - Average glucose: 134.8 mg/dL (7.5 mmol/L)
   - Characteristics: Excellent control, exercise tracking, efficient insulin use with fewer corrections needed

5. **Nancy (Female, 45-65)** - `nancy-demo-data.zip`
   - Professional with structured meals (26.1g/meal average)
   - Based on **Subject 20** from the AZT1D dataset
   - Average glucose: 133.2 mg/dL (7.4 mmol/L)
   - Characteristics: Good control, structured routine with 426 bolus entries, extensive sleep mode tracking

6. **Dorothy (Female, 65-85)** - `dorothy-demo-data.zip`
   - Retired with regular meal times (33.9g/meal average)
   - Based on **Subject 6** from the AZT1D dataset
   - Average glucose: 143.6 mg/dL (8.0 mmol/L)
   - Characteristics: Good control, fewer corrections needed, very consistent routine with extensive sleep tracking

## Data Format

Each demo dataset is provided as a ZIP file containing multiple CSV files:

- **cgm_data_1.csv, cgm_data_2.csv, cgm_data_3.csv** - Continuous glucose monitoring readings (in mmol/L)
- **bolus_data_1.csv** - Insulin bolus delivery records
- **basal_data_1.csv, basal_data_2.csv** - Basal insulin delivery records
- **alarms_data_1.csv** - CGM alarm records (placeholder)
- **bg_data_1.csv** - Blood glucose meter readings (placeholder)
- **carbs_data_1.csv** - Carbohydrate intake records (placeholder)
- **exercise_data_1.csv** - Exercise activity records (placeholder)
- **food_data_1.csv** - Food intake records (placeholder)
- **insulin_data_1.csv** - Manual insulin records (placeholder)
- **manual_insulin_data_1.csv** - Additional manual insulin records (placeholder)
- **medication_data_1.csv** - Medication records (placeholder)
- **notes_data_1.csv** - User notes (placeholder)

## Data Characteristics

### Subject Selection Criteria
The 6 subjects were carefully selected from the 25 available in the AZT1D dataset based on:
- **Good glucose control**: Average glucose between 130-145 mg/dL (7.2-8.0 mmol/L)
- **Data completeness**: At least 8,000 CGM readings (40+ days of data)
- **Diverse patterns**: Variety in meal sizes, insulin usage, and activity tracking
- **Representative personas**: Covering different age groups and lifestyle patterns
- **Real variability**: Each subject shows authentic day-to-day variations in diabetes management

### Natural Variability
Each dataset exhibits realistic day-to-day variability as observed in real T1D patients:
- Different pre-meal glucose levels each day
- Variable meal timing
- Natural fluctuations in post-meal glucose responses
- Varied overnight glucose patterns
- Realistic insulin dosing patterns

### Data Period
Each dataset contains approximately 4-8 weeks of continuous CGM data with:
- CGM readings every ~5 minutes (288 readings per day)
- Bolus insulin records for meals and corrections
- Continuous basal insulin delivery records

### Glucose Units
All glucose values in the demo datasets are provided in **mmol/L** (millimoles per liter), which is the standard unit used in many countries including the UK, Australia, and most of Europe.

To convert to mg/dL (used in the United States):
- **mg/dL = mmol/L × 18**
- Example: 5.5 mmol/L = 99 mg/dL

## Data Source and Attribution

### Original Data Source
These demo datasets are derived from the **AZT1D** (Arizona Type 1 Diabetes) dataset, which contains real-world CGM and insulin pump data from individuals with Type 1 Diabetes.

### Citation
If you use these demo datasets in research or publications, please cite the original AZT1D dataset:

**Khamesian, M., Behrouz, S., Amorim, A. C., Liu, Y., Jennings, M., & Moradi, H. (2025).**  
*AZT1D: A Multi-modal Dataset of 240 Days Sensor-Based and EHR Recordings from 25 Individuals with Type 1 Diabetes.*  
Available at: https://arxiv.org/abs/2506.14789  
DOI: [10.17632/gk9m674wcx.1](https://doi.org/10.17632/gk9m674wcx.1)

### License
The AZT1D dataset is available under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit to the original authors, provide a link to the license, and indicate if changes were made.

Full license text: https://creativecommons.org/licenses/by/4.0/

### Data Processing
The demo datasets in this folder have been processed from the original AZT1D data:
1. Selected subjects were anonymized and renamed to fictional personas
2. Glucose values were converted from mg/dL to mmol/L
3. Data was reformatted to match the Glooko export CSV structure
4. CGM data was split into multiple files to simulate multiple sensor sessions
5. Personally identifiable information was replaced with generic values

### Original Research Context
The AZT1D dataset was collected to support research in:
- Predictive modeling for glucose forecasting
- Personalized insulin dosing algorithms
- Pattern recognition in diabetes management
- Machine learning applications for T1D care

The data was collected from real patients using:
- Continuous Glucose Monitors (CGM)
- Insulin pumps with automated insulin delivery
- Electronic Health Records (EHR)

## Privacy and Ethical Considerations

- All data has been fully anonymized
- No personally identifiable information is included
- Patient names in the demo datasets are fictional
- Data collection was conducted with appropriate ethical approval
- Original data was collected at the Arizona State University

## Using Demo Data in the Application

To load demo data in the GlookoDataWebApp:

1. Navigate to the **Data Upload** page
2. Click the **"Load Demo Data"** button
3. Select one of the available demo datasets
4. The application will automatically extract and process the data
5. View reports, charts, and AI analysis based on the demo data

## Questions or Issues

For questions about:
- **The demo datasets**: Open an issue at https://github.com/iricigor/GlookoDataWebApp/issues
- **The original AZT1D dataset**: Contact the research team at Arizona State University or refer to the paper

## Acknowledgments

We gratefully acknowledge:
- The research team at Arizona State University for collecting and sharing the AZT1D dataset
- The individuals with Type 1 Diabetes who contributed their data to research
- The Creative Commons community for enabling open data sharing

---

**Last Updated**: November 2025  
**Demo Data Version**: 1.0  
**Based on**: AZT1D Dataset (Khamesian et al., 2025)
