# Demo Data for GlookoDataWebApp

This folder contains demo datasets for the Glooko Data Web App. These datasets are based on real, anonymized continuous glucose monitoring (CGM) data from individuals with Type 1 Diabetes.

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

### Important Notes
- **Fictional Names**: The persona names (Joshua, Charles, Albert, Hannah, Nancy, Dorothy) are randomly selected popular names and are not related to the actual subjects in the AZT1D dataset. They are used solely for easier identification of different demo datasets.
- **Anonymized Data**: All data has been fully anonymized. No personally identifiable information is included.
- **Verified Demographics**: Subject selections were verified against demographic data published in Table I of the AZT1D paper to ensure accurate age and gender representation.

## Available Demo Datasets

The following 8 demo datasets are available, each based on real anonymized data from the AZT1D study with verified demographics from Table I of the published paper:

### English Demo Datasets (mmol/L units)

1. **Joshua (Male, 25-45)** - `joshua-demo-data.zip`
   - Active lifestyle with moderate carb intake
   - Based on **Subject 7** from the AZT1D dataset
   - Demographics: Male, Age 36, A1c 6.8%
   - Average glucose: 142.5 mg/dL (7.9 mmol/L)
   - Characteristics: Good control, 716 bolus entries, many small meals (13.3g/meal avg), active management

2. **Charles (Male, 45-65)** - `charles-demo-data.zip`
   - Regular schedule with balanced diet
   - Based on **Subject 11** from the AZT1D dataset
   - Demographics: Male, Age 59, A1c 7.3%
   - Average glucose: 166.3 mg/dL (9.2 mmol/L)
   - Characteristics: Good control, larger meals (64.2g/meal avg), 687 bolus entries, consistent routine

3. **Albert (Male, 65-85)** - `albert-demo-data.zip`
   - Retired with consistent routine
   - Based on **Subject 18** from the AZT1D dataset
   - Demographics: Male, Age 65, A1c 6.9%
   - Average glucose: 152.1 mg/dL (8.4 mmol/L)
   - Characteristics: Good control, sleep mode tracking, moderate meals (28.3g/meal avg), stable patterns

4. **Hannah (Female, 25-45)** - `hannah-demo-data.zip`
   - Active lifestyle with varied schedule
   - Based on **Subject 14** from the AZT1D dataset
   - Demographics: Female, Age 32, A1c 5.0%
   - Average glucose: 107.5 mg/dL (6.0 mmol/L)
   - Characteristics: Excellent control (lowest A1c in dataset), exercise tracking, balanced meals (25.3g/meal avg)

5. **Nancy (Female, 45-65)** - `nancy-demo-data.zip`
   - Professional with structured meals
   - Based on **Subject 20** from the AZT1D dataset
   - Demographics: Female, Age 61, A1c 6.7%
   - Average glucose: 133.2 mg/dL (7.4 mmol/L)
   - Characteristics: Good control, structured routine with 426 bolus entries, extensive sleep mode tracking

6. **Dorothy (Female, 65-85)** - `dorothy-demo-data.zip`
   - Retired with regular meal times
   - Based on **Subject 6** from the AZT1D dataset
   - Demographics: Female, Age 77, A1c 6.6%
   - Average glucose: 143.6 mg/dL (8.0 mmol/L)
   - Characteristics: Good control, fewer corrections needed, very consistent routine with extensive sleep tracking

### German Demo Datasets (mg/dL units)

These datasets use **German column headers** and **mg/dL** glucose units, as typically exported from Glooko in German-speaking regions.

7. **Stefan (Male, 25-45)** - `stefan-demo-data.zip`
   - Active lifestyle with consistent management
   - Based on **Subject 10** from the AZT1D dataset
   - **Language**: German column headers (Zeitstempel, CGM-Glukosewert, etc.)
   - **Units**: mg/dL for glucose values
   - Characteristics: Good glucose control, ~12,000 CGM readings, ~475 bolus entries

8. **Anja (Female, 25-45)** - `anja-demo-data.zip`
   - Professional with structured routine
   - Based on **Subject 15** from the AZT1D dataset
   - **Language**: German column headers (Zeitstempel, CGM-Glukosewert, etc.)
   - **Units**: mg/dL for glucose values
   - Characteristics: Good glucose control, ~15,800 CGM readings, ~390 bolus entries

## Data Format

### English Datasets (mmol/L)

Each English demo dataset is provided as a ZIP file containing multiple CSV files with **English column headers** and glucose values in **mmol/L**:

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

### German Datasets (mg/dL)

