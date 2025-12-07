# Contributing to GlookoDataWebApp

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Getting Started

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/GlookoDataWebApp.git
   cd GlookoDataWebApp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Enable GitHub Copilot** (Recommended)
   - Install the GitHub Copilot extension in your editor
   - Sign in with your GitHub account
   - Copilot will help you write code faster and with fewer errors

### Available Scripts

- **`npm run dev`** - Start development server with hot module replacement (HMR)
- **`npm run build`** - Build the production-ready application
- **`npm run lint`** - Run ESLint to check code quality
- **`npm run preview`** - Preview the production build locally
- **`npm test`** - Run unit tests with Vitest
- **`npm run test:ui`** - Run tests with interactive UI
- **`npm run test:coverage`** - Run tests with coverage report

## 💻 Development Workflow

### Before You Start Coding

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Understand the Codebase**
   - Review existing components in `src/`
   - Check how Fluent UI components are used in `App.tsx`
   - Look at the TypeScript types and interfaces

### Project Structure

```
GlookoDataWebApp/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── assets/          # Static assets
├── public/              # Public assets
├── docs/                # Documentation
├── dist/                # Production build output (generated)
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

### While Coding

1. **Use TypeScript**
   - Always define types for your props and state
   - Avoid using `any` type
   - Let Copilot help with type definitions

2. **Follow Fluent UI Patterns**
   - Use Fluent UI components whenever possible
   - Follow the design system guidelines
   - Use `makeStyles` for custom styling

3. **Keep Components Small**
   - Each component should have a single responsibility
   - Extract reusable logic into custom hooks
   - Split large components into smaller ones

4. **Write Clean Code**
   ```bash
   npm run lint
   ```

5. **Write Tests**
   - Add unit tests for new functionality
   - Follow existing test patterns in `src/` directories
   - Tests should be colocated with the code they test (e.g., `utils.test.ts` next to `utils.ts`)
   - Run tests frequently during development

## 🧪 Testing Guidelines

### Writing Unit Tests

This project uses Vitest for unit testing. Tests should be colocated with the code they test.

**Example test structure:**

```tsx
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- Aim for good test coverage of utility functions and hooks
- Focus on testing business logic and critical paths
- UI component testing is optional but encouraged

### CI/CD Testing

All pull requests automatically run:
1. Linting (`npm run lint`)
2. Build validation (`npm run build`)
3. Unit tests (`npm test`)

Ensure all checks pass before requesting a review.

### Testing Your Changes

1. **Run the Development Server**
   ```bash
   npm run dev
   ```

2. **Test in the Browser**
   - Open `http://localhost:5173/`
   - Test all interactive features
   - Check console for errors

3. **Run Unit Tests**
   ```bash
   npm test
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 🎨 Styling Guidelines

### Using Fluent UI Styles

```tsx
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    ...shorthands.gap('10px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
});
```

### Color Tokens

Always use Fluent UI tokens instead of hardcoded colors:
- `tokens.colorBrandForeground1` - Primary brand color
- `tokens.colorNeutralBackground1` - Neutral background
- `tokens.colorStatusSuccessForeground1` - Success color
- And many more...

## 📝 Code Style

### TypeScript

```tsx
// Good ✅
interface UserProps {
  name: string;
  age: number;
  onUpdate: (user: User) => void;
}

// Bad ❌
interface UserProps {
  name: any;
  age: any;
  onUpdate: Function;
}
```

### React Components

```tsx
// Good ✅
export function UserCard({ name, age }: UserProps) {
  const styles = useStyles();
  return <Card className={styles.card}>...</Card>;
}

