# Website Favicon

This directory contains the website favicon (browser tab icon) for GlookoDataWebApp.

## Current Icon

**`favicon.svg`** - The active favicon used by the application

- **Design**: Full-size Blood Drop with Shadow (v2 Option 2 - Vibrant Red)
- **Theme**: Bold blood glucose monitoring with modern aesthetics
- **Description**: Full-size vibrant red blood drop with red-tinted shadow and white ECG pulse line overlay
- **Rationale**: Eye-catching, modern design with clear diabetes association. The vibrant red color and wider ECG amplitude ensure excellent visibility at all sizes, including 16px icons.

## Version 2 Options (Current)

Three icon designs featuring full-size blood drop with shadow (no background):

### v2 Option 1: Classic with Shadow
**File**: `favicon-v2-option1.svg`
- **Theme**: Clean blood glucose monitoring
- **Design**: Full-size 3D red blood drop with dark shadow and ECG pulse line
- **Pros**: Clean appearance, works on any background, excellent visibility
- **Cons**: Shadow may blend on very dark backgrounds

### v2 Option 2: Vibrant Red (SELECTED)
**File**: `favicon-v2-option2.svg` → `favicon.svg`
- **Theme**: Bold blood glucose monitoring  
- **Design**: Brighter red blood drop with red-tinted shadow and wider ECG amplitude
- **Pros**: More vibrant colors, eye-catching, wider pulse pattern more visible
- **Cons**: Brighter red may be less professional for some contexts

### v2 Option 3: Deep Crimson
**File**: `favicon-v2-option3.svg`
- **Theme**: Elegant blood glucose monitoring
- **Design**: Deep crimson blood drop with soft diffused shadow and heart-like ECG pattern
- **Pros**: Most elegant/refined appearance, softer shadow effect
- **Cons**: Heart-like ECG pattern may suggest cardiac rather than glucose monitoring

## Legacy Options (Version 1)

The original favicon designs are preserved for reference:

### Option 1: Blood Drop with Pulse (Legacy)
**File**: `favicon-option1.svg`
- **Theme**: Blood glucose monitoring (simple style)
- **Design**: Red blood drop with white heartbeat/pulse line on transparent background
- **Pros**: Simple, recognizable, clear diabetes association
- **Cons**: Less modern appearance, no shadow effect

### Option 2: Glucose Meter with AI
**File**: `favicon-option2.svg`
- **Theme**: Technology meets diabetes care
- **Design**: Blue glucose meter with neural network pattern
- **Pros**: Captures both diabetes and AI aspects, modern tech aesthetic
- **Cons**: More complex, may lose detail at very small sizes

### Option 3: Medical Cross with Graph
**File**: `favicon-option3.svg`
- **Theme**: Healthcare data analytics
- **Design**: Green medical cross with white data trend line and blood drop
- **Pros**: Professional healthcare look, balances medical and analytics aspects
- **Cons**: Less specific to diabetes, trend line might be hard to see at small sizes

## Technical Details

- **Format**: SVG (Scalable Vector Graphics)
- **Size**: Optimized for display at 16×16, 32×32, and 64×64 pixels
- **Color Scheme**: Red blood drop with white ECG line and subtle drop shadow
- **Browser Support**: All modern browsers support SVG favicons

## Changing the Icon

To use a different icon option:

1. Copy the desired option file to `favicon.svg`:
   ```bash
   # Use v2 Option 1 (classic with shadow)
   cp public/favicon/favicon-v2-option1.svg public/favicon/favicon.svg
   
   # Or use v2 Option 2 (vibrant red - current default)
   cp public/favicon/favicon-v2-option2.svg public/favicon/favicon.svg
   
   # Or use v2 Option 3 (deep crimson)
   cp public/favicon/favicon-v2-option3.svg public/favicon/favicon.svg
   ```

2. The `index.html` file references `/favicon/favicon.svg`, so no code changes are needed

3. Clear your browser cache to see the change immediately
