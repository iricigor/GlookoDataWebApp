/**
 * AI Settings Tab
 * Contains AI provider API key configuration and privacy information
 */

import { useState, useEffect, useRef } from 'react';
import {
  Text,
  Divider,
  Title3,
  Input,
  Label,
  Link,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Spinner,
  Tooltip,
} from '@fluentui/react-components';
import { 
  WarningRegular, 
  InfoRegular, 
  CheckmarkRegular, 
  CheckmarkCircleRegular, 
  DismissCircleRegular, 
  QuestionCircleRegular 
} from '@fluentui/react-icons';
import { getProviderDisplayName, getActiveProvider, getAvailableProviders, verifyApiKey, type AIProvider } from '../../utils/api';
import type { AISettingsTabProps, VerificationState } from './types';

export function AISettingsTab({
  styles,
  perplexityApiKey,
  onPerplexityApiKeyChange,
  geminiApiKey,
  onGeminiApiKeyChange,
  grokApiKey,
  onGrokApiKeyChange,
  deepseekApiKey,
  onDeepSeekApiKeyChange,
  selectedProvider,
  onSelectedProviderChange,
  onProviderAutoSwitch,
}: AISettingsTabProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Verification state for each API key
  const [verificationState, setVerificationState] = useState<VerificationState>({
    perplexity: 'idle',
    grok: 'idle',
    deepseek: 'idle',
    gemini: 'idle',
  });

  // Track previous key states for auto-selection logic
  const prevKeysRef = useRef({
    perplexity: perplexityApiKey,
    grok: grokApiKey,
    deepseek: deepseekApiKey,
    gemini: geminiApiKey,
  });

  // Get available providers and determine active one
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);

  // Handle auto-selection when keys change
  useEffect(() => {
    const prevKeys = prevKeysRef.current;
    
    // Check each provider for empty->filled or filled->empty transitions
    const checkProvider = (
      provider: AIProvider,
      currentKey: string,
      prevKey: string,
      otherKeys: { perplexityKey: string; grokKey: string; deepseekKey: string; geminiKey: string }
    ) => {
      const wasEmpty = !prevKey || prevKey.trim() === '';
      const isNowEmpty = !currentKey || currentKey.trim() === '';
      const isNowFilled = currentKey && currentKey.trim() !== '';
      
      // Auto-select when new key is entered
      if (wasEmpty && isNowFilled) {
        onSelectedProviderChange(provider);
      }
      // If the active provider's key was deleted, select first available provider
      else if (!wasEmpty && isNowEmpty && activeProvider === provider) {
        const remaining = getAvailableProviders(
          otherKeys.perplexityKey,
          otherKeys.geminiKey,
          otherKeys.grokKey,
          otherKeys.deepseekKey
        );
        onSelectedProviderChange(remaining[0] || null);
      }
    };

    // Check Perplexity
    if (prevKeys.perplexity !== perplexityApiKey) {
      checkProvider('perplexity', perplexityApiKey, prevKeys.perplexity, {
        perplexityKey: '',
        geminiKey: geminiApiKey,
        grokKey: grokApiKey,
        deepseekKey: deepseekApiKey,
      });
    }

    // Check Grok
    if (prevKeys.grok !== grokApiKey) {
      checkProvider('grok', grokApiKey, prevKeys.grok, {
        perplexityKey: perplexityApiKey,
        geminiKey: geminiApiKey,
        grokKey: '',
        deepseekKey: deepseekApiKey,
      });
    }

    // Check DeepSeek
    if (prevKeys.deepseek !== deepseekApiKey) {
      checkProvider('deepseek', deepseekApiKey, prevKeys.deepseek, {
        perplexityKey: perplexityApiKey,
        geminiKey: geminiApiKey,
        grokKey: grokApiKey,
        deepseekKey: '',
      });
    }

    // Check Gemini
    if (prevKeys.gemini !== geminiApiKey) {
      checkProvider('gemini', geminiApiKey, prevKeys.gemini, {
        perplexityKey: perplexityApiKey,
        geminiKey: '',
        grokKey: grokApiKey,
        deepseekKey: deepseekApiKey,
      });
    }

    // Update ref with current keys
    prevKeysRef.current = {
      perplexity: perplexityApiKey,
      grok: grokApiKey,
      deepseek: deepseekApiKey,
      gemini: geminiApiKey,
    };
  }, [perplexityApiKey, grokApiKey, deepseekApiKey, geminiApiKey, activeProvider, onSelectedProviderChange]);

  // Reset verification state when API key changes
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, perplexity: 'idle' }));
  }, [perplexityApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, grok: 'idle' }));
  }, [grokApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, deepseek: 'idle' }));
  }, [deepseekApiKey]);
  
  useEffect(() => {
    setVerificationState(prev => ({ ...prev, gemini: 'idle' }));
  }, [geminiApiKey]);

  /**
   * Switch to the next available provider when the current one fails verification
   */
  const switchToNextAvailableProvider = (failedProvider: AIProvider) => {
    if (activeProvider !== failedProvider) return;
    
    const availableProviders = getAvailableProviders(
      perplexityApiKey,
      geminiApiKey,
      grokApiKey,
      deepseekApiKey
    ).filter(p => p !== failedProvider);
    
    if (availableProviders.length > 0) {
      const newProvider = availableProviders[0];
      onSelectedProviderChange(newProvider);
      // Notify parent about the auto-switch for toast notification
      onProviderAutoSwitch?.(failedProvider, newProvider);
    }
  };

  /**
   * Handle API key verification for a provider
   */
  const handleVerifyApiKey = async (provider: AIProvider, apiKey: string) => {
    if (!apiKey || apiKey.trim() === '') return;
    
    setVerificationState(prev => ({ ...prev, [provider]: 'verifying' }));
    
    try {
      const result = await verifyApiKey(provider, apiKey);
      const isValid = result.valid;
      setVerificationState(prev => ({ 
        ...prev, 
        [provider]: isValid ? 'valid' : 'invalid' 
      }));
      
      if (!isValid) {
        switchToNextAvailableProvider(provider);
      }
    } catch {
      setVerificationState(prev => ({ ...prev, [provider]: 'invalid' }));
      switchToNextAvailableProvider(provider);
    }
  };

  /**
   * Masks an API key, showing first 4 and last 2 characters with asterisks in between.
   */
  const maskApiKey = (key: string): string => {
    if (!key) return '';
    const FIXED_MASK_LENGTH = 8;
    if (key.length <= 6) {
      return '*'.repeat(FIXED_MASK_LENGTH);
    }
    const first4 = key.slice(0, 4);
    const last2 = key.slice(-2);
    return `${first4}${'*'.repeat(FIXED_MASK_LENGTH)}${last2}`;
  };

  // Helper function to render the status button for each API key field
  const renderStatusButton = (provider: AIProvider, hasKey: boolean) => {
    const isActive = activeProvider === provider;
    
    if (!hasKey) {
      return (
        <Button
          appearance="subtle"
          size="small"
          disabled
          className={`${styles.statusButton} ${styles.statusButtonUnavailable}`}
        >
          Unavailable
        </Button>
      );
    }
    
    if (isActive) {
      return (
        <Button
          appearance="primary"
          size="small"
          icon={<CheckmarkRegular />}
          className={`${styles.statusButton} ${styles.statusButtonSelected}`}
        >
          Selected
        </Button>
      );
    }
    
    return (
      <Button
        appearance="subtle"
        size="small"
        onClick={() => onSelectedProviderChange(provider)}
        className={styles.statusButton}
      >
        Select
      </Button>
    );
  };

  /**
   * Render the verification button for an API key field
   */
  const renderVerifyButton = (provider: AIProvider, apiKey: string) => {
    const status = verificationState[provider];
    const hasKey = !!apiKey && apiKey.trim() !== '';
    
    const getTooltipText = () => {
      switch (status) {
        case 'verifying':
          return 'Verifying API key...';
        case 'valid':
          return 'API key is valid';
        case 'invalid':
          return 'API key is invalid';
        default:
          return hasKey ? 'Click to verify API key' : 'No API key to verify';
      }
    };
    
    const getIcon = () => {
      switch (status) {
        case 'verifying':
          return <Spinner size="tiny" />;
        case 'valid':
          return <CheckmarkCircleRegular className={styles.verifyButtonValid} />;
        case 'invalid':
          return <DismissCircleRegular className={styles.verifyButtonInvalid} />;
        default:
          return <QuestionCircleRegular />;
      }
    };
    
    return (
      <Tooltip content={getTooltipText()} relationship="label">
        <Button
          appearance="subtle"
          size="small"
          icon={getIcon()}
          disabled={!hasKey || status === 'verifying'}
          onClick={() => handleVerifyApiKey(provider, apiKey)}
          className={styles.verifyButton}
          aria-label={getTooltipText()}
        />
      </Tooltip>
    );
  };

  // Helper function to render privacy info icon
  const renderPrivacyIcon = (privacyUrl: string) => {
    return (
      <Link
        href={privacyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.privacyInfoButton}
        title="Privacy Policy"
      >
        <InfoRegular />
      </Link>
    );
  };

  // Helper to render a single API key row
  const renderApiKeyRow = (
    provider: AIProvider,
    providerName: string,
    apiKey: string,
    onApiKeyChange: (key: string) => void,
    privacyUrl: string,
    inputId: string
  ) => {
    const isEditing = editingField === inputId;
    const displayValue = isEditing ? apiKey : (apiKey ? maskApiKey(apiKey) : '');
    const isReadOnly = !isEditing && !!apiKey;
    
    return (
      <div className={styles.apiKeyRow}>
        <Label htmlFor={inputId} className={styles.apiKeyLabel}>
          {providerName}
        </Label>
        <div className={styles.apiKeyInputGroup}>
          <Input
            id={inputId}
            type={isEditing ? 'password' : 'text'}
            value={displayValue}
            onChange={(_, data) => onApiKeyChange(data.value)}
            onFocus={() => setEditingField(inputId)}
            onBlur={() => setEditingField(null)}
            placeholder="Enter your API key"
            appearance="underline"
            className={styles.apiKeyInputBorderless}
            readOnly={isReadOnly}
          />
          {renderVerifyButton(provider, apiKey)}
          {renderStatusButton(provider, !!apiKey)}
        </div>
        {renderPrivacyIcon(privacyUrl)}
      </div>
    );
  };

  return (
    <>
      <div className={styles.settingSection}>
        <Title3 className={styles.sectionTitle}>AI Configuration</Title3>
        <Divider className={styles.divider} />
        <Text className={styles.settingDescription}>
          Configure your AI settings for intelligent analysis. Click "Select" next to any configured API key to switch providers.
        </Text>
        
        <div className={styles.apiKeyContainer}>
          {renderApiKeyRow(
            'perplexity',
            'Perplexity',
            perplexityApiKey,
            onPerplexityApiKeyChange,
            'https://www.perplexity.ai/hub/faq/privacy-and-security',
            'perplexity-api-key'
          )}
          
          {renderApiKeyRow(
            'grok',
            'Grok AI',
            grokApiKey,
            onGrokApiKeyChange,
            'https://x.ai/legal/privacy-policy',
            'grok-api-key'
          )}
          
          {renderApiKeyRow(
            'deepseek',
            'DeepSeek',
            deepseekApiKey,
            onDeepSeekApiKeyChange,
            'https://www.deepseek.com/en/privacy',
            'deepseek-api-key'
          )}
          
          {renderApiKeyRow(
            'gemini',
            'Google Gemini',
            geminiApiKey,
            onGeminiApiKeyChange,
            'https://policies.google.com/privacy',
            'gemini-api-key'
          )}
        </div>
        
        {/* Information Sections - All in one accordion */}
        <div className={styles.infoSection}>
          <Accordion collapsible multiple>
            {/* Free API Key Availability */}
            <AccordionItem value="freeapi">
              <AccordionHeader>
                <Text className={styles.accordionSummary}>
                  <strong>🎁 Free API Key Availability</strong> — Information about free tier options for each AI provider.
                </Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    <strong>Google Gemini:</strong> ✅ Offers a free tier with monthly quota for API calls.{' '}
                    <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                      Get your free API key
                    </Link>
                  </p>
                  <p>
                    <strong>DeepSeek:</strong> ✅ Offers limited free cloud API tier with monthly requests.{' '}
                    <Link href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                      Get your free API key
                    </Link>
                  </p>
                  <p>
                    <strong>Perplexity:</strong> ⚠️ API is primarily paid with limited free tier.{' '}
                    <Link href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                      Check pricing
                    </Link>
                  </p>
                  <p>
                    <strong>Grok AI:</strong> ❌ No free API access. Requires X Premium+ subscription ($30/month).{' '}
                    <Link href="https://console.x.ai/" target="_blank" rel="noopener noreferrer">
                      Learn more
                    </Link>
                  </p>
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* Important: Data Handling & Your Responsibility */}
            <AccordionItem value="datahandling">
              <AccordionHeader>
                <div className={styles.warningHeader}>
                  <WarningRegular className={styles.warningIcon} />
                  <Text className={styles.accordionSummary}>
                    <strong>Important: Data Handling & Your Responsibility</strong> — Your health data is sent to AI providers when using analysis features.
                  </Text>
                </div>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    When you use AI analysis features, your sensitive health data will be sent to the selected AI provider ({activeProvider ? getProviderDisplayName(activeProvider) : 'the configured AI service'}). The data is sent <strong>without personally identifiable information</strong> (such as your name or email), but the AI provider may be able to associate your API key with the health data you send.
                  </p>
                  <p>
                    <strong>Your Responsibility:</strong> You are responsible for the security of this information and its use in accordance with all applicable data protection rules and regulations. Review the privacy policies of your chosen AI provider before using these features.
                  </p>
                  <p>
                    <strong>Best Practices:</strong> Monitor your API key usage regularly through your provider's dashboard, apply least privilege access permissions when creating API keys, and set daily spending limits to prevent unexpected charges and unauthorized usage.
                  </p>
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* API Key Storage */}
            <AccordionItem value="storage">
              <AccordionHeader>
                <Text className={styles.accordionSummary}>
                  <strong>API Key Storage:</strong> Your API keys are stored locally in your browser and never sent to our servers.
                </Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    Your API keys are stored locally in your browser's local storage (not cookies) and persist until you manually clear them or clear your browser data. The keys are never transmitted to our servers or any third party.
                  </p>
                  <p>
                    <strong>Technical Details:</strong> We use browser local storage API, which provides persistent storage that remains available across browser sessions. This data is stored only on your device and is accessible only by this web application from the same domain.
                  </p>
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* AI Communication */}
            <AccordionItem value="communication">
              <AccordionHeader>
                <Text className={styles.accordionSummary}>
                  <strong>AI Communication:</strong> All AI analysis happens directly between your browser and the AI provider—no intermediary servers.
                </Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    When you request AI analysis, your browser sends the request directly to the selected AI provider's API. Our application does not act as an intermediary—the communication goes straight from your browser to the AI provider.
                  </p>
                  <p>
                    <strong>Provider Priority:</strong> If multiple API keys are configured, they are used in this order: Perplexity → Grok AI → DeepSeek → Google Gemini. To use a different provider, remove the API keys with higher priority.
                  </p>
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* Security Best Practices */}
            <AccordionItem value="bestpractices">
              <AccordionHeader>
                <Text className={styles.accordionSummary}>
                  <strong>Security Best Practices:</strong> Follow these recommendations to keep your API keys and data secure.
                </Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    <strong>Create Secure API Keys:</strong> Use minimal permissions when creating API keys at:
                  </p>
                  <ul>
                    <li>
                      <Link href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">
                        Perplexity Settings
                      </Link>
                    </li>
                    <li>
                      <Link href="https://console.x.ai/" target="_blank" rel="noopener noreferrer">
                        xAI Console
                      </Link> (for Grok AI)
                    </li>
                    <li>
                      <Link href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">
                        DeepSeek Platform
                      </Link>
                    </li>
                    <li>
                      <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                        Google AI Studio
                      </Link>
                    </li>
                  </ul>
                  <p>
                    <strong>Protect Your Keys:</strong> Choose keys designated for client-side applications and set spending limits to prevent unexpected charges. Monitor your API key usage regularly through your provider's dashboard.
                  </p>
                  <p>
                    <strong>Risk Mitigation:</strong> If someone gains access to your browser session or computer, they could potentially access your stored API key. To reduce this risk:
                  </p>
                  <ul>
                    <li>Log out from shared computers</li>
                    <li>Use browser privacy features (private/incognito mode when appropriate)</li>
                    <li>Regularly rotate your API keys</li>
                    <li>Monitor your API usage in your provider's dashboard</li>
                    <li>Clear browser data when using public computers</li>
                  </ul>
                </div>
              </AccordionPanel>
            </AccordionItem>

            {/* Data Storage */}
            <AccordionItem value="datastorage">
              <AccordionHeader>
                <Text className={styles.accordionSummary}>
                  <strong>Data Storage:</strong> Your data is stored locally with configurable persistence options.
                </Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.accordionContent}>
                  <p>
                    Your data is stored locally with configurable persistence options. All processing happens in your browser. This application is fully open source—you can{' '}
                    <Link href="https://github.com/iricigor/GlookoDataWebApp" target="_blank" rel="noopener noreferrer">
                      review the code on GitHub
                    </Link>{' '}
                    or deploy your own instance for complete control.
                  </p>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
}
