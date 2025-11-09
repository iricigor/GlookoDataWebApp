# Settings Guide

Configure your GlookoDataWebApp experience with themes and blood glucose thresholds. All settings are stored locally in your browser for privacy.

## Overview

The Settings page provides two main configuration options:
- **Theme**: Control the visual appearance (light, dark, or system)
- **Blood Glucose Thresholds**: Customize glucose range values for your analysis

![Settings Page](https://github.com/user-attachments/assets/3cdff779-be17-4782-b4bc-e84dc8be7032)

## Theme Settings

Choose your preferred color theme to customize the application appearance.

### Available Themes

- **Light**: Bright theme optimized for well-lit environments
- **Dark**: Dark theme that reduces eye strain in low-light conditions  
- **System (recommended)**: Automatically matches your operating system's theme

![Theme Settings](https://github.com/user-attachments/assets/3cdff779-be17-4782-b4bc-e84dc8be7032)

### How to Change Theme

1. Navigate to Settings page
2. Select one of the three radio button options in the Theme section
3. The interface updates immediately
4. Your preference is saved automatically

**Note**: The System theme option automatically detects your OS preference and updates in real-time when you change your system theme.

## Blood Glucose Thresholds

Configure blood glucose threshold values to customize what values are considered low, normal, high, or very high. These thresholds are used throughout the application for data analysis and visualization.

### Default Thresholds

The application comes with standard default thresholds (in mmol/L):

- **Very High**: 13.9 mmol/L
- **High**: 10.0 mmol/L
- **Low**: 3.9 mmol/L
- **Very Low**: 3.0 mmol/L

**In Range**: Values between Low and High (3.9-10.0 mmol/L by default)

### Adjusting Thresholds

Each threshold uses a SpinButton control with three interaction methods:

1. **Click the up arrow (▲)**: Increment value by 0.1 mmol/L
2. **Click the down arrow (▼)**: Decrement value by 0.1 mmol/L
3. **Type directly**: Click in the input field and enter a value

The SpinButton accepts values from 0.1 to 30.0 mmol/L with precision of one decimal place.

### Validation Rules

Thresholds must follow a logical hierarchy:

1. **Very Low > 0**: Must be greater than zero
2. **Low > Very Low**: Low must be higher than Very Low
3. **High > Low**: High must be higher than Low
4. **Very High > High**: Very High must be higher than High

**Example Valid Configuration:**
```
Very High: 13.9 mmol/L
High: 10.0 mmol/L
Low: 3.9 mmol/L
Very Low: 3.0 mmol/L
In Range: 3.9-10.0 mmol/L ✓
```

**Example Invalid Configuration:**
```
Very High: 10.0 mmol/L
High: 10.0 mmol/L ✗ (must be lower than Very High)
```

### Validation Feedback

When you configure invalid thresholds:
- ❌ Red error message appears explaining the issue
- ❌ The "In Range" display is hidden
- ⚠️ Values are NOT saved until they pass validation

Only valid configurations are automatically saved to your browser cookies.

## Common Configuration Examples

### Conservative (Stricter Control)
```
Very High: 11.0 mmol/L
High: 8.0 mmol/L
Low: 4.5 mmol/L
Very Low: 3.5 mmol/L
In Range: 4.5-8.0 mmol/L
```

### Relaxed (Less Strict)
```
Very High: 15.0 mmol/L
High: 12.0 mmol/L
Low: 3.5 mmol/L
Very Low: 2.5 mmol/L
In Range: 3.5-12.0 mmol/L
```

## Data Privacy

All settings are stored locally in your browser using cookies:

### Privacy Features
- ✅ **No external servers**: No data is sent to any external server
- ✅ **Browser-only**: All processing happens locally
- ✅ **Cookie-based**: Only preferences stored in cookies
- ✅ **365-day expiry**: Settings persist for one year
- ✅ **No tracking**: No analytics or tracking

### Cookie Details

**glooko-theme-preference**
- Stores: "light", "dark", or "system"
- Expiry: 365 days
- Security: SameSite=Strict

**glooko-glucose-thresholds**
- Stores: JSON object with four numeric values
- Expiry: 365 days  
- Security: SameSite=Strict
- Example: `{"veryHigh":13.9,"high":10.0,"low":3.9,"veryLow":3.0}`

## How Settings Are Used

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

## Troubleshooting

### Theme Not Changing
- If using "System", it follows your OS theme automatically
- Try switching to Light or Dark explicitly
- Clear browser cookies if issues persist

### Threshold Values Not Saving
- Check for validation error messages
- Ensure all thresholds follow the hierarchy rules
- Verify cookies are enabled in your browser
- Note: Private browsing may not persist settings

### Cannot Enter Certain Values
- SpinButton accepts values from 0.1 to 30.0 mmol/L
- Precision is limited to one decimal place
- Use increment/decrement buttons for precise adjustments

## Best Practices

1. **Medical Guidance**: Consult your healthcare provider before changing thresholds
2. **Document Changes**: Note your threshold changes and reasons
3. **Test Incrementally**: Adjust thresholds gradually, not dramatically
4. **Verify Range**: Check the "In Range" display matches your expectations
5. **Regular Reviews**: Periodically review and adjust thresholds based on health goals

## Related Documentation

- [Data Upload Guide](DATA_UPLOAD.md) - Learn how to upload data
- [Main README](../README.md) - Application overview
- [Contributing Guide](../CONTRIBUTING.md) - Contribute to the project

---

**Medical Disclaimer**: The threshold settings in this application are for data visualization and analysis purposes only and should not replace medical advice. Always consult with your healthcare provider before making significant changes to your blood glucose monitoring parameters.
