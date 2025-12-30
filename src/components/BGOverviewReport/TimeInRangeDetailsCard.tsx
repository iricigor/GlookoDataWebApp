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
    
    // Create AbortController for cleanup
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
    
    try {
      // Step 1: Start AI session - backend sends initial prompt to Gemini and returns ephemeral token
      const testData = `Readings in range: ${mockReadingsInRange}`;
      const sessionResult = await startAISession(idToken, testData);
      
      if (!sessionResult.success) {
        setError(sessionResult.error || 'Failed to start AI session');
        setIsAnalyzing(false);
        clearTimeout(timeoutId);
        return;
      }
      
      // Display the initial AI response from the backend
      if (sessionResult.initialResponse) {
        setAiResponse(sessionResult.initialResponse);
      }
      
      // Ensure we have a token before proceeding
      if (!sessionResult.token) {
        setError('No token received from session');
        setIsAnalyzing(false);
        clearTimeout(timeoutId);
        return;
      }
      
      // Step 2: Send additional data directly to Gemini AI using the ephemeral token
      // This bypasses our backend and goes straight to Gemini
      const additionalPrompt = 'Based on the test data provided, please analyze the Time in Range statistics and provide a brief summary.';
      
      const geminiResponse = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': sessionResult.token,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: additionalPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4000,
            },
          }),
          signal: abortController.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!geminiResponse.ok) {
        // Log full error for debugging, show generic message to user
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errorText);
        setError('AI analysis failed. Please try again later.');
        setIsAnalyzing(false);
        return;
      }
      
      const geminiData = await geminiResponse.json();
      const additionalResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (additionalResponse) {
        // Append additional response to the initial response
        setAiResponse(prev => `${prev}\n\n--- Additional Analysis ---\n${additionalResponse}`);
      }
      
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
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
        <div className={styles.errorContainer}>
          <Text>
            {t('reports.bgOverview.tirDetails.errorPrefix')} {error}
          </Text>
        </div>
      )}
      
      {/* Display AI response */}
      {aiResponse && (
        <div className={styles.aiResponseContainer}>
          <Text weight="semibold" className={styles.aiResponseTitle}>
            {t('reports.bgOverview.tirDetails.aiResponse')}
          </Text>
          <Text className={styles.aiResponseText}>
            {aiResponse}
          </Text>
        </div>
      )}
    </Card>
  );
}