Each German demo dataset (Stefan, Anja) uses **German column headers** and glucose values in **mg/dL**:

- **cgm_data_1.csv, cgm_data_2.csv, cgm_data_3.csv** - CGM readings with German headers:
  - `Zeitstempel` (Timestamp)
  - `CGM-Glukosewert (mg/dl)` (CGM Glucose Value in mg/dL)
  - `Seriennummer` (Serial Number)

- **bolus_data_1.csv** - Insulin bolus records with German headers:
  - `Zeitstempel` (Timestamp)
  - `Insulin-Typ` (Insulin Type)
  - `Blutzuckereingabe (mg/dl)` (Blood Glucose Input in mg/dL)
  - `Kohlenhydrataufnahme (g)` (Carbohydrate Intake in g)
  - `Abgegebenes Insulin (E)` (Delivered Insulin in units)

- **basal_data_1.csv, basal_data_2.csv** - Basal insulin with German headers:
  - `Zeitstempel` (Timestamp)
  - `Insulin-Typ` (Insulin Type)
  - `Dauer (Minuten)` (Duration in minutes)
  - `Rate` (Rate)
  - `Abgegebenes Insulin (E)` (Delivered Insulin in units)

- Other placeholder files with German headers (alarms, bg, carbs, exercise, food, insulin, manual_insulin, medication, notes)

## Data Characteristics

### Subject Selection Criteria

**English Datasets (6 subjects):**
The 6 English demo subjects were carefully selected from the 25 available in the AZT1D dataset based on:
- **Verified demographics**: Age and gender matched against Table I from the published paper (Khamesian et al., 2025)
- **Good glucose control**: A1c between 5.0-7.3%, representing well-managed Type 1 Diabetes
- **Data completeness**: At least 8,000 CGM readings (40+ days of continuous data)
- **Diverse patterns**: Variety in meal sizes, insulin usage, and activity tracking
- **Representative personas**: Covering different age groups (27-80 years) and lifestyle patterns
- **Real variability**: Each subject shows authentic day-to-day variations in diabetes management

**German Datasets (2 subjects):**
The 2 German demo subjects (Stefan, Anja) were selected to:
- **Test German language support**: Validate that the app correctly handles German column headers
- **Test mg/dL units**: Ensure proper conversion and display of glucose values in mg/dL
- **Provide variety**: Use different subjects than the English datasets
- **Authentic data**: Based on real anonymized CGM data from different AZT1D subjects

**Note on age/gender matching**: Subject selections were verified against the demographic data published in Table I of the AZT1D paper to ensure accurate representation of the intended age ranges and genders.

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

**English Datasets (Joshua, Charles, Albert, Hannah, Nancy, Dorothy):**
All glucose values are provided in **mmol/L** (millimoles per liter), which is the standard unit used in many countries including the UK, Australia, and most of Europe.

**German Datasets (Stefan, Anja):**
All glucose values are provided in **mg/dL** (milligrams per deciliter), which is commonly used in German-speaking countries and the United States.

**Unit Conversion:**
- **mg/dL = mmol/L × 18**
- Example: 5.5 mmol/L = 99 mg/dL
- **mmol/L = mg/dL ÷ 18**
- Example: 180 mg/dL = 10.0 mmol/L

**Note:** The GlookoDataWebApp automatically detects the glucose units from the import file and converts them as needed. Users can also toggle between mmol/L and mg/dL display in the Settings page.

## Data Processing

The demo datasets in this folder have been processed from the original AZT1D data:

**English Datasets (Joshua, Charles, Albert, Hannah, Nancy, Dorothy):**
1. Selected subjects were anonymized and renamed to fictional personas (names are randomly selected and not related to actual subjects)
2. Glucose values were converted from mg/dL to mmol/L
3. Data was reformatted to match the Glooko export CSV structure with English headers
4. CGM data was split into multiple files to simulate multiple sensor sessions
5. Personally identifiable information was replaced with generic values

**German Datasets (Stefan, Anja):**
1. Selected subjects were anonymized and renamed to fictional German personas
2. Glucose values were kept in mg/dL (as typically exported from German Glooko)
3. Data was reformatted with **German column headers** (Zeitstempel, CGM-Glukosewert, Insulin-Typ, etc.)
4. CGM data was split into multiple files to simulate multiple sensor sessions
5. Personally identifiable information was replaced with generic values

## Original Research Context
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
- Patient names in the demo datasets (Joshua, Charles, Albert, Hannah, Nancy, Dorothy) are fictional and randomly selected - they are not related to the actual subjects
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
