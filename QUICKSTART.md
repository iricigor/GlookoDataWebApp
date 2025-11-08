# Quick Start Guide for Developers

Welcome to GlookoDataWebApp! This guide will help you get up and running in minutes.

## ⚡ 3-Minute Setup

### Step 1: Clone and Install (1 minute)
```bash
git clone https://github.com/iricigor/GlookoDataWebApp.git
cd GlookoDataWebApp
npm install
```

### Step 2: Start Development Server (30 seconds)
```bash
npm run dev
```

Open your browser to `http://localhost:5173/` and you should see the welcome page!

### Step 3: Make Your First Change (1 minute)
1. Open `src/App.tsx` in your editor
2. Change the title text on line 56
3. Save the file
4. Watch the page automatically update (Hot Module Replacement)

Congratulations! You're ready to develop! 🎉

## 🎯 What You Can Do Now

### Create a New Component

Create a new file `src/components/MyComponent.tsx`:

```tsx
import { Button } from '@fluentui/react-components';

export function MyComponent() {
  return (
    <Button appearance="primary">
      Click Me
    </Button>
  );
}
```

### Use Fluent UI Components

Browse available components at [Fluent UI React](https://react.fluentui.dev/). All components are already installed!

Common components you'll use:
- `Button` - Buttons in various styles
- `Card` - Container for content
- `Text` - Typography with consistent styling
- `Input` - Text input fields
- `Dropdown` - Select from options
- `Dialog` - Modal dialogs
- `Spinner` - Loading indicators

### Use GitHub Copilot

With Copilot enabled, try typing:
```tsx
// Create a card that displays user information with name, email, and avatar
```

Press Enter and watch Copilot generate the component for you!

### Add a Custom Hook

Create `src/hooks/useMyHook.ts`:

```tsx
import { useState } from 'react';

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  // Your hook logic here
  
  return { value, setValue };
}
```

### Style Your Components

Use Fluent UI's `makeStyles` for consistent styling:

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

export function MyComponent() {
  const styles = useStyles();
  return <div className={styles.container}>Content</div>;
}
```

## 🔧 Common Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check code with ESLint

# Dependency Management
npm install <pkg>    # Add a new package
npm update          # Update all packages
npm audit           # Check for security issues
```

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main application component |
| `src/main.tsx` | Application entry point |
| `src/components/` | Reusable UI components |
| `src/hooks/` | Custom React hooks |
| `src/types/` | TypeScript type definitions |
| `src/utils/` | Helper functions |
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript configuration |

## 🤖 GitHub Copilot Tips

1. **Write Comments First**: Describe what you want, then let Copilot suggest code
2. **Use Descriptive Names**: Good variable/function names help Copilot understand context
3. **Accept and Modify**: Accept suggestions and tweak them to fit your needs
4. **Use Copilot Chat**: Ask questions like "How do I create a date picker with Fluent UI?"

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill the process using port 5173
# On Linux/Mac:
lsof -ti:5173 | xargs kill -9
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
# Type "TypeScript: Restart TS Server"
```

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Fluent UI React](https://react.fluentui.dev/)
- [Vite Guide](https://vite.dev/guide/)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)

## 💡 Next Steps

1. Explore the example components in `src/components/`
2. Read the full [README.md](README.md)
3. Check out [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
4. Start building your feature!

## 🆘 Need Help?

- Check the [Issues](https://github.com/iricigor/GlookoDataWebApp/issues) page
- Start a [Discussion](https://github.com/iricigor/GlookoDataWebApp/discussions)
- Review the documentation in this repository

Happy coding! 🚀
