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

## Azure Infrastructure Deployment Scripts

This section provides guidelines for creating and maintaining Azure deployment scripts for GlookoDataWebApp infrastructure. The scripts are designed to run in Azure Cloud Shell (both bash and PowerShell) and follow consistent patterns.

### Core Requirements

All Azure deployment scripts must follow these requirements:

1. **Azure CLI Compatibility** - Scripts must run in Azure Cloud Shell using Azure CLI commands
2. **Dual Language Support** - Provide both bash and PowerShell versions for each script
3. **Idempotent Execution** - Scripts must be safe to run multiple times without side effects
4. **Complete Configuration** - Each script fully configures its target resource
5. **Single Resource Focus** - One script creates/modifies only one resource type
6. **Self-Sufficient** - If dependent on existing resources, fetch required properties automatically
7. **Configuration File Support** - Load values from config file if not provided as parameters

### Scripts Required for Azure Infrastructure

The following scripts are needed for the complete Azure infrastructure:

| Resource Type | Bash Script | PowerShell Function |
|--------------|-------------|---------------------|
| Storage Account | `deploy-azure-storage-account.sh` | `Set-GlookoStorageAccount` |
| Table Storage (UserSettings) | `deploy-azure-user-settings-table.sh` | `Set-GlookoTableStorage` |
| Table Storage (ProUsers) | `deploy-azure-pro-users-table.sh` | `Set-GlookoTableStorage` |
| Key Vault | `deploy-azure-key-vault.sh` | `Set-GlookoKeyVault` |
| Azure Function | `deploy-azure-function.sh` | `Set-GlookoAzureFunction` |
| Managed Identity | `deploy-azure-managed-identity.sh` | `Set-GlookoManagedIdentity` |
| Static Web App | `deploy-azure-static-web-app.sh` | `Set-GlookoStaticWebApp` |
| App Registration | `deploy-azure-app-registration.sh` | `Set-GlookoAppRegistration` |
| Verification Test | `test-azure-resources.sh` | `Test-GlookoDeployment` |

### Directory Structure

```
scripts/
├── deployment-cli/           # Bash scripts for Azure CLI
│   ├── config-lib.sh         # Shared configuration library
│   ├── config.template.json  # Configuration template
│   ├── ...                   # deploy-azure-*.sh scripts (see Scripts table above)
│   └── README.md
├── deployment-ps/            # PowerShell module and scripts
│   ├── GlookoDeployment/     # PowerShell module
│   │   ├── GlookoDeployment.psd1  # Module manifest
│   │   ├── GlookoDeployment.psm1  # Module loader
│   │   ├── Public/           # Exported functions (Set-Glooko*.ps1, Get-Glooko*.ps1, etc.)
│   │   └── Private/          # Internal helper functions
│   ├── Install-GlookoDeploymentModule.ps1  # One-liner installer
│   └── README.md
└── README.md                 # Main scripts directory overview
```

### PowerShell Module Versioning

When adding or updating deployment scripts:
1. **Bump the module version** in `GlookoDeployment.psd1` (ModuleVersion field)
2. Use semantic versioning: MAJOR.MINOR.PATCH
   - PATCH: Bug fixes, documentation updates
   - MINOR: New scripts/functions added
   - MAJOR: Breaking changes to existing scripts

### Why Azure CLI Instead of Azure PowerShell Cmdlets

The PowerShell scripts use Azure CLI (`az`) instead of Azure PowerShell cmdlets for these reasons:
1. **Azure Cloud Shell compatibility** - Azure CLI is pre-installed in Azure Cloud Shell
2. **Consistency** - Same syntax between bash and PowerShell versions of scripts
3. **Cross-platform** - Better support for local development on Windows, macOS, and Linux
4. **Maintainability** - Single set of Azure commands to maintain across both script types

To use Azure PowerShell cmdlets instead, you would replace commands like:
- `az functionapp create` → `New-AzFunctionApp`
- `az identity show` → `Get-AzUserAssignedIdentity`
- `az role assignment create` → `New-AzRoleAssignment`

### Configuration System

#### Configuration File Location

All scripts use a centralized configuration file at: `~/.glookodata/config.json`

