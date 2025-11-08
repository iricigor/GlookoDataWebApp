# Using GitHub Codespaces

This repository is configured for GitHub Codespaces with all necessary development tools pre-installed.

## Quick Start

1. **Open in Codespaces**: Click the "Code" button on GitHub and select "Create codespace on main"
2. **Wait for setup**: The container will build and install dependencies automatically (takes ~1-2 minutes)
3. **Start developing**: The dev server starts automatically and opens in your browser

## What's Included

### Pre-installed Tools
- Node.js 20
- npm
- Git

### VS Code Extensions
- GitHub Copilot & Copilot Chat
- ESLint
- Prettier
- TypeScript support
- React snippets
- JavaScript debugger

### Automatic Setup
- Dependencies are installed automatically (`npm install`)
- Dev server starts automatically on port 5173
- Browser opens automatically with the app

## Development Workflow

### Available Commands
You can run these commands in the terminal:

```bash
npm run dev      # Start development server (auto-started)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### VS Code Tasks
Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Tasks: Run Task" to access:
- **dev** - Start development server
- **build** - Build the application
- **lint** - Run linting
- **preview** - Preview production build

### Debugging
1. Set breakpoints in your TypeScript/React code
2. Press `F5` or go to Run and Debug panel
3. Select "Launch Chrome against localhost"
4. Debug your app with full source map support

## Port Forwarding

The dev server runs on port 5173 and is automatically forwarded to be accessible in your browser:
- **Port 5173**: Vite Dev Server (automatically opens)
- **Protocol**: HTTPS (handled by Codespaces)

You can view and manage forwarded ports in the "Ports" panel in VS Code.

## Tips

- **Hot Module Replacement**: Changes to your code will automatically update in the browser
- **GitHub Copilot**: Use natural language comments to generate code
- **Terminal**: Open integrated terminal with `` Ctrl+` ``
- **Extensions**: Additional extensions can be installed via the Extensions panel

## Troubleshooting

### Dev server not accessible
- Check the "Ports" panel to ensure port 5173 is forwarded
- Click the globe icon next to the port to open in browser

### Dependencies not installed
Run `npm install` manually in the terminal

### Server won't start
1. Stop any running dev server
2. Run `npm run dev` in the terminal

## Learn More

- [Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Fluent UI Documentation](https://react.fluentui.dev/)
