# GlookoDataWebApp

[![🧪 Test & Build](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml/badge.svg)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)
[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/iricigor/d15ec8d49e21d87f7b2fd54869d44085/raw/glookodata-webapp-tests.json)](https://github.com/iricigor/GlookoDataWebApp/actions/workflows/test.yml)
[![CodeRabbit PR Reviews](https://img.shields.io/coderabbit/prs/github/iricigor/GlookoDataWebApp)](https://coderabbit.ai)

A web app for importing, visualizing, and analyzing diabetes data exported from the Glooko platform. It extends the existing Glooko PowerShell module's capabilities by offering an interactive interface for streamlined data analysis and exploration.

## 📸 Application Preview

![GlookoDataWebApp Home Page](https://github.com/user-attachments/assets/3eee211e-a70c-4414-b51d-717e69102c4f)

The application features a modern, Microsoft Fluent UI-based interface with intuitive navigation:
- **Data Upload** - Upload and manage your Glooko export files (ZIP format)
- **Comprehensive Reports** - BG Overview, Time in Range, AGP, Rate of Change, and more
- **AI Analysis** - Get intelligent insights from Perplexity, Gemini, Grok, or DeepSeek
- **Settings** - Configure theme preferences, glucose thresholds, and AI providers
- **User Authentication** - Optional Microsoft sign-in for personalized experience

📸 **[View all screenshots and interface examples →](docs/SCREENSHOTS.md)**

## 🔒 Privacy First

All data processing happens locally in your browser. No files or data are transmitted to any server, ensuring complete privacy and security.

You can optionally sign in with your Microsoft account for a personalized experience. All settings remain stored locally in your browser.

## ✨ Key Features

### 📊 Comprehensive Glucose Analytics

The application provides professional-grade diabetes analytics:

- **BG Overview** - Consolidated Time in Range and AGP visualization with period breakdowns
- **Rate of Change (RoC)** - Gradient-colored glucose velocity analysis with interval controls
- **Hypoglycemia Detection** - Statistics, nadir markers, and pattern recognition
- **HbA1c Estimation** - Calculated from CGM data in both NGSP (%) and IFCC (mmol/mol) units
- **Time in Range** - Detailed statistics by day, week, and custom date ranges
- **AGP (Ambulatory Glucose Profile)** - Industry-standard 24-hour pattern visualization

### 🤖 AI-Powered Insights

Get intelligent recommendations from multiple AI providers:

- **Perplexity AI** - Advanced analysis with real-time insights
- **Google Gemini** - Comprehensive pattern recognition
- **Grok** - xAI's powerful analysis engine
- **DeepSeek** - Deep learning-based recommendations

AI analysis covers time in range, glucose & insulin correlation, meal timing, and pump settings.

### 🌐 Multi-Language Support

The application provides full internationalization:

**UI Languages:**
- 🇬🇧 **English** - Complete interface
- 🇩🇪 **German** - Vollständige Übersetzung
- 🇨🇿 **Czech** - Kompletní překlad

**Data Import:**
- Automatic detection for Glooko export files
- 🇬🇧 English and 🇩🇪 German formats supported
- 🔄 Zero configuration - Just upload and go

**Translation Quality:**
- Automated nightly checks ensure translation completeness
- Contributors welcome - Hardcoded text or English translations both acceptable
- Maintainers handle i18n conversion and translations
- See [Translation Checks Documentation](docs/translation-checks.md)

See the [Data Upload Guide](docs/DATA_UPLOAD.md) for details.


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

Comprehensive documentation is available:

### User Guides
- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Data Upload Guide](docs/DATA_UPLOAD.md)** - Import and manage your data
- **[Reports Documentation](docs/REPORTS.md)** - Understand analytics and reports
- **[Settings Guide](docs/SETTINGS.md)** - Configure themes and glucose thresholds
- **[Screenshots](docs/SCREENSHOTS.md)** - View all application screenshots

### Developer Guides
- **[Contributing Guide](CONTRIBUTING.md)** - Learn how to contribute
- **[E2E Testing Guide](docs/E2E_TESTING.md)** - Playwright end-to-end testing
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to Azure Static Web Apps
- **[Changelog](CHANGELOG.md)** - Version history and release notes

## 🛠️ Tech Stack

This project is built with modern web technologies:

- ⚛️ **React 19** - UI library with the latest features
- 📘 **TypeScript** - Type-safe JavaScript
- ⚡ **Vite** - Next-generation frontend build tool
- 🎨 **Fluent UI React** - Microsoft's official React component library
- 📈 **Recharts** - Composable charting library for data visualization
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
