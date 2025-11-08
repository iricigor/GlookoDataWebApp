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

1. **Run tests**
   ```bash
   npm test -- --run
   ```

2. **Lint the code**
   ```bash
   npm run lint
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Test the production build**
   ```bash
   npm run preview
   ```

5. **Manual testing checklist:**
   - [ ] All pages load without errors
   - [ ] Navigation works correctly
   - [ ] User interactions work as expected
   - [ ] No console errors or warnings
   - [ ] Responsive design works on different screen sizes
   - [ ] Privacy: no data sent to external servers

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

## Questions or Issues?

- Check existing code patterns in the repository
- Review Fluent UI documentation for component usage
- Use Copilot Chat for code explanations
- Refer to CONTRIBUTING.md for detailed guidelines
- Open a GitHub issue for bugs or feature requests

---

**Happy Coding!** Use these instructions to write consistent, high-quality code for GlookoDataWebApp. 🚀
