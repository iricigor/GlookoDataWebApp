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

### Testing Your Changes

1. **Run the Development Server**
   ```bash
   npm run dev
   ```

2. **Test in the Browser**
   - Open `http://localhost:5173/`
   - Test all interactive features
   - Check console for errors

3. **Build for Production**
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

## 🔍 Code Review Checklist

Before submitting your PR, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] All existing functionality still works
- [ ] New features are properly typed with TypeScript
- [ ] Fluent UI components are used appropriately
- [ ] Code is well-commented where necessary
- [ ] No console errors or warnings
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
