# Settings Guide

The Settings page allows you to customize your GlookoDataWebApp experience. This guide covers all available settings and how to configure them.

## Overview

The Settings page provides configuration options for personalizing the application to your preferences. All settings are stored locally in your browser using cookies, ensuring privacy while maintaining your preferences across sessions.

## Getting Started

### Accessing the Settings Page

1. Launch the GlookoDataWebApp
2. Click the **Settings** button in the navigation menu (gear icon)
3. You'll see all available configuration options

## Features

### 1. Theme Settings

Control the visual appearance of the application with three theme options.

#### Available Themes

- **Light**: A bright theme optimized for well-lit environments
- **Dark**: A dark theme that reduces eye strain in low-light conditions
- **System (recommended)**: Automatically matches your operating system's theme preference

#### How to Change Theme

1. Navigate to the Settings page
2. Find the **Theme** section at the top of the settings card
3. Select one of the three radio button options:
   - Click **Light** for a bright, traditional appearance
   - Click **Dark** for a darker, eye-friendly appearance
   - Click **System** to automatically follow your OS settings

#### System Theme Benefits

When you select "System (recommended)", the application will:
- Automatically detect your OS preference (Windows, macOS, Linux)
- Update in real-time when you change your system theme
- Provide a seamless experience across all your applications

#### Theme Persistence

Your theme preference is:
- ✅ Saved to a browser cookie (`glooko-theme-preference`)
- ✅ Persists for 365 days
- ✅ Applies immediately without page refresh
- ✅ Works across all browser tabs

### 2. Blood Glucose Thresholds

Configure blood glucose threshold values to customize what values are considered low, normal, high, or very high. These thresholds are used throughout the application for data analysis and visualization.

#### Default Thresholds

The application comes with medically standard default thresholds (in mmol/L):

- **Very High**: 13.9 mmol/L (above this value)
- **High**: 10.0 mmol/L (above this value)
- **Low**: 3.9 mmol/L (below this value)
- **Very Low**: 3.0 mmol/L (below this value)

#### In Range Display

When thresholds are configured correctly, you'll see the "In Range" display showing:

```
In Range: 3.9-10.0 mmol/L
```

This indicates that blood glucose values between your Low and High thresholds are considered normal/in range.

#### How to Adjust Thresholds

Each threshold has three ways to adjust the value:

1. **Increment Button (▲)**: Click the up arrow to increase value by 0.1 mmol/L
2. **Manual Entry**: Click in the input field and type a value
3. **Decrement Button (▼)**: Click the down arrow to decrease value by 0.1 mmol/L

#### Value Format Requirements

- Values must be in format **dd.d** (e.g., 10.0, 13.9, 3.5)
- Only one decimal place is allowed
- Maximum two digits before the decimal point
- Automatic rounding to one decimal place when using increment/decrement

#### Validation Rules

The application enforces the following rules to ensure logical threshold configuration:

1. **Very Low > 0**: Very low threshold must be greater than zero
   - ❌ Invalid: 0.0 mmol/L
   - ✅ Valid: 3.0 mmol/L

2. **Low > Very Low**: Low threshold must be higher than very low
   - ❌ Invalid: Low=3.0, Very Low=3.0
   - ✅ Valid: Low=3.9, Very Low=3.0

3. **High > Low**: High threshold must be higher than low
   - ❌ Invalid: High=3.9, Low=3.9
   - ✅ Valid: High=10.0, Low=3.9

4. **Very High > High**: Very high threshold must be higher than high
   - ❌ Invalid: Very High=10.0, High=10.0
   - ✅ Valid: Very High=13.9, High=10.0

#### Validation Feedback

When you configure invalid thresholds, you'll see:
- ❌ Red error message explaining the validation issue
- ❌ The "In Range" display will be hidden
- ⚠️ Values will NOT be saved until they pass validation

Example error messages:
- "Very low threshold must be greater than zero"
- "Low threshold must be greater than very low threshold"
- "High threshold must be greater than low threshold"
- "Very high threshold must be greater than high threshold"

#### Threshold Persistence

Your threshold preferences are:
- ✅ Saved to a browser cookie (`glooko-glucose-thresholds`)
- ✅ Persists for 365 days
- ✅ Only saved when all validation rules pass
- ✅ Applies across all browser tabs
- ✅ Used in Reports and AI Analysis features

### 3. Data Privacy

Information about how your data is handled by the application.

#### Privacy Principles

The Settings page displays important privacy information:

> "Your data is stored locally with configurable persistence options. All processing happens in your browser."

This means:
- ✅ **No external servers**: No data is sent to any external server
- ✅ **Browser-only**: All processing happens locally in your browser
- ✅ **Cookie-based settings**: Only preferences (not data) are stored in cookies
- ✅ **Session storage**: Uploaded files remain in memory only
- ✅ **No tracking**: No analytics or tracking of your usage

## Usage Examples

### Example 1: Switching to Dark Theme

1. Navigate to Settings page
2. Under the **Theme** section, click **Dark**
3. The interface immediately switches to dark mode
4. Close and reopen the browser - dark theme persists

### Example 2: Configuring Custom Thresholds

**Scenario**: You want stricter high glucose thresholds

1. Navigate to Settings page
2. Find the **Blood Glucose Thresholds** section
3. Click the high threshold input field (default: 10.0)
4. Type `8.5` and press Enter
5. Click the very high threshold's down arrow (▼) multiple times to reduce it to 12.0
6. Verify "In Range: 3.9-8.5 mmol/L" appears
7. Settings are automatically saved

### Example 3: Fixing Invalid Thresholds

**Scenario**: You accidentally set conflicting values

