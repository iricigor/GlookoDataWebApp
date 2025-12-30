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
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import { 
  DataTrendingRegular,
  FilterRegular,
  CalendarLtrRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import type { 
  RangeCategoryMode, 
  AGPDayOfWeekFilter,
  DayOfWeekReport,
  TimePeriodTIRStats,
  HourlyTIRStats,
} from '../../types';
import { 
  calculatePercentage, 
  MIN_PERCENTAGE_FOR_PERIOD_BAR,
} from '../../utils/data';
import { useBGOverviewStyles } from './styles';
import { useAuth } from '../../hooks/useAuth';
import { startAISession } from '../../utils/api/startAISessionApi';
import { getColorForCategory } from './types';
import type { TIRStats } from './types';
import { TimeInRangeByDaySection } from './TimeInRangeByDaySection';

interface TimeInRangeDetailsCardProps {
  categoryMode: RangeCategoryMode;
  dayFilter: AGPDayOfWeekFilter;
  dayOfWeekReports: DayOfWeekReport[];
  periodStats: TimePeriodTIRStats[];
  hourlyStats: HourlyTIRStats[];
}

export function TimeInRangeDetailsCard({
  categoryMode,
  dayFilter,
  dayOfWeekReports,
  periodStats,
  hourlyStats,
}: TimeInRangeDetailsCardProps) {
  const styles = useBGOverviewStyles();
  const { t } = useTranslation('reports');
  const { idToken } = useAuth();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Mock data for testing - in real implementation this would come from props
  const mockReadingsInRange = 1234;

  // Helper function to format tooltip content for hourly TIR
  const formatHourlyTooltipContent = (
    hourLabel: string,
    stats: TIRStats
  ): string => {
    const total = stats.total;
    const lowPct = calculatePercentage(stats.low, total);
    const inRangePct = calculatePercentage(stats.inRange, total);
    const highPct = calculatePercentage(stats.high, total);
    
    if (categoryMode === 5) {
      const veryLowPct = calculatePercentage(stats.veryLow ?? 0, total);
      const veryHighPct = calculatePercentage(stats.veryHigh ?? 0, total);
      return `${hourLabel}\nVery Low: ${veryLowPct}%\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nVery High: ${veryHighPct}%\nTotal: ${total}`;
    }
    return `${hourLabel}\nLow: ${lowPct}%\nIn Range: ${inRangePct}%\nHigh: ${highPct}%\nTotal: ${total}`;
  };
  
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

      {/* Three collapsed accordion sections with actual content */}
      <Accordion collapsible>
        {/* TIR by Period Section */}
        <AccordionItem value="byPeriod">
          <AccordionHeader>
            <CalendarLtrRegular style={{ marginRight: '8px' }} />
            {t('reports.bgOverview.tirDetails.byPeriod.title')}
            {dayFilter !== 'All Days' && (
              <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                <FilterRegular style={{ marginLeft: '8px' }} aria-label="Filter indicator" />
              </Tooltip>
            )}
          </AccordionHeader>
          <AccordionPanel>
            {periodStats.length > 0 ? (
              <div className={styles.periodBarsContainer}>
                {periodStats.map((period) => {
                  const total = period.stats.total;
                  const veryLowPct = categoryMode === 5 ? calculatePercentage(period.stats.veryLow ?? 0, total) : 0;
                  const lowPct = calculatePercentage(period.stats.low, total);
                  const inRangePct = calculatePercentage(period.stats.inRange, total);
                  const highPct = calculatePercentage(period.stats.high, total);
                  const veryHighPct = categoryMode === 5 ? calculatePercentage(period.stats.veryHigh ?? 0, total) : 0;

                  return (
                    <div key={period.period} className={styles.periodBarRow}>
                      <Text className={styles.periodLabel}>{period.period}</Text>
                      <div className={styles.periodBarWrapper}>
                        <div className={styles.periodBar}>
                          {categoryMode === 5 && (period.stats.veryLow ?? 0) > 0 && (
                            <Tooltip content={`Very Low: ${veryLowPct}% (${period.stats.veryLow ?? 0})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${veryLowPct}%`,
                                  backgroundColor: getColorForCategory('veryLow'),
                                }}
                              >
                                {veryLowPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${veryLowPct}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.low > 0 && (
                            <Tooltip content={`Low: ${lowPct}% (${period.stats.low})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${lowPct}%`,
                                  backgroundColor: getColorForCategory('low'),
                                }}
                              >
                                {lowPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${lowPct}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.inRange > 0 && (
                            <Tooltip content={`In Range: ${inRangePct}% (${period.stats.inRange})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${inRangePct}%`,
                                  backgroundColor: getColorForCategory('inRange'),
                                }}
                              >
                                {inRangePct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${inRangePct}%`}
                              </div>
                            </Tooltip>
                          )}
                          {period.stats.high > 0 && (
                            <Tooltip content={`High: ${highPct}% (${period.stats.high})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${highPct}%`,
                                  backgroundColor: getColorForCategory('high'),
                                }}
                              >
                                {highPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${highPct}%`}
                              </div>
                            </Tooltip>
                          )}
                          {categoryMode === 5 && (period.stats.veryHigh ?? 0) > 0 && (
                            <Tooltip content={`Very High: ${veryHighPct}% (${period.stats.veryHigh ?? 0})`} relationship="description">
                              <div
                                className={styles.periodSegment}
                                style={{
                                  width: `${veryHighPct}%`,
                                  backgroundColor: getColorForCategory('veryHigh'),
                                }}
                              >
                                {veryHighPct >= MIN_PERCENTAGE_FOR_PERIOD_BAR && `${veryHighPct}%`}
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Text>{t('reports.bgOverview.tirDetails.byPeriod.noData')}</Text>
            )}
          </AccordionPanel>
        </AccordionItem>

        {/* TIR by Day of Week Section */}
        <AccordionItem value="byDayOfWeek">
          <AccordionHeader>
            {t('reports.bgOverview.tirDetails.byDayOfWeek.title')}
          </AccordionHeader>
          <AccordionPanel>
            {dayOfWeekReports.length > 0 ? (
              <TimeInRangeByDaySection
                categoryMode={categoryMode}
                dayOfWeekReports={dayOfWeekReports}
              />
            ) : (
              <Text>{t('reports.bgOverview.tirDetails.byDayOfWeek.noData')}</Text>
            )}
          </AccordionPanel>
        </AccordionItem>

        {/* TIR by Hour Section */}
        <AccordionItem value="byHour">
          <AccordionHeader>
            <ClockRegular style={{ marginRight: '8px' }} />
            {t('reports.bgOverview.tirDetails.byHour.title')}
            {dayFilter !== 'All Days' && (
              <Tooltip content={`Filtered by: ${dayFilter}`} relationship="description">
                <FilterRegular style={{ marginLeft: '8px' }} aria-label="Filter indicator" />
              </Tooltip>
            )}
          </AccordionHeader>
          <AccordionPanel>
            {hourlyStats.length > 0 ? (
              <div className={styles.hourlyChartContainer}>
                {/* Hourly stacked bar chart */}
                <div className={styles.hourlyChartRow}>
                  {hourlyStats.map((hourData) => {
                    const total = hourData.stats.total;
                    if (total === 0) {
                      return (
                        <Tooltip 
                          key={hourData.hour} 
                          content={`${hourData.hourLabel}: No data`} 
                          relationship="description"
                        >
                          <div className={styles.hourlyBar} style={{ backgroundColor: tokens.colorNeutralBackground3 }} />
                        </Tooltip>
                      );
                    }
                    
                    const veryLowPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryLow ?? 0, total) : 0;
                    const lowPct = calculatePercentage(hourData.stats.low, total);
                    const inRangePct = calculatePercentage(hourData.stats.inRange, total);
                    const highPct = calculatePercentage(hourData.stats.high, total);
                    const veryHighPct = categoryMode === 5 ? calculatePercentage(hourData.stats.veryHigh ?? 0, total) : 0;
                    
                    const tooltipContent = formatHourlyTooltipContent(hourData.hourLabel, hourData.stats);
                    
                    return (
                      <Tooltip key={hourData.hour} content={tooltipContent} relationship="description">
                        <div className={styles.hourlyBar}>
                          {/* Render order: veryHigh (top) → high → inRange → low → veryLow (bottom) */}
                          {categoryMode === 5 && veryHighPct > 0 && (
                            <div
                              className={styles.hourlySegment}
                              style={{
                                height: `${veryHighPct}%`,
                                backgroundColor: getColorForCategory('veryHigh'),
                              }}
                            />
                          )}
                          {highPct > 0 && (
                            <div
                              className={styles.hourlySegment}
                              style={{
                                height: `${highPct}%`,
                                backgroundColor: getColorForCategory('high'),
                              }}
                            />
                          )}
                          {inRangePct > 0 && (
                            <div
                              className={styles.hourlySegment}
                              style={{
                                height: `${inRangePct}%`,
                                backgroundColor: getColorForCategory('inRange'),
                              }}
                            />
                          )}
                          {lowPct > 0 && (
                            <div
                              className={styles.hourlySegment}
                              style={{
                                height: `${lowPct}%`,
                                backgroundColor: getColorForCategory('low'),
                              }}
                            />
                          )}
                          {categoryMode === 5 && veryLowPct > 0 && (
                            <div
                              className={styles.hourlySegment}
                              style={{
                                height: `${veryLowPct}%`,
                                backgroundColor: getColorForCategory('veryLow'),
                              }}
                            />
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                {/* Hour labels */}
                <div className={styles.hourlyLabels}>
                  {hourlyStats.map((hourData) => (
                    <Text key={hourData.hour} className={styles.hourlyLabel}>
                      {hourData.hour.toString().padStart(2, '0')}
                    </Text>
                  ))}
                </div>
                <Text className={styles.chartDescription}>
                  Visualize hourly glucose patterns to identify trends and optimize management strategies.
                </Text>
              </div>
            ) : (
              <Text>{t('reports.bgOverview.tirDetails.byHour.noData')}</Text>
            )}
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
