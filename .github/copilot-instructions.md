# GitHub Copilot Instructions for GlookoDataWebApp

## Project Overview

GlookoDataWebApp is a modern web application for importing, visualizing, and analyzing diabetes data exported from the Glooko platform. The app provides an interactive interface for streamlined data analysis and exploration, extending the capabilities of the existing Glooko PowerShell module.

**Key Features:**
- Data upload and management for Glooko export files (ZIP format)
- Comprehensive reports with detailed analytics and trends
- AI-powered analysis for intelligent insights
- Privacy-focused: all processing happens client-side in the browser
- No server-side data transmission - files are maintained in memory only

**Target Users:** Healthcare professionals, diabetes patients, and researchers analyzing Glooko diabetes data exports.

## Tech Stack & Architecture

### Core Technologies
- **React 19** - Latest UI library with modern features
- **TypeScript** - Type-safe JavaScript for robust code
- **Vite** - Next-generation build tool with lightning-fast HMR
- **Fluent UI React (v9)** - Microsoft's official React component library
- **JSZip** - Client-side ZIP file processing

### Development Tools
- **ESLint** - Code quality and consistency enforcement
- **Vitest** - Unit testing framework with React Testing Library
- **Node.js 20+** - Runtime environment
- **npm** - Package management

### Architecture Pattern
- **Component-based architecture** using React functional components
- **Client-side processing** - No backend, all data processing in browser
- **Privacy-first design** - No data leaves the user's device
- **Custom hooks** for reusable logic
- **TypeScript interfaces** for data structure definitions

## Coding Guidelines

### TypeScript Best Practices

1. **Always use explicit types** - Avoid `any` type unless absolutely necessary
   ```tsx
   // Good ✅
   interface UserData {
     name: string;
     age: number;
   }
   
   // Bad ❌
   interface UserData {
     name: any;
     age: any;
   }
   ```

2. **Define proper interfaces** for component props
   ```tsx
   interface ComponentProps {
     title: string;
     onAction: (id: string) => void;
     data?: DataType;  // Optional props should use ?
   }
   ```

3. **Use type inference** where TypeScript can deduce the type
   ```tsx
   const count = 0;  // TypeScript knows this is number
   ```

### React & Component Guidelines

1. **Use functional components** with hooks
   ```tsx
   export function MyComponent({ prop1, prop2 }: MyComponentProps) {
     const [state, setState] = useState<StateType>(initialValue);
     // component logic
   }
   ```

2. **Keep components focused** - Single responsibility principle
   - Each component should do one thing well
   - Extract reusable logic into custom hooks in `src/hooks/`
   - Split large components into smaller, composable ones
   - **Component size guideline:** Keep component files under 200 lines when possible to minimize merge conflicts
   - Extract UI sections (navigation bars, summary cards, etc.) into separate components for better maintainability

3. **Use Fluent UI components** - Never recreate existing UI components
   ```tsx
   import { Button, Card } from '@fluentui/react-components';
   import { AddRegular } from '@fluentui/react-icons';
   ```

4. **Props naming conventions**
   - Event handlers: `onAction`, `onClick`, `onChange`
   - Boolean props: `isVisible`, `hasData`, `canEdit`
   - Data props: descriptive names like `userData`, `reportData`

### Styling with Fluent UI

1. **Always use Fluent UI tokens** for colors and spacing
   ```tsx
   import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
   
   const useStyles = makeStyles({
     container: {
       backgroundColor: tokens.colorNeutralBackground1,
       ...shorthands.padding('20px'),
       ...shorthands.gap('10px'),
     },
   });
   ```

2. **Never use inline styles** or hardcoded colors
   ```tsx
   // Good ✅
   const useStyles = makeStyles({
     button: { color: tokens.colorBrandForeground1 }
   });
   
   // Bad ❌
   <Button style={{ color: '#0078d4' }}>Click</Button>
   ```

3. **Common Fluent UI tokens to use:**
   - `tokens.colorBrandForeground1` - Primary brand color
   - `tokens.colorNeutralBackground1` - Neutral background
   - `tokens.colorStatusSuccessForeground1` - Success state
   - `tokens.colorStatusDangerForeground1` - Error/danger state

### Code Quality & Style

1. **Run ESLint** before committing
   ```bash
   npm run lint
   ```

