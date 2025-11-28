/**
 * AI Analysis Page
 * Get intelligent insights and recommendations using advanced AI algorithms
 */

import { useState, useEffect } from 'react';
import { 
  Text,
  Link,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { BrainCircuitRegular } from '@fluentui/react-icons';
import type { DailyReport, GlucoseRangeStats } from '../../types';
import { extractGlucoseReadings, extractDailyInsulinSummaries, extractInsulinReadings } from '../../utils/data';
import { calculateGlucoseRangeStats, calculatePercentage, groupByDate } from '../../utils/data';
import { useGlucoseThresholds } from '../../hooks/useGlucoseThresholds';
import { getActiveProvider } from '../../utils/api';
import { useAIAnalysisStyles } from './styles';
import type { AIAnalysisProps, MealTimingDatasets } from './types';
import {
  FileInfoTab,
  TimeInRangeTab,
  GlucoseInsulinTab,
  MealTimingTab,
  PumpSettingsTab,
  HyposTab,
} from './tabs';

export function AIAnalysis({ 
  selectedFile, 
  perplexityApiKey, 
  geminiApiKey, 
  grokApiKey, 
  deepseekApiKey, 
  selectedProvider,
  responseLanguage,
  glucoseUnit,
  existingAnalysis, 
  onAnalysisComplete 
}: AIAnalysisProps) {
  const styles = useAIAnalysisStyles();
  const { thresholds } = useGlucoseThresholds();
  const [selectedTab, setSelectedTab] = useState<string>('fileInfo');
  
  const [inRangePercentage, setInRangePercentage] = useState<number | null>(null);
  const [glucoseStats, setGlucoseStats] = useState<GlucoseRangeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [combinedDataset, setCombinedDataset] = useState<DailyReport[]>([]);
  const [mealTimingDatasets, setMealTimingDatasets] = useState<MealTimingDatasets>({
    cgmReadings: [],
    bolusReadings: [],
    basalReadings: [],
  });

  // Determine which AI provider to use (respecting manual selection)
  const activeProvider = getActiveProvider(selectedProvider, perplexityApiKey, geminiApiKey, grokApiKey, deepseekApiKey);
  const hasApiKey = activeProvider !== null;

  // Load existing analysis when component mounts or file changes
  useEffect(() => {
    if (existingAnalysis && selectedFile?.id === existingAnalysis.fileId) {
      setInRangePercentage(existingAnalysis.inRangePercentage);
    }
  }, [existingAnalysis, selectedFile?.id]);

  // Calculate in-range percentage and combined dataset when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setInRangePercentage(null);
      setGlucoseStats(null);
      setCombinedDataset([]);
      setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
      return;
    }

    // If we have existing analysis for this file, don't recalculate
    if (existingAnalysis && selectedFile.id === existingAnalysis.fileId) {
      return;
    }

    const calculateInRange = async () => {
      setLoading(true);
      try {
        // Extract CGM readings (default data source)
        const readings = await extractGlucoseReadings(selectedFile, 'cgm');
        
        if (readings.length > 0) {
          // Calculate stats using 3-category mode (default)
          const stats = calculateGlucoseRangeStats(readings, thresholds, 3);
          const percentage = calculatePercentage(stats.inRange, stats.total);
          setInRangePercentage(percentage);
          setGlucoseStats(stats);

          // Generate combined dataset for second prompt
          const dailyGlucoseReports = groupByDate(readings, thresholds, 3);
          
          // Extract and aggregate insulin data
          try {
            const insulinData = await extractDailyInsulinSummaries(selectedFile);
            
            // Merge insulin data with daily glucose reports
            const mergedData = dailyGlucoseReports.map(report => {
              const insulinForDate = insulinData.find(ins => ins.date === report.date);
              return {
                ...report,
                basalInsulin: insulinForDate?.basalTotal,
                bolusInsulin: insulinForDate?.bolusTotal,
                totalInsulin: insulinForDate?.totalInsulin,
              };
            });
            setCombinedDataset(mergedData);
          } catch (insulinErr) {
            // If insulin extraction fails, just use glucose reports without insulin data
            console.warn('Failed to extract insulin data:', insulinErr);
            setCombinedDataset(dailyGlucoseReports);
          }

          // Extract detailed insulin readings for meal timing analysis
          try {
            const insulinReadings = await extractInsulinReadings(selectedFile);
            const bolusReadings = insulinReadings.filter(r => r.insulinType === 'bolus');
            const basalReadings = insulinReadings.filter(r => r.insulinType === 'basal');
            setMealTimingDatasets({
              cgmReadings: readings,
              bolusReadings,
              basalReadings,
            });
          } catch (mealTimingErr) {
            console.warn('Failed to extract meal timing data:', mealTimingErr);
            setMealTimingDatasets({ cgmReadings: readings, bolusReadings: [], basalReadings: [] });
          }
        } else {
          setInRangePercentage(null);
          setGlucoseStats(null);
          setCombinedDataset([]);
          setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
        }
      } catch (error) {
        console.error('Failed to calculate in-range percentage:', error);
        setInRangePercentage(null);
        setGlucoseStats(null);
        setCombinedDataset([]);
        setMealTimingDatasets({ cgmReadings: [], bolusReadings: [], basalReadings: [] });
      } finally {
        setLoading(false);
      }
    };

    calculateInRange();
  }, [selectedFile, thresholds, existingAnalysis]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'fileInfo':
        return <FileInfoTab selectedFile={selectedFile} />;
      
      case 'timeInRange':
        return (
          <TimeInRangeTab
            loading={loading}
            hasApiKey={hasApiKey}
            activeProvider={activeProvider}
            inRangePercentage={inRangePercentage}
            glucoseStats={glucoseStats}
            responseLanguage={responseLanguage}
            glucoseUnit={glucoseUnit}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
            selectedFile={selectedFile}
            onAnalysisComplete={onAnalysisComplete}
            existingAnalysis={existingAnalysis}
          />
        );
      
      case 'glucoseInsulin':
        return (
          <GlucoseInsulinTab
            loading={loading}
            hasApiKey={hasApiKey}
            activeProvider={activeProvider}
            combinedDataset={combinedDataset}
            responseLanguage={responseLanguage}
            glucoseUnit={glucoseUnit}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
          />
        );
      
      case 'mealTiming':
        return (
          <MealTimingTab
            loading={loading}
            hasApiKey={hasApiKey}
            activeProvider={activeProvider}
            mealTimingDatasets={mealTimingDatasets}
            responseLanguage={responseLanguage}
            glucoseUnit={glucoseUnit}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
          />
        );
      
      case 'pumpSettings':
        return (
          <PumpSettingsTab
            loading={loading}
            hasApiKey={hasApiKey}
            activeProvider={activeProvider}
            mealTimingDatasets={mealTimingDatasets}
            responseLanguage={responseLanguage}
            glucoseUnit={glucoseUnit}
            perplexityApiKey={perplexityApiKey}
            geminiApiKey={geminiApiKey}
            grokApiKey={grokApiKey}
            deepseekApiKey={deepseekApiKey}
          />
        );
      
      case 'hypos':
        return <HyposTab />;
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>AI Analysis</Text>
        <Text className={styles.description}>
          Get intelligent insights and recommendations using advanced AI algorithms
        </Text>
      </div>

      {!selectedFile ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.icon}>
            <BrainCircuitRegular />
          </div>
          <Text className={styles.placeholderText}>
            Please select a data file from the Data Upload page to begin AI analysis
          </Text>
        </div>
      ) : !hasApiKey ? (
        <div className={styles.placeholderContainer}>
          <div className={styles.icon}>
            <BrainCircuitRegular />
          </div>
          <Text className={styles.placeholderText}>
            To use AI-powered analysis, you need to configure an API key (Perplexity or Google Gemini).
          </Text>
          <Text className={styles.warningText}>
            Please add your API key in the{' '}
            <Link href="#settings">Settings page</Link>.
          </Text>
        </div>
      ) : (
        <>
          {/* Horizontal TabList for desktop */}
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
            className={styles.tabListHorizontal}
            appearance="subtle"
            size="large"
          >
            <Tab value="fileInfo">File Info</Tab>
            <Tab value="timeInRange">Time in Range</Tab>
            <Tab value="glucoseInsulin">Glucose & Insulin</Tab>
            <Tab value="mealTiming">Meal Timing</Tab>
            <Tab value="pumpSettings">Pump Settings</Tab>
            <Tab value="hypos">Hypos</Tab>
          </TabList>

          <div className={styles.contentWrapper}>
            {/* Vertical TabList for mobile */}
            <TabList
              vertical
              selectedValue={selectedTab}
              onTabSelect={(_, data) => setSelectedTab(data.value as string)}
              className={styles.tabListVertical}
              appearance="subtle"
            >
              <Tab value="fileInfo">File Info</Tab>
              <Tab value="timeInRange">Time in Range</Tab>
              <Tab value="glucoseInsulin">Glucose & Insulin</Tab>
              <Tab value="mealTiming">Meal Timing</Tab>
              <Tab value="pumpSettings">Pump Settings</Tab>
              <Tab value="hypos">Hypos</Tab>
            </TabList>

            <div className={styles.contentArea}>
              {renderTabContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