This location persists in Azure Cloud Shell across sessions.

#### Configuration Precedence

Configuration values are resolved in this order (highest to lowest priority):

1. **Command-line arguments** (highest priority)
   ```bash
   ./deploy-azure-storage-account.sh --name myaccount --location westus2
   ```

2. **Environment variables**
   ```bash
   LOCATION=westus2 STORAGE_ACCOUNT_NAME=myaccount ./deploy-azure-storage-account.sh
   ```

3. **Configuration file** (`~/.glookodata/config.json`)
   ```json
   {
     "location": "eastus",
     "storageAccountName": "glookodatawebappstorage"
   }
   ```

4. **Script defaults** (lowest priority)

#### Configuration File Schema

```json
{
  "resourceGroup": "glookodatawebapp-rg",
  "location": "eastus",
  "appName": "glookodatawebapp",
  "storageAccountName": "glookodatawebappstorage",
  "managedIdentityName": "glookodatawebapp-identity",
  "staticWebAppName": "glookodatawebapp-swa",
  "staticWebAppSku": "Standard",
  "keyVaultName": "glookodatawebapp-kv",
  "functionAppName": "glookodatawebapp-func",
  "webAppUrl": "https://glooko.iric.online",
  "appRegistrationName": "GlookoDataWebApp",
  "signInAudience": "PersonalMicrosoftAccount",
  "useManagedIdentity": true,
  "tags": {
    "Application": "GlookoDataWebApp",
    "Environment": "Production",
    "ManagedBy": "AzureDeploymentScripts"
  }
}
```

### Bash Script Template

All bash scripts should follow this template:

```bash
#!/bin/bash

################################################################################
# Azure [Resource Name] Deployment Script
# 
# This script creates and configures [resource description] for the
# GlookoDataWebApp application.
#
# Prerequisites:
#   - Run this script in Azure Cloud Shell (bash) or with Azure CLI installed
#   - Must have appropriate permissions to create resources
#   - [List any dependent resources]
#
# Usage:
#   ./deploy-azure-[resource].sh [OPTIONS]
#
# Options:
#   -h, --help              Show this help message
#   -n, --name NAME         Resource name (default from config)
#   -g, --resource-group RG Resource group name (default from config)
#   -l, --location LOCATION Azure region (default from config)
#   -c, --config FILE       Custom configuration file path
#   -s, --save              Save configuration after deployment
#   -v, --verbose           Enable verbose output
#
# Examples:
#   ./deploy-azure-[resource].sh
#   ./deploy-azure-[resource].sh --name my-resource --location westus2
#
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Get script directory for sourcing config-lib
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration library
if [ -f "${SCRIPT_DIR}/config-lib.sh" ]; then
    source "${SCRIPT_DIR}/config-lib.sh"
else
    echo "ERROR: config-lib.sh not found in ${SCRIPT_DIR}"
    exit 1
fi

################################################################################
# ARGUMENT PARSING
################################################################################

show_help() {
    cat << EOF
[Script description and usage details]
EOF
}

parse_arguments() {
    SAVE_CONFIG=false
    VERBOSE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            # Add more argument cases
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

################################################################################
# RESOURCE DEPLOYMENT FUNCTIONS
################################################################################

# Check if resource exists (idempotent check)
check_existing_resource() {
    # Implementation
}

# Create or update the resource
create_resource() {
    print_section "Creating [Resource Name]"
    
    # Check existing
    if resource_exists "[type]" "${RESOURCE_NAME}" "${RESOURCE_GROUP}"; then
        print_warning "Resource already exists"
        RESOURCE_EXISTS=true
    else
        # Create resource
        az [command] create \
            --name "${RESOURCE_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --location "${LOCATION}" \
            --tags ${CONFIG_TAGS}
        
        print_success "Resource created successfully"
        RESOURCE_EXISTS=false
    fi
}

# Display deployment summary
display_summary() {
    print_section "Deployment Summary"
    
    print_success "[Resource] configured successfully!"
    # Display details
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    parse_arguments "$@"
    load_config
    
    print_section "Azure [Resource] Deployment"
    
    check_prerequisites
    ensure_resource_group
    create_resource
    
    save_configuration
    display_summary
    
    print_section "Deployment Complete"
}

main "$@"
```

