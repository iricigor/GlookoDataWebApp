/**
 * Time in Range Details Card Component
 * Displays detailed TIR breakdown with accordion sections for period, day of week, and hour analysis
 */

import { 
  Text,
  Card,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { 
  DataTrendingRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useBGOverviewStyles } from './styles';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TimeInRangeDetailsCardProps {
  // Props will be added when implementing actual content
}

// eslint-disable-next-line no-empty-pattern
export function TimeInRangeDetailsCard({}: TimeInRangeDetailsCardProps) {
  const styles = useBGOverviewStyles();
  const { t } = useTranslation('reports');

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

      {/* Disabled Analyze with AI button */}
      <div className={styles.targetInfoContainer}>
        <div className={styles.targetInfo}>
          <Button
            appearance="primary"
            disabled={true}
            className={styles.aiAnalysisButton}
          >
            {t('reports.bgOverview.tirDetails.analyzeButton')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
