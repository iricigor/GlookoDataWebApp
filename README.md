# GlookoDataWebApp

[![🧪 Test & Build](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml/badge.svg)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)
[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/iricigor/d15ec8d49e21d87f7b2fd54869d44085/raw/glookodata-webapp-tests.json)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)
[![CodeRabbit PR Reviews](https://img.shields.io/coderabbit/pr-reviews/github/iricigor/GlookoDataWebApp)](https://coderabbit.ai)

A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform. It extends the existing Glooko PowerShell module's capabilities by offering an interactive interface for streamlined data analysis and exploration.

## 📸 Application Preview

![GlookoDataWebApp Home Page](https://github.com/user-attachments/assets/9630fcd4-4eca-4fb6-80c5-b4d53215b1c9)

The application features a modern, Microsoft Fluent UI-based interface with intuitive navigation:
- **Data Upload** - Upload and manage your Glooko export files
- **Comprehensive Reports** - View detailed analytics and trends
- **AI Analysis** - Get intelligent insights using AI algorithms
- **Settings** - Configure theme preferences and glucose thresholds
- **User Authentication** - Sign in with Microsoft for a personalized experience

📸 **[View all screenshots and interface examples →](docs/SCREENSHOTS.md)**

## 🔒 Privacy First

All data processing happens locally in your browser. No files or data are transmitted to any server, ensuring complete privacy and security.

You can optionally sign in with your Microsoft account for a personalized experience. All settings remain stored locally in your browser.

## ✨ New Features

### 🌐 Multi-Language Support

The application now **automatically supports German-language Glooko exports** in addition to English:

- 🇬🇧 **English** - Standard Glooko export files
- 🇩🇪 **German** - Automatically detected and processed
- ⚡ **Zero configuration** - Language is detected from column headers
- 🔄 **Full compatibility** - All features work with both languages

Simply upload your German or English Glooko export files - the application handles the rest automatically. See the [Data Upload Guide](docs/DATA_UPLOAD.md) for details.


## 🚀 Quick Start

### For Users

Visit the live application at [https://glooko.iric.online](https://glooko.iric.online)

### For Developers

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

📖 **[Read the complete Quick Start Guide →](QUICKSTART.md)**

## 📚 Documentation

Comprehensive documentation is available to help you get started:

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Data Upload Guide](docs/DATA_UPLOAD.md)** - Learn how to import and manage your data
- **[Reports Documentation](docs/REPORTS.md)** - Understand the analytics and reports
- **[Settings Guide](docs/SETTINGS.md)** - Configure themes and glucose thresholds
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to Azure Static Web Apps
- **[Screenshots](docs/SCREENSHOTS.md)** - View all application screenshots
- **[Contributing Guide](CONTRIBUTING.md)** - Learn how to contribute to the project
- **[E2E Testing Guide](docs/E2E_TESTING.md)** - End-to-end testing with Playwright
- **[Changelog](CHANGELOG.md)** - See what's new in each version

## 🛠️ Tech Stack

This project is built with modern web technologies:

- ⚛️ **React 19** - UI library with the latest features
- 📘 **TypeScript** - Type-safe JavaScript
- ⚡ **Vite** - Next-generation frontend build tool
- 🎨 **Fluent UI React** - Microsoft's official React component library
- 🧪 **Vitest** - Fast unit testing framework
- 🎭 **Playwright** - End-to-end testing framework

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to learn about:

- Setting up your development environment
- Code style guidelines
- Testing requirements
- Submitting pull requests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Demo Data Attribution

The demo datasets included in this application are inspired by real-world Type 1 Diabetes data patterns from the **AZT1D dataset** (Khamesian et al., 2025), which is available under the Creative Commons Attribution 4.0 (CC BY 4.0) license.

**Citation:**
> Khamesian, S., Arefeen, A., Thompson, B. M., Grando, M. A., & Ghasemzadeh, H. (2025). AZT1D: A Real-World Dataset for Type 1 Diabetes. arXiv:2506.14789. DOI: [10.17632/gk9m674wcx.1](https://doi.org/10.17632/gk9m674wcx.1)

For more information about the original dataset, visit: [https://arxiv.org/abs/2506.14789](https://arxiv.org/abs/2506.14789)

## 🔗 Related Projects

- [Glooko PowerShell Module](https://github.com/iricigor/Glooko) - PowerShell module for Glooko data export and analysis

---

**Happy Coding! 🚀**
