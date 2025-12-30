/**
 * Time in Range Details Card Component
 * Displays detailed TIR breakdown with accordion sections for period, day of week, and hour analysis
 */

import { useState } from 'react';
import { 
  Text,
  Card,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Spinner,
} from '@fluentui/react-components';
import { 
  DataTrendingRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useBGOverviewStyles } from './styles';
import { useAuth } from '../../hooks/useAuth';
import { startAISession } from '../../utils/api/startAISessionApi';
import { callBackendAI } from '../../utils/api/backendAIApi';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TimeInRangeDetailsCardProps {
  // Props will be added when implementing actual content
}

// eslint-disable-next-line no-empty-pattern
export function TimeInRangeDetailsCard({}: TimeInRangeDetailsCardProps) {
  const styles = useBGOverviewStyles();
  const { t } = useTranslation('reports');
  const { idToken } = useAuth();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Mock data for testing - in real implementation this would come from props
  const mockReadingsInRange = 1234;
  
  const handleAnalyzeClick = async () => {
    if (!idToken) {
      setError('Please log in to use AI analysis');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    setAiResponse('');
    
    try {
      // Step 1: Start AI session with test data
      const testData = `Readings in range: ${mockReadingsInRange}`;
      const sessionResult = await startAISession(idToken, testData);
      
      if (!sessionResult.success) {
        setError(sessionResult.error || 'Failed to start AI session');
        setIsAnalyzing(false);
        return;
      }
      
      // Step 2: Send additional data to AI using the backend AI endpoint
      const followUpPrompt = `${sessionResult.initialPrompt}

Based on the test data provided, please analyze the Time in Range statistics and provide a brief summary.`;
      
      const aiResult = await callBackendAI(idToken, followUpPrompt);
      
      if (!aiResult.success) {
        setError(aiResult.error || 'Failed to get AI response');
        setIsAnalyzing(false);
        return;
      }
      
      // Step 3: Display the response
      setAiResponse(aiResult.content || '');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className={styles.tirCard}>
      <Text className={styles.cardTitle}>
        <DataTrendingRegular className={styles.cardIcon} />
        {t('reports.bgOverview.tirDetails.title')}
      </Text>

      {/* Three collapsed accordion sections */}
      <Accordion collapsible>
        <AccordionItem value="byPeriod">
          <AccordionHeader>
            {t('reports.bgOverview.tirDetails.byPeriod.title')}
          </AccordionHeader>
          <AccordionPanel>
            <Text>{t('reports.bgOverview.tirDetails.byPeriod.placeholder')}</Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="byDayOfWeek">
          <AccordionHeader>
            {t('reports.bgOverview.tirDetails.byDayOfWeek.title')}
          </AccordionHeader>
          <AccordionPanel>
            <Text>{t('reports.bgOverview.tirDetails.byDayOfWeek.placeholder')}</Text>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="byHour">
          <AccordionHeader>
            {t('reports.bgOverview.tirDetails.byHour.title')}
          </AccordionHeader>
          <AccordionPanel>
            <Text>{t('reports.bgOverview.tirDetails.byHour.placeholder')}</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* AI Analysis section */}
      <div className={styles.targetInfoContainer}>
        <div className={styles.targetInfo}>
          <Text style={{ marginRight: '16px' }}>
            {t('reports.bgOverview.tirDetails.readingsInRange', { count: mockReadingsInRange })}
          </Text>
          <Button
            appearance="primary"
            disabled={isAnalyzing}
            className={styles.aiAnalysisButton}
            onClick={handleAnalyzeClick}
          >
            {isAnalyzing ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                {t('reports.bgOverview.tirDetails.analyzingButton')}
              </>
            ) : (
              t('reports.bgOverview.tirDetails.analyzeButton')
            )}
          </Button>
        </div>
      </div>
      
      {/* Display error if any */}
      {error && (
        <div style={{ marginTop: '12px', color: 'red' }}>
          <Text>
            {t('reports.bgOverview.tirDetails.errorPrefix')} {error}
          </Text>
        </div>
      )}
      
      {/* Display AI response */}
      {aiResponse && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>
            {t('reports.bgOverview.tirDetails.aiResponse')}
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {aiResponse}
          </Text>
        </div>
      )}
    </Card>
  );
}
