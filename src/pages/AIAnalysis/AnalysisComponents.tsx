/**
 * Shared components for AI Analysis tabs
 */

import {
  Button,
  Text,
  ProgressBar,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { CheckmarkCircleRegular, ErrorCircleRegular } from '@fluentui/react-icons';
import { MarkdownRenderer } from '../../components/shared';
import { useAIAnalysisStyles } from './styles';
import { getProviderDisplayName, type AIProvider } from '../../utils/api';

interface AnalysisButtonProps {
  disabled: boolean;
  analyzing: boolean;
  hasResponse: boolean;
  ready: boolean;
  onClick: () => void;
}

/**
 * Button component for triggering AI analysis
 */
export function AnalysisButton({ 
  disabled, 
  analyzing, 
  hasResponse, 
  ready, 
  onClick 
}: AnalysisButtonProps) {
  return (
    <Button
      appearance="primary"
      disabled={disabled}
      onClick={onClick}
      icon={analyzing ? <Spinner size="tiny" /> : undefined}
    >
      {analyzing 
        ? 'Analyzing...' 
        : hasResponse && !ready
        ? 'Click to enable new analysis'
        : 'Analyze with AI'}
    </Button>
  );
}

interface AnalysisHelperTextProps {
  analyzing: boolean;
  cooldownActive: boolean;
  hasResponse: boolean;
  ready: boolean;
  activeProvider: AIProvider | null;
  description: string;
}

/**
 * Helper text displayed below the analysis button
 */
export function AnalysisHelperText({
  analyzing,
  cooldownActive,
  hasResponse,
  ready,
  activeProvider,
  description,
}: AnalysisHelperTextProps) {
  const styles = useAIAnalysisStyles();
  
  if (analyzing || cooldownActive) {
    return null;
  }
  
  if (hasResponse && !ready) {
    return (
      <Text className={styles.helperText}>
        Click the button above to request a new analysis
      </Text>
    );
  }
  
  return (
    <Text className={styles.helperText}>
      {description}{activeProvider ? ` (using ${getProviderDisplayName(activeProvider)})` : ''}.
    </Text>
  );
}

interface CooldownIndicatorProps {
  active: boolean;
  seconds: number;
}

/**
 * Cooldown progress indicator
 */
export function CooldownIndicator({ active, seconds }: CooldownIndicatorProps) {
  const styles = useAIAnalysisStyles();
  
  if (!active || seconds <= 0) {
    return null;
  }
  
  return (
    <div className={styles.cooldownContainer}>
      <Text className={styles.cooldownText}>
        Please wait {seconds} second{seconds !== 1 ? 's' : ''} before requesting new analysis...
      </Text>
      <ProgressBar 
        value={(3 - seconds) / 3} 
        thickness="large"
      />
    </div>
  );
}

interface AnalysisLoadingProps {
  visible: boolean;
}

/**
 * Loading indicator during analysis
 */
export function AnalysisLoading({ visible }: AnalysisLoadingProps) {
  const styles = useAIAnalysisStyles();
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className={styles.loadingContainer}>
      <Spinner size="medium" />
      <Text className={styles.helperText}>
        Getting AI analysis... This may take a few seconds.
      </Text>
    </div>
  );
}

interface AnalysisErrorProps {
  error: string | null;
}

/**
 * Error message display
 */
export function AnalysisError({ error }: AnalysisErrorProps) {
  const styles = useAIAnalysisStyles();
  
  if (!error) {
    return null;
  }
  
  return (
    <div className={styles.errorContainer}>
      <MessageBar intent="error" icon={<ErrorCircleRegular className={styles.errorIcon} />}>
        <MessageBarBody>
          <strong>Error:</strong> {error}
        </MessageBarBody>
      </MessageBar>
    </div>
  );
}

interface AnalysisResultProps {
  response: string | null;
}

/**
 * Success message and AI response display
 */
export function AnalysisResult({ response }: AnalysisResultProps) {
  const styles = useAIAnalysisStyles();
  
  if (!response) {
    return null;
  }
  
  return (
    <>
      <MessageBar intent="success" icon={<CheckmarkCircleRegular className={styles.successIcon} />}>
        <MessageBarBody>
          AI analysis completed successfully
        </MessageBarBody>
      </MessageBar>
      <div className={styles.aiResponseContainer}>
        <MarkdownRenderer content={response} />
      </div>
    </>
  );
}

interface RetryNotificationProps {
  info: string | null | undefined;
}

/**
 * Retry notification for dataset size issues
 */
export function RetryNotification({ info }: RetryNotificationProps) {
  if (!info) {
    return null;
  }
  
  return (
    <div style={{ marginTop: '16px' }}>
      <MessageBar intent="warning">
        <MessageBarBody>
          {info}
        </MessageBarBody>
      </MessageBar>
    </div>
  );
}