1. You set High = 10.0 and Very High = 9.0
2. Red error message appears: "Very high threshold must be greater than high threshold"
3. The "In Range" text disappears
4. Click the Very High up arrow (▲) multiple times until it shows 11.0 or higher
5. Error message disappears, "In Range" text reappears
6. Corrected values are now saved

### Example 4: Using Increment/Decrement Controls

1. Click the up arrow (▲) next to "High" five times
2. Value increases from 10.0 → 10.1 → 10.2 → 10.3 → 10.4 → 10.5
3. Click the down arrow (▼) next to "Low" twice
4. Value decreases from 3.9 → 3.8 → 3.7
5. View updated range: "In Range: 3.7-10.5 mmol/L"

## Configuration Scenarios

### Conservative Thresholds (Stricter Control)

For tighter glucose control, you might configure:

```
Very High: 11.0 mmol/L
High: 8.0 mmol/L
Low: 4.5 mmol/L
Very Low: 3.5 mmol/L

In Range: 4.5-8.0 mmol/L
```

### Relaxed Thresholds (Less Strict)

For more flexible monitoring:

```
Very High: 15.0 mmol/L
High: 12.0 mmol/L
Low: 3.5 mmol/L
Very Low: 2.5 mmol/L

In Range: 3.5-12.0 mmol/L
```

### Pediatric Thresholds (Example)

For children (consult with healthcare provider):

```
Very High: 14.0 mmol/L
High: 11.0 mmol/L
Low: 4.5 mmol/L
Very Low: 3.5 mmol/L

In Range: 4.5-11.0 mmol/L
```

## Troubleshooting

### Theme Not Changing

**Problem**: Theme selection doesn't seem to work

**Solutions**:
- Check if you selected "System" - it follows your OS theme
- Try switching to Light or Dark explicitly
- Clear browser cookies and reload the page
- Try a different browser to rule out browser-specific issues

### Threshold Values Not Saving

**Problem**: Threshold changes don't persist after page refresh

**Possible causes and solutions**:
- **Invalid values**: Check for error messages - only valid thresholds are saved
- **Cookies disabled**: Enable cookies in your browser settings
- **Private browsing**: Cookies may not persist in incognito/private mode
- **Browser storage full**: Clear old cookies or browse data

### Cannot Enter Certain Values

**Problem**: Input field won't accept your typed value

**Explanation**: The input enforces format validation
- Only format **dd.d** is accepted (e.g., 10.5, 3.9, 14.2)
- Maximum 2 digits before decimal
- Exactly 1 digit after decimal
- No negative values

**Solution**: Use the increment/decrement buttons or type valid format

### Error Message Won't Go Away

**Problem**: Red error message persists despite changing values

**Cause**: Thresholds still violate validation rules

**Solution**:
1. Read the error message carefully
2. Check all four threshold values
3. Ensure: Very Low < Low < High < Very High
4. Ensure Very Low > 0
5. Adjust values one at a time until error clears

## Best Practices

1. **Medical Guidance**: Consult your healthcare provider before changing thresholds
2. **Document Changes**: Note your threshold changes and reasons
3. **Test Incrementally**: Adjust thresholds gradually, not dramatically
4. **Verify Range**: Check the "In Range" display matches your expectations
5. **Consistent Theme**: Use "System" theme for consistency across applications
6. **Regular Reviews**: Periodically review and adjust thresholds based on health goals

## Technical Notes

### Cookie Details

The application stores two cookies:

1. **glooko-theme-preference**
   - Stores: "light", "dark", or "system"
   - Expiry: 365 days
   - Domain: Current domain only
   - Secure: SameSite=Strict

2. **glooko-glucose-thresholds**
   - Stores: JSON object with four numeric values
   - Expiry: 365 days
   - Domain: Current domain only
   - Secure: SameSite=Strict
   - Example: `{"veryHigh":13.9,"high":10.0,"low":3.9,"veryLow":3.0}`

### Browser Compatibility

- **Supported Browsers**: All modern browsers (Chrome, Firefox, Edge, Safari)
- **Minimum Version**: Browsers with ES6+ support and CSS Grid
- **Cookies Required**: Yes, for settings persistence
- **JavaScript Required**: Yes, application won't function without it

### Privacy & Security

- **Local Storage**: All settings stored in browser only
- **No Transmission**: Settings never sent to external servers
- **Cookie Security**: SameSite=Strict prevents CSRF attacks
- **Data Isolation**: Settings isolated per domain
- **No Analytics**: No tracking of settings changes

## Integration with Other Features

### Reports Page

Your glucose thresholds are used to:
- Color-code glucose readings in charts
- Calculate time in range statistics
- Highlight out-of-range values
- Generate trend analysis

### AI Analysis Page

Your thresholds help the AI:
- Identify problematic patterns
- Provide personalized recommendations
- Calculate compliance with target ranges
- Generate context-aware insights

### Data Upload Page

Thresholds affect:
- Preview visualizations
- Quick statistics display
- Data validation warnings

## Next Steps

After configuring your settings:

1. Navigate to **Data Upload** to import your glucose data
2. View **Reports** to see how thresholds affect data visualization
3. Try **AI Analysis** for insights based on your custom thresholds
4. Adjust settings as needed based on your analysis results

## Related Documentation

- [Data Upload Guide](DATA_UPLOAD.md) - Learn how to upload data
- [Main README](../README.md) - Application overview
- [Contributing Guide](../CONTRIBUTING.md) - Contribute to the project

---

**Note**: Always consult with your healthcare provider before making significant changes to your blood glucose monitoring parameters. The threshold settings in this application are for data visualization and analysis purposes only and should not replace medical advice.