### PowerShell Function Template

All PowerShell public functions should follow this template:

```powershell
#Requires -Version 7.0

<#
.SYNOPSIS
    Creates or updates Azure [Resource] for GlookoDataWebApp.

.DESCRIPTION
    This function creates and configures [resource description] for the
    GlookoDataWebApp application. It is idempotent and safe to run multiple times.

.PARAMETER Name
    The name of the resource. If not provided, uses value from configuration.

.PARAMETER ResourceGroup
    The Azure resource group name. If not provided, uses value from configuration.

.PARAMETER Location
    The Azure region. If not provided, uses value from configuration.

.PARAMETER UseManagedIdentity
    Configure the resource to use managed identity for authentication.

.EXAMPLE
    Set-GlookoResource

.EXAMPLE
    Set-GlookoResource -Name "my-resource" -Location "westus2"

.EXAMPLE
    Set-GlookoResource -UseManagedIdentity

.NOTES
    Requires Azure CLI to be installed and logged in.
    Run in Azure Cloud Shell for best experience.
#>
function Set-GlookoResource {
    [CmdletBinding()]
    [Alias("Set-GR")]  # Short alias using capital letters
    param(
        [Parameter()]
        [string]$Name,

        [Parameter()]
        [string]$ResourceGroup,

        [Parameter()]
        [string]$Location,

        [Parameter()]
        [switch]$UseManagedIdentity
    )

    begin {
        Write-InfoMessage "Starting [Resource] deployment..."
        
        # Load configuration
        $config = Get-GlookoConfig
        
        # Apply configuration precedence
        $resourceName = if ($Name) { $Name } else { $config.resourceName }
        $rg = if ($ResourceGroup) { $ResourceGroup } else { $config.resourceGroup }
        $loc = if ($Location) { $Location } else { $config.location }
    }

    process {
        try {
            # Check prerequisites
            if (-not (Test-AzureCli)) {
                throw "Azure CLI is not available"
            }

            # Ensure resource group exists
            Initialize-GlookoResourceGroup -Name $rg -Location $loc

            # Check if resource exists (idempotent)
            $existing = az [command] show --name $resourceName --resource-group $rg 2>$null
            if ($existing) {
                Write-WarningMessage "Resource '$resourceName' already exists"
                $created = $false
            }
            else {
                # Create resource
                Write-InfoMessage "Creating resource: $resourceName"
                $result = az [command] create `
                    --name $resourceName `
                    --resource-group $rg `
                    --location $loc `
                    --output json | ConvertFrom-Json

                Write-SuccessMessage "Resource created successfully"
                $created = $true
            }

            # Return deployment details
            return @{
                Name = $resourceName
                ResourceGroup = $rg
                Location = $loc
                Created = $created
            }
        }
        catch {
            Write-ErrorMessage "Failed to create resource: $_"
            throw
        }
    }

    end {
        Write-InfoMessage "Deployment complete"
    }
}
```

### Shared Configuration Library (Bash)

The `config-lib.sh` file provides shared functionality:

```bash
# Output functions
print_info()    # Blue info message with ℹ️
print_success() # Green success message with ✅
print_warning() # Yellow warning message with ⚠️
print_error()   # Red error message with ❌
print_section() # Section header with separator lines

# Configuration functions
get_config_value()      # Get value from JSON config
load_config()           # Load all config with precedence
save_config_value()     # Save value to config file
ensure_config_dir()     # Create config directory if needed

# Azure validation
check_azure_cli()       # Verify Azure CLI is available
check_azure_login()     # Verify user is logged in
check_prerequisites()   # Run all prerequisite checks

# Resource management
ensure_resource_group() # Create resource group if needed
resource_exists()       # Check if resource exists

# Managed identity
get_managed_identity_id()           # Get client ID
get_managed_identity_principal_id() # Get principal ID
```

### Key Vault Script Guidelines

For the Key Vault deployment script specifically:

1. **Secret Management**:
   - Script should create the Key Vault but only add dummy/placeholder secrets
   - Real secrets are added manually by the administrator
   - Document which secrets are expected

