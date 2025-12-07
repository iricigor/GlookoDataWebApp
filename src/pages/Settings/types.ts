/**
 * Types for the Settings page
 */

import type { AIProvider } from '../../utils/api';

/**
 * Verification status for each API key
 * 
 * Represents the current state of API key verification:
 * - 'idle': Key has not been verified yet (or was reset after key change)
 * - 'verifying': Verification request is in progress
 * - 'valid': Key was verified and is working
 * - 'invalid': Key verification failed (invalid key or network error)
 */
export type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

/**
 * State object tracking verification status for all AI providers
 * 
 * Each provider maintains its own independent verification state,
 * which is reset when the corresponding API key changes.
 */
export interface VerificationState {
  /** Perplexity API key verification status */
  perplexity: VerificationStatus;
  /** Grok (xAI) API key verification status */
  grok: VerificationStatus;
  /** DeepSeek API key verification status */
  deepseek: VerificationStatus;
  /** Google Gemini API key verification status */
  gemini: VerificationStatus;
}

/**
 * Props for Settings tab components
 */
export interface SettingsTabProps {
  /** Styles object from parent component */
  styles: ReturnType<typeof import('./styles').useStyles>;
}

/**
 * Props for the General Settings Tab
 */
export interface GeneralSettingsTabProps extends SettingsTabProps {
  /** Current theme mode (light, dark, or system) */
  themeMode: import('../../hooks/useTheme').ThemeMode;
  /** Callback invoked when theme mode changes */
  onThemeChange: (mode: import('../../hooks/useTheme').ThemeMode) => void;
  /** Whether to show day/night shading on glucose graphs */
  showDayNightShading: boolean;
  /** Callback invoked when day/night shading preference changes */
  onShowDayNightShadingChange: (show: boolean) => void;
  /** Whether to show geek stats (technical details like AI prompts and data tables) */
  showGeekStats: boolean;
  /** Callback invoked when geek stats preference changes */
  onShowGeekStatsChange: (show: boolean) => void;
  /** Current export format for table data (CSV or TSV) */
  exportFormat: import('../../hooks/useExportFormat').ExportFormat;
  /** Callback invoked when export format changes */
  onExportFormatChange: (format: import('../../hooks/useExportFormat').ExportFormat) => void;
  /** Current UI language (English or German) */
  uiLanguage: import('../../hooks/useUILanguage').UILanguage;
  /** Callback invoked when UI language changes */
  onUILanguageChange: (language: import('../../hooks/useUILanguage').UILanguage) => void;
  /** Current language for AI response output */
  responseLanguage: import('../../hooks/useResponseLanguage').ResponseLanguage;
  /** Callback invoked when AI response language changes */
  onResponseLanguageChange: (language: import('../../hooks/useResponseLanguage').ResponseLanguage) => void;
  /** Whether to sync AI language with UI language */
  syncWithUILanguage: boolean;
  /** Callback invoked when sync preference changes */
  onSyncWithUILanguageChange: (sync: boolean) => void;
}

/**
 * Props for the Glucose Settings Tab
 */
export interface GlucoseSettingsTabProps extends SettingsTabProps {
  /** Current glucose unit (mmol/L or mg/dL) */
  glucoseUnit: import('../../types').GlucoseUnit;
  /** Callback invoked when glucose unit changes */
  onGlucoseUnitChange: (unit: import('../../types').GlucoseUnit) => void;
  /** Current glucose threshold values for time-in-range calculations */
  glucoseThresholds: import('../../types').GlucoseThresholds;
  /** Callback invoked when glucose thresholds change */
  onGlucoseThresholdsChange: (thresholds: import('../../types').GlucoseThresholds) => void;
  /** Duration of insulin action in hours for IOB calculations */
  insulinDuration: number;
  /** Callback invoked when insulin duration changes */
  onInsulinDurationChange: (duration: number) => void;
}

/**
 * Props for the AI Settings Tab
 */
export interface AISettingsTabProps extends SettingsTabProps {
  /** Perplexity AI API key */
  perplexityApiKey: string;
  /** Callback invoked when Perplexity API key changes */
  onPerplexityApiKeyChange: (key: string) => void;
  /** Google Gemini API key */
  geminiApiKey: string;
  /** Callback invoked when Gemini API key changes */
  onGeminiApiKeyChange: (key: string) => void;
  /** Grok AI API key */
  grokApiKey: string;
  /** Callback invoked when Grok API key changes */
  onGrokApiKeyChange: (key: string) => void;
  /** DeepSeek API key */
  deepseekApiKey: string;
  /** Callback invoked when DeepSeek API key changes */
  onDeepSeekApiKeyChange: (key: string) => void;
  /** Currently selected AI provider, or null for auto-selection */
  selectedProvider: AIProvider | null;
  /** Callback invoked when selected AI provider changes */
  onSelectedProviderChange: (provider: AIProvider | null) => void;
  /** Callback invoked when provider is auto-switched due to failed key verification */
  onProviderAutoSwitch?: (fromProvider: AIProvider, toProvider: AIProvider) => void;
}