2. **Comments** - Add comments for:
   - Complex algorithms or business logic
   - Non-obvious decisions or workarounds
   - TODOs with context
   - Do NOT over-comment obvious code

3. **Error Handling**
   - Always handle errors in async operations
   - Provide user-friendly error messages
   - Log errors for debugging (but not in production)

4. **Naming Conventions**
   - Components: PascalCase (e.g., `FileUploadZone`)
   - Functions/variables: camelCase (e.g., `handleUpload`)
   - Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
   - Files: PascalCase for components, camelCase for utilities

### Testing & Development

1. **Write unit tests** for new code
   - Use Vitest testing framework (already configured)
   - Place test files next to source files with `.test.ts` or `.test.tsx` extension
   - Follow existing test patterns in `src/utils/helpers.test.ts` and other test files
   - Run tests before committing: `npm test` or `npm test -- --run`
   - Aim for good test coverage of new functionality
   - Test edge cases, error conditions, and happy paths

2. **Manual testing is also required**
   - Run `npm run dev` and test in browser
   - Test all user interactions
   - Check console for errors
   - Test edge cases (empty data, large files, etc.)

3. **Build before committing**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

### Security Considerations

1. **Privacy-first** - No data should be sent to external servers
2. **Client-side only** - All processing happens in the browser
3. **Validate user input** - Especially file uploads
4. **Use npm audit** before adding dependencies
5. **No hardcoded secrets** or API keys

## Directory & File Structure

```
GlookoDataWebApp/
├── .github/              # GitHub configuration
│   ├── ISSUE_TEMPLATE/   # Issue templates
│   └── copilot-instructions.md  # This file
├── src/
│   ├── main.tsx          # Application entry point
│   ├── App.tsx           # Main application component with routing
│   ├── App.css           # Application-level styles
│   ├── index.css         # Global styles
│   ├── components/       # Reusable UI components
│   │   ├── Navigation.tsx
│   │   ├── FileUploadZone.tsx
│   │   ├── FileList.tsx
│   │   └── InfoCard.tsx
│   ├── pages/            # Page-level components
│   │   ├── Home.tsx
│   │   ├── DataUpload.tsx
│   │   ├── Reports.tsx
│   │   ├── AIAnalysis.tsx
│   │   └── Settings.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useCounter.ts
│   │   └── useCounter.test.ts
│   ├── test/             # Test setup and utilities
│   │   └── setup.ts      # Vitest setup configuration
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── zipUtils.ts   # ZIP file processing
│   │   ├── zipUtils.test.ts
│   │   ├── helpers.ts    # General helpers
│   │   └── helpers.test.ts
│   └── assets/           # Static assets (images, icons)
├── public/               # Public static files
├── dist/                 # Production build output (generated, not committed)
├── docs/                 # Documentation
│   └── changelogs/       # Version-specific changelog files
├── CHANGELOG.md          # Version history summary with links to detailed changelogs
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── vitest.config.ts      # Vitest test configuration
├── eslint.config.js      # ESLint configuration
└── README.md             # Project documentation
```

### Where to Add New Features

- **New UI component?** → `src/components/ComponentName.tsx` (with `ComponentName.test.tsx`)
- **New page?** → `src/pages/PageName.tsx` (update App.tsx navigation)
- **New custom hook?** → `src/hooks/useHookName.ts` (with `useHookName.test.ts`)
- **New type/interface?** → `src/types/index.ts`
- **New utility function?** → `src/utils/helpers.ts` (or create new file with `.test.ts` file)

## Development Workflow

### Starting a New Task

1. **Understand the requirements** - Read the issue or feature request carefully
2. **Check existing code** - Look at similar implementations
3. **Plan the approach** - Think about which files need changes
4. **Keep changes minimal** - Only modify what's necessary

### Making Changes

1. **Start the dev server**
   ```bash
   npm run dev
   ```
   The app opens at `http://localhost:5173/`

2. **Make small, incremental changes**
   - Test each change in the browser
   - Check for console errors
   - Verify existing features still work

3. **Follow the component pattern**
   - Look at existing components for structure
   - Use Fluent UI components consistently
   - Apply proper TypeScript types

### Before Committing

1. **Do NOT update changelog files manually** unless you're making documentation fixes
   - For feature/bug PRs, changelog updates are handled automatically by a dedicated pipeline AFTER the PR is merged
   - The automated system will generate the changelog entry based on your PR title and description
   - Changelog entries are added to version-specific files in `docs/changelogs/` (e.g., `CHANGELOG-1.4.x.md`)
   - The main `CHANGELOG.md` contains only summaries and links to detailed changelogs
   - **If you do need to manually update a changelog**, use the proper format (see CHANGELOG Format section below)