2. **Access Control**:
   - Use RBAC for access control (not access policies)
   - Script creator should have write access
   - Application should have read-only access via managed identity

3. **Example Usage**:
   ```bash
   ./deploy-azure-key-vault.sh
   # Then manually:
   az keyvault secret set --vault-name mykeyvault --name "ApiKey" --value "actual-secret-value"
   ```

### Azure Function Script Guidelines

For the Azure Function deployment script:

1. **Managed Identity Integration**:
   - Assign user-assigned managed identity to the function
   - Configure RBAC roles for Storage Account access
   - Configure RBAC roles for Key Vault access

2. **Required Configuration**:
   ```bash
   # Function app should have:
   # - Managed identity assigned
   # - Storage Table Data Contributor on Storage Account
   # - Key Vault Secrets User on Key Vault
   ```

3. **Application Settings**:
   - Configure connection to Storage Account (via managed identity)
   - Configure connection to Key Vault (via managed identity)

### Test Script Guidelines

The test script should verify:

1. **Resource Existence**:
   - All expected resources exist
   - Resources are in the expected resource group

2. **Access Verification**:
   - Managed identity has proper RBAC roles
   - Function app can access Storage Account
   - Function app can read from Key Vault

3. **Output Format**:
   ```
   ✅ Storage Account: exists
   ✅ Key Vault: exists
   ✅ Function App: exists
   ✅ Managed Identity: exists
   ✅ Storage access: verified
   ✅ Key Vault access: verified
   
   All checks passed!
   ```

### Best Practices

1. **Security**:
   - Never store secrets in scripts or config files
   - Use managed identity for authentication when possible
   - Apply least-privilege access principles

2. **Idempotency**:
   - Always check if resource exists before creating
   - Use `--tags` for resource tracking
   - Handle "already exists" gracefully

3. **Error Handling**:
   - Use `set -e` in bash scripts
   - Provide clear error messages
   - Include troubleshooting tips in output

4. **Documentation**:
   - Include header with usage examples
   - Document all parameters
   - Provide next steps after deployment

5. **Testing**:
   - Test scripts in clean environment
   - Test idempotency (run twice)
   - Test with different configuration sources

### Installation

> **Security Note:** When downloading and executing scripts from the internet, always review the script content first. For production environments, consider cloning the repository and reviewing the scripts before execution, or use tagged releases for version control.

#### Bash Scripts (Direct Download)

```bash
# Download master script (review content before executing)
curl -o deploy-azure-master.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-cli/deploy-azure-master.sh
chmod +x deploy-azure-master.sh

# Review the script before running
cat deploy-azure-master.sh | less

# Deploy all resources
./deploy-azure-master.sh --all
```

#### PowerShell Module (One-liner Install)

```powershell
# Option 1: Download and review before executing (recommended)
$script = irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1
$script | Out-File -FilePath .\Install-GlookoDeploymentModule.ps1
# Review the script, then run:
.\Install-GlookoDeploymentModule.ps1

# Option 2: Direct installation (for trusted environments only)
iex (irm https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment-ps/Install-GlookoDeploymentModule.ps1)

# Or local install from cloned repository
./Install-GlookoDeploymentModule.ps1 -LocalPath ./GlookoDeployment

# Deploy all resources
Invoke-GlookoDeployment -All
```

#### Alternative: Clone Repository (Most Secure)

```bash
# Clone repository to review all scripts
git clone https://github.com/iricigor/GlookoDataWebApp.git
cd GlookoDataWebApp/scripts/deployment-cli

# Review and run
./deploy-azure-master.sh --all
```

### Related Documentation

- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Comprehensive deployment guide
- [scripts/deployment-cli/README.md](../scripts/deployment-cli/README.md) - Bash scripts documentation
- [scripts/deployment-ps/README.md](../scripts/deployment-ps/README.md) - PowerShell module documentation

---

## Questions or Issues?

- Check existing code patterns in the repository
- Review Fluent UI documentation for component usage
- Use Copilot Chat for code explanations
- Refer to CONTRIBUTING.md for detailed guidelines
- Open a GitHub issue for bugs or feature requests

---

**Happy Coding!** Use these instructions to write consistent, high-quality code for GlookoDataWebApp. 🚀
