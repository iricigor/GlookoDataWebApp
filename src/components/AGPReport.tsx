/**
 * AGP (Ambulatory Glucose Profile) Report component
 * Displays glucose statistics for each 5-minute period throughout the day
 */

import { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import type { UploadedFile, GlucoseDataSource, AGPTimeSlotStats } from '../types';
import { extractGlucoseReadings } from '../utils/glucoseDataUtils';
import { calculateAGPStats } from '../utils/agpUtils';

const useStyles = makeStyles({
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  controlLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '140px',
  },
  buttonGroup: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  tableContainer: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    maxHeight: '600px',
    overflowY: 'auto',
  },
  noData: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
  loading: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  timeCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'monospace',
  },
  valueCell: {
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  countCell: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  info: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('12px', '0'),
  },
});

interface AGPReportProps {
  selectedFile?: UploadedFile;
}

export function AGPReport({ selectedFile }: AGPReportProps) {
  const styles = useStyles();

  const [dataSource, setDataSource] = useState<GlucoseDataSource>('cgm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agpStats, setAgpStats] = useState<AGPTimeSlotStats[]>([]);

  useEffect(() => {
    if (!selectedFile) {
      setAgpStats([]);
      setError(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const glucoseReadings = await extractGlucoseReadings(selectedFile, dataSource);
        
        if (glucoseReadings.length === 0) {
          setError(`No ${dataSource.toUpperCase()} data found in the selected file`);
          setAgpStats([]);
        } else {
          const stats = calculateAGPStats(glucoseReadings);
          setAgpStats(stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glucose data');
        setAgpStats([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFile, dataSource]);

  const formatValue = (value: number): string => {
    if (value === 0) return '-';
    return value.toFixed(1);
  };

  // Filter out time slots with no data
  const statsWithData = agpStats.filter(stat => stat.count > 0);

  if (!selectedFile) {
    return (
      <div className={styles.reportContainer}>
        <Accordion collapsible>
          <AccordionItem value="agp">
            <AccordionHeader>
              <Text className={styles.reportTitle}>AGP Data</Text>
            </AccordionHeader>
            <AccordionPanel>
              <Text className={styles.noData}>
                No data package selected. Please select a valid ZIP file from the Data Upload page.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return (
    <div className={styles.reportContainer}>
      <Accordion collapsible>
        <AccordionItem value="agp">
          <AccordionHeader>
            <Text className={styles.reportTitle}>AGP Data</Text>
          </AccordionHeader>
          <AccordionPanel>
            {loading && <Text className={styles.loading}>Loading glucose data...</Text>}
            {error && <Text className={styles.error}>{error}</Text>}

            <div className={styles.container}>
              {/* Controls */}
              <div className={styles.controls}>
                <div className={styles.controlRow}>
                  <Text className={styles.controlLabel}>Data Source:</Text>
                  <div className={styles.buttonGroup}>
                    <Button
                      appearance={dataSource === 'cgm' ? 'primary' : 'secondary'}
                      onClick={() => setDataSource('cgm')}
                    >
                      CGM
                    </Button>
                    <Button
                      appearance={dataSource === 'bg' ? 'primary' : 'secondary'}
                      onClick={() => setDataSource('bg')}
                    >
                      BG
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info text */}
              {!loading && !error && statsWithData.length > 0 && (
                <Text className={styles.info}>
                  Showing statistics for {statsWithData.length} time periods with data. 
                  All values are in mmol/L. Percentiles are calculated across all days for each 5-minute time slot.
                </Text>
              )}

              {/* AGP Table */}
              {!loading && !error && statsWithData.length > 0 && (
                <div className={styles.tableContainer}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Time</TableHeaderCell>
                        <TableHeaderCell>Lowest</TableHeaderCell>
                        <TableHeaderCell>10%</TableHeaderCell>
                        <TableHeaderCell>25%</TableHeaderCell>
                        <TableHeaderCell>50% (Median)</TableHeaderCell>
                        <TableHeaderCell>75%</TableHeaderCell>
                        <TableHeaderCell>90%</TableHeaderCell>
                        <TableHeaderCell>Highest</TableHeaderCell>
                        <TableHeaderCell>Count</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsWithData.map((stat) => (
                        <TableRow key={stat.timeSlot}>
                          <TableCell className={styles.timeCell}>{stat.timeSlot}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.lowest)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p10)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p25)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p50)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p75)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.p90)}</TableCell>
                          <TableCell className={styles.valueCell}>{formatValue(stat.highest)}</TableCell>
                          <TableCell className={styles.countCell}>{stat.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && !error && statsWithData.length === 0 && (
                <Text className={styles.noData}>
                  No glucose data available for the selected data source.
                </Text>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
