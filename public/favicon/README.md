# Website Favicon

This directory contains the website favicon (browser tab icon) for GlookoDataWebApp.

## Current Icon

**`favicon.svg`** - The active favicon used by the application

- **Design**: Blood Drop with Pulse on Dark Circle (v2 Option 1)
- **Theme**: Blood glucose monitoring with modern aesthetics
- **Description**: Red blood drop with ECG pulse line on a black circular background with gray border
- **Rationale**: Modern, professional design with clear diabetes association. The dark circular background provides excellent contrast and visibility at small sizes. The 3D blood drop with glossy highlights gives a polished app-like appearance, while the ECG line represents health monitoring.

## Version 2 Options (Current)

Three new icon designs based on the modern circular dark background style:

### v2 Option 1: Classic Dark Circle (SELECTED)
**File**: `favicon-v2-option1.svg` → `favicon.svg`
- **Theme**: Modern blood glucose monitoring
- **Design**: 3D red blood drop with ECG pulse line on black circular background
- **Pros**: Professional appearance, excellent contrast, clear at small sizes, modern app-like aesthetic
- **Cons**: Darker overall appearance

### v2 Option 2: Vibrant Red
**File**: `favicon-v2-option2.svg`
- **Theme**: Bold blood glucose monitoring  
- **Design**: Brighter red blood drop with wider ECG amplitude on dark circle
- **Pros**: More vibrant colors, eye-catching, wider pulse pattern more visible
- **Cons**: Brighter red may be less professional for some contexts

### v2 Option 3: Deep Crimson
**File**: `favicon-v2-option3.svg`
- **Theme**: Elegant blood glucose monitoring
- **Design**: Deep crimson blood drop with heart-like ECG pattern on metallic-bordered dark circle
- **Pros**: Most elegant/refined appearance, subtle metallic border effect
- **Cons**: Heart-like ECG pattern may suggest cardiac rather than glucose monitoring

## Legacy Options (Version 1)

The original favicon designs are preserved for reference:

### Option 1: Blood Drop with Pulse (Legacy)
**File**: `favicon-option1.svg`
- **Theme**: Blood glucose monitoring (simple style)
- **Design**: Red blood drop with white heartbeat/pulse line on transparent background
- **Pros**: Simple, recognizable, clear diabetes association
- **Cons**: Less modern appearance, no circular container

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
- **Color Scheme**: Red blood drop with white ECG line on black circular background
- **Browser Support**: All modern browsers support SVG favicons

## Changing the Icon

To use a different icon option:

1. Copy the desired option file to `favicon.svg`:
   ```bash
   # Use v2 Option 1 (current default)
   cp public/favicon/favicon-v2-option1.svg public/favicon/favicon.svg
   
   # Or use v2 Option 2 (vibrant red)
   cp public/favicon/favicon-v2-option2.svg public/favicon/favicon.svg
   
   # Or use v2 Option 3 (deep crimson)
   cp public/favicon/favicon-v2-option3.svg public/favicon/favicon.svg
   ```

2. The `index.html` file references `/favicon/favicon.svg`, so no code changes are needed

3. Clear your browser cache to see the change immediately
