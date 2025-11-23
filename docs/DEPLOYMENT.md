# Azure Static Web Apps Deployment Guide

This guide explains how to deploy GlookoDataWebApp to Azure Static Web Apps (SWA).

## Overview

The GlookoDataWebApp is deployed as an Azure Static Web App, which provides:
- **Global CDN** - Fast content delivery worldwide
- **Free SSL certificates** - HTTPS by default
- **Custom domains** - Easy domain configuration
- **CI/CD integration** - Automatic deployments from GitHub

All data processing happens client-side in the browser. No backend services or databases are required.

## Prerequisites

Before deploying, ensure you have:

1. **Azure Account** with an active subscription
2. **GitHub Account** with this repository forked or accessible
3. **Appropriate Permissions**:
   - Contributor or Owner role on the Azure subscription
   - Admin access to the GitHub repository

## Deployment via GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to Azure Static Web Apps:

- **Workflow file**: `.github/workflows/azure-static-web-apps-wonderful-stone-071384103.yml`
- **Trigger**: Automatic on push to main branch and PRs
- **Build**: Runs `npm run build` automatically
- **Deploy**: Deploys to Azure Static Web Apps

The workflow is pre-configured and will deploy automatically when you push to the main branch.

## Manual Deployment via Azure Portal

1. Sign in to https://portal.azure.com
2. Create a new Static Web App
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build Presets**: Vite
   - **App location**: `/` (root)
   - **Output location**: `dist`
5. Azure will automatically create a GitHub Actions workflow

## Configuration

The `staticwebapp.config.json` file configures:
- SPA routing with fallback to index.html
- Security headers
- MIME types for .zip and .json files
- Cache control for static assets

## Support

For issues, check:
- [GitHub Issues](https://github.com/iricigor/GlookoDataWebApp/issues)
- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
