/**
 * Azure Functions v4 Entry Point
 * 
 * This file serves as the main entry point for the Azure Functions application.
 * It imports all function modules to ensure they are registered with the Azure Functions runtime.
 * 
 * In Azure Functions v4 with the programming model v4, functions register themselves
 * using `app.http()` calls in their respective files. However, these files must be
 * imported somewhere for the registration code to execute.
 * 
 * Without this entry point, the function modules are never loaded, resulting in:
 * - 404 errors when calling API endpoints
 * - No function calls recorded in Azure Function logs
 * - Functions not appearing in the Azure portal
 */

// Import all function modules to trigger their registration
// The imported modules execute their app.http() calls, registering the HTTP endpoints
import './functions/checkFirstLogin';
import './functions/checkProStatus';
import './functions/userSettings';
import './functions/aiQuery';
import './functions/googleTokenExchange';
import './functions/adminStats';
import './functions/adminStatsUnified';
import './functions/adminApiStats';
import './functions/adminTestAI';