2. **Run tests**
   ```bash
   npm test -- --run
   ```

3. **Lint the code**
   ```bash
   npm run lint
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Test the production build**
   ```bash
   npm run preview
   ```

6. **Manual testing checklist:**
   - [ ] All pages load without errors
   - [ ] Navigation works correctly
   - [ ] User interactions work as expected
   - [ ] No console errors or warnings
   - [ ] Responsive design works on different screen sizes
   - [ ] Privacy: no data sent to external servers

### CHANGELOG Format

Changelogs are now split into version-specific files in `docs/changelogs/`:
- `CHANGELOG-1.4.x.md` - Current development
- `CHANGELOG-1.3.x.md`, `CHANGELOG-1.2.x.md`, etc. - Released versions

When manually adding or updating entries in version-specific changelog files, use the following format:

```markdown
<details>
<summary>213 Enable smaller data set for "Meal Timing" analysis</summary>

[#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis
  - Add automatic fallback to last 28 days when AI API returns "request too large" error
  - New utility functions: `filterGlucoseReadingsToLastDays()` and `filterInsulinReadingsToLastDays()`
  - Enhanced error detection for request size limitations
  - [... more sub-bullets as needed ...]
</details>
```

**Key requirements:**
- **Summary tag**: Plain PR number (no `#` symbol) + title (no hyperlink)
  - Example: `213 Enable smaller data set for "Meal Timing" analysis`
- **First line in details**: Full hyperlinked version with `#` symbol
  - Example: `[#213](../../pull/213) Enable smaller data set for "Meal Timing" analysis`
- **Sub-bullets**: List all changes as indented bullet points (2 spaces + dash)
- **Use markdown links** (NOT HTML anchor tags)
- **Use relative paths**: `../../pull/PR_NUMBER` or `../../issues/ISSUE_NUMBER`
- Place entry under correct category: New Features, Fixes, Documentation, or Other
- Sort entries by PR number (descending - highest first)

### Commit Message Format

Follow conventional commits:
```
type(scope): subject

Examples:
feat(upload): add support for multiple file formats
fix(reports): resolve data parsing issue
docs(readme): update installation instructions
style(components): improve button styling
refactor(utils): simplify zip processing logic
```

## Common Tasks & Patterns

### Adding a New Fluent UI Component

```tsx
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  button: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

export function MyComponent() {
  const styles = useStyles();
  
  return (
    <Button 
      appearance="primary" 
      icon={<AddRegular />}
      className={styles.button}
    >
      Add Item
    </Button>
  );
}
```

### Creating a Custom Hook

```tsx
// src/hooks/useDataProcessor.ts
import { useState, useCallback } from 'react';

export function useDataProcessor() {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);
  
  const processData = useCallback(async (input: InputType) => {
    setLoading(true);
    try {
      // Processing logic
      const result = await someProcessing(input);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { data, loading, processData };
}
```

### Writing Unit Tests

The project uses Vitest for unit testing. Place test files next to the source files with `.test.ts` or `.test.tsx` extension.

```tsx
// src/utils/myUtils.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtils';

describe('myUtils', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      const result = myFunction('valid input');
      expect(result).toBe('expected output');
    });

    it('should handle edge cases', () => {
      const result = myFunction('');
      expect(result).toBe('');
    });

    it('should throw error for invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

For React components and hooks, use React Testing Library:

```tsx
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with correct text', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

**Testing Commands:**
- `npm test` - Run tests in watch mode
- `npm test -- --run` - Run tests once
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run test:coverage` - Generate coverage report

### Handling File Upload

The app uses JSZip for client-side ZIP processing. Reference `src/utils/zipUtils.ts` for examples.

```tsx
import JSZip from 'jszip';

// Load ZIP file
const zip = await JSZip.loadAsync(file);

// Process files
zip.forEach((relativePath, zipEntry) => {
  // Process each file
});
```

## Resources & References

### Documentation
- [React Documentation](https://react.dev/) - Latest React features and patterns
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language reference
- [Fluent UI React v9](https://react.fluentui.dev/) - Component library documentation
- [Vite Guide](https://vite.dev/guide/) - Build tool and configuration
- [Vitest](https://vitest.dev/) - Unit testing framework documentation
- [React Testing Library](https://testing-library.com/react) - React component testing utilities
- [GitHub Copilot Docs](https://docs.github.com/en/copilot) - Using Copilot effectively

### Project Documentation
- [README.md](../README.md) - Project overview and quick start
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Detailed contribution guidelines
- [QUICKSTART.md](../QUICKSTART.md) - Quick start guide
- [CHANGELOG.md](../CHANGELOG.md) - Version history summary with links to detailed changelogs
- [docs/changelogs/](../docs/changelogs/) - Version-specific detailed changelog files
- [docs/DATA_UPLOAD.md](../docs/DATA_UPLOAD.md) - Data upload feature documentation

### Related Projects
- [Glooko PowerShell Module](https://github.com/iricigor/Glooko) - Related PowerShell module for Glooko data

## AI Assistance Tips

### For GitHub Copilot

1. **Write descriptive comments** before code blocks
   ```tsx
   // Create a card component that displays patient information
   // with name, age, and last visit date
   ```

2. **Use type hints** - Copilot works better with TypeScript
3. **Start function signatures** - Let Copilot complete implementation
4. **Context matters** - Keep related code in the same file for better suggestions

### For Copilot Chat

- "Explain this component" - Understand existing code
- "Generate tests for this function" - Create test cases
- "Refactor this to use hooks" - Modernize code
- "Find bugs in this code" - Code review assistance
- "How do I use [Fluent UI component]?" - Component usage help

### Common Copilot Prompts

```tsx
// Create a responsive grid layout with Fluent UI
// Add error boundary to catch component errors
// Implement debounced search input
// Create a modal dialog for confirmation
// Add loading spinner with Fluent UI
```

## Important Notes

1. **Privacy is paramount** - Never add features that send data to external servers
2. **Browser compatibility** - Test in modern browsers (Chrome, Firefox, Edge, Safari)
3. **Accessibility** - Fluent UI components are accessible by default, maintain this
4. **Performance** - Keep app responsive, process large files efficiently
5. **No backend** - This is a pure frontend application
6. **Data stays local** - All processing happens in the browser
7. **TypeScript strict mode** - Enabled in tsconfig.json, follow strict typing

## Adding New AI Analysis Prompts

The AI Analysis page (`src/pages/AIAnalysis.tsx`) supports multiple analysis tabs. This section documents the complete process for adding a new AI prompt/tab based on the existing patterns from the "Time in Range" and "Glucose & Insulin" tabs.

### Overview of AI Analysis Architecture

The AI Analysis page uses:
- **Vertical tabs** (left side) for different analysis types
- **Shared AI provider system** (Perplexity or Google Gemini via unified `aiApi.ts`)
- **Consistent state management pattern** for each prompt
- **Cooldown mechanism** to prevent excessive API calls
- **Base64-encoded data** for complex dataset prompts

### Step-by-Step Guide to Add a New AI Prompt Tab

#### 1. Add State Variables to the Component

For each new prompt, you need to manage its own state. Add these state variables in `AIAnalysis.tsx`:

```tsx
// State for your new prompt
const [analyzingNewPrompt, setAnalyzingNewPrompt] = useState(false);
const [newPromptResponse, setNewPromptResponse] = useState<string | null>(null);
const [newPromptError, setNewPromptError] = useState<string | null>(null);
const [newPromptCooldownActive, setNewPromptCooldownActive] = useState(false);
const [newPromptCooldownSeconds, setNewPromptCooldownSeconds] = useState(0);
const [newPromptReady, setNewPromptReady] = useState(false);
const [newPromptDataset, setNewPromptDataset] = useState<YourDataType[]>([]);
```

**Pattern**: Each prompt needs 6 state variables:
- `analyzing*` - Boolean for loading state
- `*Response` - String for AI response content
- `*Error` - String for error messages
- `*CooldownActive` - Boolean for cooldown state
- `*CooldownSeconds` - Number for countdown timer
- `*Ready` - Boolean indicating if ready for new analysis
- `*Dataset` - Array/object for the data to analyze (optional, depends on prompt needs)

#### 2. Add Cooldown Timer Effect

Add a `useEffect` hook to handle the cooldown timer:

```tsx
// Handle cooldown timer for new prompt
useEffect(() => {
  if (newPromptCooldownSeconds > 0) {
    const timer = setTimeout(() => {
      setNewPromptCooldownSeconds(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  } else if (newPromptCooldownActive && newPromptCooldownSeconds === 0) {
    setNewPromptCooldownActive(false);
    setNewPromptReady(true);
  }
}, [newPromptCooldownSeconds, newPromptCooldownActive]);
```

#### 3. Add Data Preparation Logic (if needed)

If your prompt requires data extraction, add it in the existing `useEffect` that processes the selected file:

```tsx
// Inside the useEffect for file selection
useEffect(() => {
  if (!selectedFile) {
    // Clear your prompt state
    setNewPromptDataset([]);
    setNewPromptResponse(null);
    setNewPromptError(null);
    setNewPromptReady(false);
    return;
  }

  const prepareData = async () => {
    try {
      // Extract and process your data
      const data = await extractYourData(selectedFile);
      setNewPromptDataset(data);
    } catch (error) {
      console.error('Failed to prepare data:', error);
      setNewPromptDataset([]);
    }
  };

  prepareData();
}, [selectedFile, /* other dependencies */]);
```

#### 4. Create a Prompt Generation Function

Add your prompt generator function in `src/utils/perplexityApi.ts` (or create a new utility file):

```tsx
/**
 * Generate AI prompt for [your analysis type]
 * 
 * @param dataParam - Description of your parameter
 * @returns Formatted prompt for AI analysis
 */
export function generateYourPrompt(dataParam: YourDataType): string {
  return `[Your detailed prompt text that includes the data and instructions for the AI]
  
Remember that all glucose values are in mmol/L (not mg/dL). Address me directly using "you/your" language.`;
}
```

**Tips for writing good prompts:**
- Start with role definition: "You are an expert..."
- Clearly state the goal
- Provide structured data (CSV, JSON, or formatted text)
- List specific analysis requirements
- Include constraints (e.g., response length, format)
- Always remind AI about mmol/L units
- Always use "you/your" language (second person)

#### 5. Create the Analysis Handler Function

Add a handler function following this pattern:

```tsx
const handleNewPromptClick = async () => {
  if (!activeProvider || !hasApiKey || newPromptDataset.length === 0) {
    return;
  }

  // If there's already a response, start cooldown before allowing new analysis
  if (newPromptResponse && !newPromptCooldownActive && !newPromptReady) {
    setNewPromptCooldownActive(true);
    setNewPromptCooldownSeconds(3);
    return;
  }

  // Don't analyze if cooldown is active
  if (newPromptCooldownActive) {
    return;
  }

  setAnalyzingNewPrompt(true);
  setNewPromptError(null);
  setNewPromptReady(false);
  const previousResponse = newPromptResponse;

  try {
    // Prepare your data (e.g., convert to CSV and base64 encode if needed)
    const prompt = generateYourPrompt(newPromptDataset);

    // Get the appropriate API key for the active provider
    const apiKey = activeProvider === 'perplexity' ? perplexityApiKey : geminiApiKey;

    // Call the AI API using the selected provider
    const result = await callAIApi(activeProvider, apiKey, prompt);

    if (result.success && result.content) {
      setNewPromptResponse(result.content);
    } else {
      setNewPromptError(result.error || 'Failed to get AI response');
      if (previousResponse) {
        setNewPromptResponse(previousResponse);
      }
    }
  } catch (err) {
    setNewPromptError(err instanceof Error ? err.message : 'An unexpected error occurred');
    if (previousResponse) {
      setNewPromptResponse(previousResponse);
    }
  } finally {
    setAnalyzingNewPrompt(false);
  }
};
```

#### 6. Add the Tab to the TabList

In the `TabList` component, add your new tab:

```tsx
<TabList
  vertical
  selectedValue={selectedTab}
  onTabSelect={(_, data) => setSelectedTab(data.value as string)}
  className={styles.tabList}
  appearance="subtle"
>
  <Tab value="fileInfo">File Info</Tab>
  <Tab value="timeInRange">Time in Range</Tab>
  <Tab value="glucoseInsulin">Glucose & Insulin</Tab>
  <Tab value="yourNewTab">Your Tab Name</Tab>  {/* Add this */}
</TabList>
```

#### 7. Add Tab Content Rendering

In the `renderTabContent()` function, add a new condition:

```tsx
} else if (selectedTab === 'yourNewTab') {
  return (
    <div className={styles.promptContent}>
      {loading ? (
        <Text className={styles.helperText}>Loading data...</Text>
      ) : newPromptDataset.length > 0 ? (
        <>
          {/* Button container */}
          <div className={styles.buttonContainer}>
            <Button
              appearance="primary"
              disabled={!hasApiKey || analyzingNewPrompt || (newPromptCooldownActive && newPromptCooldownSeconds > 0)}
              onClick={handleNewPromptClick}
              icon={analyzingNewPrompt ? <Spinner size="tiny" /> : undefined}
            >
              {analyzingNewPrompt
                ? 'Analyzing...'
                : newPromptResponse && !newPromptReady
                ? 'Click to enable new analysis'
                : 'Analyze with AI'}
            </Button>
            
            {!analyzingNewPrompt && !newPromptResponse && !newPromptError && !newPromptCooldownActive && (
              <Text className={styles.helperText}>
                Click Analyze to get AI-powered [description]
              </Text>
            )}
            {newPromptResponse && !newPromptReady && !newPromptCooldownActive && !analyzingNewPrompt && (
              <Text className={styles.helperText}>
                Click the button above to request a new analysis
              </Text>
            )}
            
            {newPromptCooldownActive && newPromptCooldownSeconds > 0 && (
              <div className={styles.cooldownContainer}>
                <Text className={styles.cooldownText}>
                  Please wait {newPromptCooldownSeconds} second{newPromptCooldownSeconds !== 1 ? 's' : ''} before requesting new analysis...
                </Text>
                <ProgressBar 
                  value={(3 - newPromptCooldownSeconds) / 3} 
                  thickness="large"
                />
              </div>
            )}
          </div>

          {/* Accordion to show prompt text */}
          <Accordion collapsible style={{ marginTop: '16px' }}>
            <AccordionItem value="promptText">
              <AccordionHeader>View AI Prompt</AccordionHeader>
              <AccordionPanel>
                <div className={styles.promptTextContainer}>
                  {generateYourPrompt(newPromptDataset)}
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* Optional: Add accordion for dataset visualization */}
          <Accordion collapsible style={{ marginTop: '16px' }}>
            <AccordionItem value="datasetTable">
              <AccordionHeader>View Dataset</AccordionHeader>
              <AccordionPanel>
                {/* Your dataset visualization - could be a table, chart, or formatted text */}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {analyzingNewPrompt && (
            <div className={styles.loadingContainer}>
              <Spinner size="medium" />
              <Text className={styles.helperText}>
                Getting AI analysis... This may take a few seconds.
              </Text>
            </div>
          )}

          {newPromptError && (
            <div className={styles.errorContainer}>
              <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
                <MessageBarBody>
                  <strong>Error:</strong> {newPromptError}
                </MessageBarBody>
              </MessageBar>
            </div>
          )}

          {newPromptResponse && (
            <>
              <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
                <MessageBarBody>
                  AI analysis completed successfully
                </MessageBarBody>
              </MessageBar>
              <div className={styles.aiResponseContainer}>
                <MarkdownRenderer content={newPromptResponse} />
              </div>
            </>
          )}
        </>
      ) : (
        <Text className={styles.helperText}>
          No data available for analysis
        </Text>
      )}
    </div>
  );
}
```

#### 8. Write Unit Tests

Create tests for your prompt generation function in `src/utils/perplexityApi.test.ts` or a new test file:

```tsx
describe('generateYourPrompt', () => {
  it('should generate a valid prompt with data', () => {
    const data = { /* your test data */ };
    const prompt = generateYourPrompt(data);
    
    expect(prompt).toBeTruthy();
    expect(prompt).toContain('expected content');
    expect(prompt).toContain('mmol/L');
    expect(prompt).toContain('you/your');
  });
  
  // Add more test cases for edge cases
});
```

### Key Patterns to Follow

#### State Management Pattern
- Each prompt has independent state (6 variables minimum)
- State is cleared when file is deselected
- Previous responses are preserved on error

#### Cooldown Pattern
- 3-second cooldown after first analysis
- Prevents accidental excessive API calls
- Visual feedback with ProgressBar
- Button text changes to guide user

#### Error Handling Pattern
- Try/catch around API calls
- Preserve previous response on error
- Display user-friendly error messages
- Different error types (unauthorized, network, api, unknown)

#### Data Preparation Pattern
- Extract data in `useEffect` when file changes
- Store prepared data in state
- Handle errors gracefully
- Show loading state during extraction

#### UI Pattern
- Button with loading state (Spinner icon)
- Helper text changes based on state
- Accordion for prompt text (always collapsible)
- Optional accordion for dataset preview
- Loading spinner during analysis
- Success/Error MessageBar after analysis
- MarkdownRenderer for AI responses

### Common Mistakes to Avoid

1. **Don't forget the cooldown timer** - Without it, users can spam the API
2. **Don't share state between prompts** - Each prompt needs independent state
3. **Don't forget to clear state on file change** - Old responses shouldn't persist
4. **Don't forget mmol/L reminder** - Always include in prompts
5. **Don't use first person** - Always use "you/your" language in prompts
6. **Don't forget to preserve previous responses on error** - Helps with retry
7. **Don't forget error handling** - API calls can fail
8. **Don't forget loading states** - Better UX with visual feedback

### Example: Simple Text-Based Prompt

For a simple prompt that doesn't need complex data preparation:

```tsx
// 1. Add state
const [simpleAnalyzing, setSimpleAnalyzing] = useState(false);
const [simpleResponse, setSimpleResponse] = useState<string | null>(null);
// ... other state variables

// 2. Create prompt generator
export function generateSimplePrompt(value: number): string {
  return `My average glucose is ${value} mmol/L. Provide brief feedback. Use "you/your" language.`;
}

// 3. Create handler
const handleSimpleClick = async () => {
  // ... follow the pattern from step 5
  const prompt = generateSimplePrompt(averageGlucose);
  // ... call API
};

// 4. Add to TabList and renderTabContent
```

### Example: Complex Dataset Prompt

For prompts requiring CSV data and base64 encoding:

```tsx
// 1. Prepare CSV converter
export function convertDataToCSV(data: YourDataType[]): string {
  const headers = ['Column1', 'Column2', 'Column3'];
  const rows = data.map(item => [item.col1, item.col2, item.col3]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// 2. Create prompt with base64
export function generateComplexPrompt(base64Data: string): string {
  const csvData = base64Decode(base64Data);
  return `Analyze this CSV data:\n\`\`\`csv\n${csvData}\n\`\`\`\n\nProvide insights. Use mmol/L and "you/your" language.`;
}

// 3. In handler
const csvData = convertDataToCSV(dataset);
const base64Data = base64Encode(csvData);
const prompt = generateComplexPrompt(base64Data);
```

### Testing Your New Prompt

1. **Test data extraction** - Verify your dataset is prepared correctly
2. **Test prompt generation** - Check prompt contains expected content
3. **Test with mock API** - Test handler logic without API calls
4. **Test UI states** - Loading, success, error, cooldown
5. **Test edge cases** - Empty data, missing data, API errors
6. **Manual testing** - Try in browser with real data
7. **Test cooldown** - Verify 3-second cooldown works
8. **Test error recovery** - Check previous response preserved

### Files to Modify

- `src/pages/AIAnalysis.tsx` - Main component with state and UI
- `src/utils/perplexityApi.ts` - Prompt generation functions
- `src/utils/perplexityApi.test.ts` - Unit tests for prompts
- Potentially `src/utils/[dataUtils].ts` - If you need new data extraction
- Potentially `src/types/index.ts` - If you need new TypeScript types

### Summary Checklist

When adding a new AI prompt tab, ensure you have:

- [ ] Added 6+ state variables for the new prompt
- [ ] Added cooldown timer `useEffect` hook
- [ ] Added data preparation logic (if needed)
- [ ] Created prompt generation function in utils
- [ ] Created analysis handler function
- [ ] Added tab to TabList
- [ ] Added tab content rendering with all UI states
- [ ] Wrote unit tests for prompt generation
- [ ] Tested all states (loading, success, error, cooldown)
- [ ] Ran `npm run lint` and `npm test -- --run`
- [ ] Manually tested in browser

---

## Questions or Issues?

- Check existing code patterns in the repository
- Review Fluent UI documentation for component usage
- Use Copilot Chat for code explanations
- Refer to CONTRIBUTING.md for detailed guidelines
- Open a GitHub issue for bugs or feature requests

---

**Happy Coding!** Use these instructions to write consistent, high-quality code for GlookoDataWebApp. 🚀
