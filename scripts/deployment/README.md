# Deployment Scripts

This directory contains Azure deployment scripts for the GlookoDataWebApp project.

## 📁 Available Scripts

### 1. deploy-azure-app-registration.sh

**Purpose:** Creates and configures Azure App Registration for Microsoft authentication.

**Run first:** This sets up user authentication for the application.

**What it creates:**
- Azure App Registration in Microsoft Entra ID
- Redirect URIs for production and local development
- API permissions (openid, profile, email, User.Read)

**Output:** Application (client) ID and Tenant ID

**Run time:** ~30 seconds

---

### 2. deploy-azure-storage-account.sh

**Purpose:** Creates Azure Storage Account and resource group.

**Run second:** This sets up the foundation for table storage.

**What it creates:**
- Azure Resource Group
- Azure Storage Account with secure defaults (HTTPS-only, TLS 1.2)

**Output:** Connection string and storage account key

**Run time:** ~2-3 minutes

---

### 3. deploy-azure-user-settings-table.sh

**Purpose:** Creates UserSettings table for storing user preferences.

**Run third:** This enables cross-device settings synchronization.

**Prerequisites:** Run `deploy-azure-storage-account.sh` first

**What it creates:**
- UserSettings table in Azure Table Storage
- CORS configuration for browser access

**Run time:** ~30 seconds

---

### 4. deploy-azure-pro-users-table.sh

**Purpose:** Creates ProUsers table for professional user management (optional).

**Run fourth (optional):** Template for future professional features.

**Prerequisites:** Run `deploy-azure-storage-account.sh` first

**What it creates:**
- ProUsers table in Azure Table Storage
- Placeholder for future user management features

**Note:** This is a template for future implementation.

**Run time:** ~30 seconds

---

## 🚀 Quick Start

### Option 1: Run Locally (if you have scripts cloned)

```bash
cd scripts/deployment

# Run in order
./deploy-azure-app-registration.sh
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
./deploy-azure-pro-users-table.sh  # Optional
```

### Option 2: Run from Azure Cloud Shell

```bash
# Download and run each script
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]
chmod +x script.sh
./script.sh
```

**To edit a script before running:**

Azure Cloud Shell provides several editors. Choose the one you're most comfortable with:

**Using nano (recommended for beginners):**
```bash
# Download script
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]

# Edit with nano
nano script.sh

# Make your changes (e.g., change LOCATION="eastus" to your preferred region)
# Save: Ctrl+O, then Enter
# Exit: Ctrl+X

# Make executable and run
chmod +x script.sh
./script.sh
```

**Using vi/vim (for advanced users):**
```bash
# Download and edit
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]
vi script.sh

# Press 'i' to enter insert mode
# Make your changes
# Press 'Esc' to exit insert mode
# Type ':wq' and press Enter to save and quit

# Make executable and run
chmod +x script.sh
./script.sh
```

**Using code editor (Azure Cloud Shell built-in):**
```bash
# Download script
curl -o script.sh https://raw.githubusercontent.com/iricigor/GlookoDataWebApp/main/scripts/deployment/[SCRIPT_NAME]

# Open in Cloud Shell editor
code script.sh

# Edit in the browser-based editor
# Save: Ctrl+S (Windows/Linux) or Cmd+S (Mac)
# Close the editor tab when done

# Make executable and run
chmod +x script.sh
./script.sh
```

**Common edits you might want to make:**
- `LOCATION="eastus"` → Change to your preferred Azure region
- `APP_NAME="glookodatawebapp"` → Change to a unique name if needed
- Redirect URIs → Add additional development URLs

See [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for detailed instructions.

---

## 📋 Prerequisites

Before running any scripts:

1. **Azure Account** with active subscription
2. **Appropriate Permissions:**
   - Contributor or Owner role on subscription
   - Application Administrator for App Registrations
3. **Azure Cloud Shell** or local Azure CLI

---

## 🔧 Script Features

All scripts include:

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Validation** - Checks prerequisites before running
- ✅ **Color-coded output** - Easy to read progress and errors
- ✅ **Error handling** - Exits on errors with clear messages
- ✅ **Detailed logging** - Shows exactly what's being created
- ✅ **Secure defaults** - Follows Azure security best practices

---

## 📖 Documentation

For comprehensive deployment instructions, see:

- **[DEPLOYMENT.md](../../docs/DEPLOYMENT.md)** - Complete deployment guide
- **[AZURE_APP_REGISTRATION.md](../../docs/AZURE_APP_REGISTRATION.md)** - App Registration details
- **[AZURE_DEPLOYMENT.md](../../docs/AZURE_DEPLOYMENT.md)** - Table Storage details (legacy)

---

## 🎯 Common Use Cases

### Initial Setup

Deploy all resources for a new installation:
```bash
./deploy-azure-app-registration.sh
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
```

### Add Storage to Existing App

If you already have App Registration:
```bash
./deploy-azure-storage-account.sh
./deploy-azure-user-settings-table.sh
```

### Add Professional Features

Add ProUsers table to existing deployment:
```bash
./deploy-azure-pro-users-table.sh
```

### Update Existing Resources

Re-run any script to update configuration:
```bash
# Scripts check for existing resources and update them
./deploy-azure-app-registration.sh  # Will prompt to update
```

---

## 🔒 Security Notes

- **Never commit** connection strings or keys to source control
- **Save output securely** - Scripts display sensitive information
- **Use Managed Identity** in production when possible
- **Rotate keys** periodically (every 90 days recommended)
- **Enable monitoring** - Set up alerts for suspicious activity

---

## 🐛 Troubleshooting

### Script Won't Run

```bash
# Make sure scripts are executable
chmod +x *.sh

# Check Azure CLI is available
az --version

# Verify you're logged in
az account show
```

### Permission Errors

Contact your Azure administrator to request:
- Contributor role on subscription
- Application Administrator role (for App Registration)

### Resource Already Exists

This is normal when re-running scripts. The script will:
- Detect existing resources
- Skip creation or prompt to update
- Continue with remaining steps

---

## 📊 What Gets Created

### Resource Group
- **Name:** `glookodatawebapp-rg`
- **Location:** `eastus` (configurable in script)

### Storage Account
- **Name:** `glookodatawebappstorage`
- **Type:** StorageV2
- **Replication:** LRS
- **Security:** HTTPS-only, TLS 1.2+

### Tables
- **UserSettings** - User preferences and settings
- **ProUsers** - Professional user accounts (optional)

### App Registration
- **Name:** `GlookoDataWebApp`
- **Type:** Single Page Application (SPA)
- **Accounts:** Personal Microsoft accounts only

---

## 💡 Customization

To customize deployment:

1. **Edit script constants** at the top of each file:
   ```bash
   # In deploy-azure-storage-account.sh
   readonly APP_NAME="glookodatawebapp"  # Change this
   readonly LOCATION="eastus"            # Change region
   ```

2. **Save your changes**

3. **Run the modified script**

---

## 📞 Support

For help with deployment:

1. Check [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for detailed instructions
2. Review [troubleshooting section](../../docs/DEPLOYMENT.md#troubleshooting)
3. Open an issue with `deployment` label

---

## 🔗 Related Files

- `/docs/DEPLOYMENT.md` - Comprehensive deployment guide
- `/docs/AZURE_APP_REGISTRATION.md` - App Registration guide
- `/scripts/README.md` - Main scripts directory README
- `/staticwebapp.config.json` - Static Web App configuration

---

**Note:** These scripts are designed for Azure Cloud Shell but work with local Azure CLI as well.
