# Website Favicon

This directory contains the website favicon (browser tab icon) for GlookoDataWebApp.

## Current Icon

**`favicon.svg`** - The active favicon used by the application

- **Design**: Glucose Meter with AI Neural Network (Option 2)
- **Theme**: Technology meets diabetes care
- **Description**: Blue glucose meter with display showing "125", AI neural network pattern, and blood drop accent
- **Rationale**: This icon uniquely combines diabetes care (glucose meter) with AI/technology (neural network), directly representing the app's purpose of analyzing Glooko glucose data with intelligent insights

## Alternative Options

Three icon designs were created and evaluated:

### Option 1: Blood Drop with Pulse
**File**: `favicon-option1.svg`
- **Theme**: Blood glucose monitoring
- **Design**: Red blood drop with white heartbeat/pulse line
- **Pros**: Instantly recognizable, clear diabetes association, simple yet meaningful
- **Cons**: Very direct/medical, red color may be intense

### Option 2: Glucose Meter with AI (SELECTED)
**File**: `favicon-option2.svg` → `favicon.svg`
- **Theme**: Technology meets diabetes care
- **Design**: Blue glucose meter with neural network pattern
- **Pros**: Captures both diabetes and AI aspects, modern tech aesthetic, unique
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
- **Color Scheme**: Professional blue gradient with purple AI accents and red blood drop
- **Browser Support**: All modern browsers support SVG favicons

## Changing the Icon

To use a different icon option:

1. Copy the desired option file to `favicon.svg`:
   ```bash
   cp public/favicon-option1.svg public/favicon.svg
   ```

2. The `index.html` file references `/favicon.svg`, so no code changes are needed

3. Clear your browser cache to see the change immediately