// Bad ❌
export default function UserCard(props: any) {
  return <div style={{ padding: '10px' }}>...</div>;
}
```

## 🤖 Using GitHub Copilot Effectively

### Writing Comments for Copilot

```tsx
// Create a function that fetches user data from the API
// and handles loading and error states
```

### Accepting Suggestions

- Press `Tab` to accept a suggestion
- Press `Esc` to dismiss
- Press `Alt+]` for next suggestion
- Press `Alt+[` for previous suggestion

### Copilot Chat

Use Copilot Chat for:
- Explaining complex code
- Generating test cases
- Refactoring suggestions
- Finding bugs

## 🌐 Localization and i18next

This project uses **i18next with namespace segmentation** for internationalization. All user-facing text must be localized.

### Namespace Structure

Translations are organized into functional namespaces:

| Namespace | Description | Use In |
|-----------|-------------|--------|
| `common` | Shared UI elements (buttons, actions, app title) | All components (default) |
| `navigation` | Navigation menu items and related text | Navigation component |
| `home` | Home page content | Home page |
| `dataUpload` | Data upload features | Upload page and components |
| `dialogs` | All dialog components | Login, Logout, Welcome, Cookie, Error dialogs |
| `notifications` | Toast notifications | App-level notifications |

Translation files are located in:
```
public/locales/
├── en/
│   ├── common.json
│   ├── navigation.json
│   ├── home.json
│   ├── dataUpload.json
│   ├── dialogs.json
│   └── notifications.json
├── de/  # Same structure
└── cs/  # Same structure
```

### Adding New Translations

1. **Choose the appropriate namespace** based on your feature
2. **Add the translation key** to all language files in that namespace
3. **Use the translation** in your component with the correct namespace

**Example: Adding a new button to the navigation**

```tsx
// 1. Add to public/locales/en/navigation.json
{
  "navigation": {
    "myNewButton": "My New Feature"
  }
}

// 2. Add to public/locales/de/navigation.json
{
  "navigation": {
    "myNewButton": "Meine neue Funktion"
  }
}

// 3. Add to public/locales/cs/navigation.json
{
  "navigation": {
    "myNewButton": "Moje nová funkce"
  }
}

// 4. Use in your component
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('navigation');
  return <Button>{t('navigation.myNewButton')}</Button>;
}
```

### Best Practices

1. **NEVER hardcode user-facing text** - Always use `t()` function
2. **Add translations to ALL languages** - Don't leave any language incomplete
3. **Use the correct namespace** - Choose the namespace that matches your feature area
4. **Test translations** - Switch languages in the UI to verify your translations work
5. **Keep keys organized** - Use nested structures within namespaces for clarity

### Loading Multiple Namespaces

If your component needs translations from multiple namespaces:

```tsx
const { t } = useTranslation(['navigation', 'dialogs']);

// Access navigation namespace (first in array, so default)
t('navigation.home')

// Access dialogs namespace explicitly
t('dialogs:loginDialog.title')
```

### Default Namespace

Components that don't specify a namespace automatically use `common`:

```tsx
const { t } = useTranslation();  // Uses 'common' namespace
t('appTitle')  // Accesses common.appTitle
t('common.save')  // Accesses common.common.save
```

For detailed information, see:
- [i18next Namespace Design Documentation](docs/i18n-namespace-design.md)
- [Repository Custom Instructions](repository_custom_instructions.md) - Localization Workflow section

## 🔍 Code Review Checklist

Before submitting your PR, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] All existing functionality still works
- [ ] New features are properly typed with TypeScript
- [ ] New features have unit tests where applicable
- [ ] Fluent UI components are used appropriately
- [ ] Code is well-commented where necessary
- [ ] No console errors or warnings
- [ ] **All user-facing text is localized** using i18next (no hardcoded strings)
- [ ] **Translations added to ALL supported languages** (en, de, cs)
- [ ] **Correct namespace used** for translations
- [ ] Responsive design works on different screen sizes

## 📦 Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat(dashboard): add data visualization chart"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs(readme): update installation instructions"
```

## 🐛 Reporting Issues

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - How to reproduce the bug
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, OS, Node version
6. **Screenshots** - If applicable

## 💡 Suggesting Features

When suggesting features:

1. **Use Case** - Why is this feature needed?
2. **Description** - Detailed description of the feature
3. **Mockups** - Visual mockups if applicable
4. **Implementation Ideas** - Technical approach (optional)

## 🔒 Security

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be fixed before disclosure

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Fluent UI React](https://react.fluentui.dev/)
- [Vite Documentation](https://vite.dev/)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

## 🤝 Getting Help

- Open a GitHub issue for bugs or feature requests
- Use Discussions for questions and community support
- Check existing issues and discussions first

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to GlookoDataWebApp! Your efforts help make diabetes data management better for everyone. 🙏
