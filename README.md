# GlookoDataWebApp

A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform. It extends the existing Glooko PowerShell module's capabilities by offering an interactive interface for streamlined data analysis and exploration.

## 📸 Application Preview

![GlookoDataWebApp Home Page](https://github.com/user-attachments/assets/9630fcd4-4eca-4fb6-80c5-b4d53215b1c9)

The application features a modern, Microsoft Fluent UI-based interface with intuitive navigation to key sections:
- **Data Upload** - Upload and manage your Glooko export files
- **Comprehensive Reports** - View detailed analytics and trends
- **AI Analysis** - Get intelligent insights using AI algorithms
- **Settings** - Configure data persistence options and theme preferences

### Dark Mode

![GlookoDataWebApp Home Page - Dark Mode](https://github.com/user-attachments/assets/a64897c8-019f-44d7-8957-33a61b8f6c8a)

The application supports both light and dark themes with an automatic system preference detection option. Theme preferences are saved and persist across sessions.

### Data Upload Page

![Data Upload Page - Empty State](https://github.com/user-attachments/assets/446b5a28-4763-42f5-857d-5dd8c44147a2)

The Data Upload page provides an intuitive interface for importing Glooko export files with advanced features:

- **Drag-and-drop upload zone** - Simply drag ZIP files onto the page or click to browse
- **Intelligent CSV validation** - Validates metadata consistency across all CSV files
- **Metadata extraction** - Automatically extracts and displays patient info and date ranges
- **Column name detection** - Shows column headers from each CSV file
- **Accurate row counting** - Displays data row counts (excluding metadata and headers)
- **Expandable details view** - Click the chevron to see full metadata, CSV files, and column names
- **Browser-based processing** - All files are stored and processed locally for privacy

📖 **[View complete Data Upload documentation →](docs/DATA_UPLOAD.md)**

Files are maintained in memory for the duration of your session without being transmitted to any server, ensuring your data privacy.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 20 or higher)
- **npm** (comes with Node.js)
- **GitHub Copilot** (recommended for enhanced development experience)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iricigor/GlookoDataWebApp.git
cd GlookoDataWebApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173/`

## 🛠️ Development

### Available Scripts

- **`npm run dev`** - Start development server with hot module replacement (HMR)
- **`npm run build`** - Build the production-ready application
- **`npm run lint`** - Run ESLint to check code quality
- **`npm run preview`** - Preview the production build locally

### Tech Stack

This project is built with modern web technologies:

- ⚛️ **React 19** - UI library with the latest features
- 📘 **TypeScript** - Type-safe JavaScript
- ⚡ **Vite** - Next-generation frontend build tool with lightning-fast HMR
- 🎨 **Fluent UI React** - Microsoft's official React component library
- 🧹 **ESLint** - Code quality and consistency

### Project Structure

```
GlookoDataWebApp/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── App.css          # Application styles
│   ├── index.css        # Global styles
│   └── assets/          # Static assets (images, icons, etc.)
├── public/              # Public assets
├── dist/                # Production build output (generated)
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

## 🤖 GitHub Copilot Tips

This project is optimized for GitHub Copilot. Here are some tips:

1. **Component Generation**: Type a comment like `// Create a button that...` and let Copilot suggest the code
2. **Type Definitions**: Copilot understands TypeScript and will suggest properly typed code
3. **Fluent UI Components**: Copilot is trained on Fluent UI patterns and will suggest appropriate components
4. **Test Generation**: Comment `// Test for...` and Copilot can help generate test cases

## 🎨 Using Fluent UI

Fluent UI components are already set up and ready to use. Example:

```tsx
import { Button, Card } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';

function MyComponent() {
  return (
    <Card>
      <Button appearance="primary" icon={<AddRegular />}>
        Add Item
      </Button>
    </Card>
  );
}
```

Documentation: [Fluent UI React](https://react.fluentui.dev/)

## 📦 Adding Dependencies

Before adding new dependencies, check for security vulnerabilities:

```bash
npm audit
```

To install a new package:

```bash
npm install <package-name>
```

## 🔍 Code Quality

This project uses ESLint to maintain code quality. The linter runs automatically during development and before builds.

To manually check your code:

```bash
npm run lint
```

## 🏗️ Building for Production

Create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` directory, ready to be deployed to any static hosting service.

## 🌐 Deployment

The production build can be deployed to:

- **Azure Static Web Apps**
- **Netlify**
- **Vercel**
- **GitHub Pages**
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📝 License

This project is part of the Glooko data analysis ecosystem.

## 🔗 Related Projects

- [Glooko PowerShell Module](https://github.com/iricigor/Glooko) - PowerShell module for Glooko data export and analysis

---

**Happy Coding! 🚀** With React, Fluent UI, and GitHub Copilot, you're ready to build amazing features!
