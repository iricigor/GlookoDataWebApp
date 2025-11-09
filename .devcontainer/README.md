# Dev Container Configuration

This directory contains the minimal development container configuration for GlookoDataWebApp.

## What's Included

- **Base Image**: `mcr.microsoft.com/devcontainers/javascript-node:20`
  - Minimal Node.js 20 environment
  - Includes npm and git

- **Automatic Setup**: 
  - Runs `npm install` after container creation

- **Port Forwarding**:
  - Port 5173 (Vite dev server) is automatically forwarded

## Usage

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Opening in Dev Container

1. Open this repository in VS Code
2. Press `F1` or `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Select "Dev Containers: Reopen in Container"
4. Wait for the container to build and dependencies to install

### Running the App

Once inside the dev container, you can use all the standard npm commands:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

The Vite dev server will be accessible at `http://localhost:5173/`

## Customization

This is a minimal configuration by design. If you need additional tools or VS Code extensions, you can customize `devcontainer.json`:

- Add VS Code extensions to the `customizations.vscode.extensions` array
- Add additional tools via `features`
- Add environment variables via `remoteEnv`

See the [Dev Containers documentation](https://containers.dev/) for more options.
