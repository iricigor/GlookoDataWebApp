/**
 * InsulinDayNavigator component
 * Navigation bar for browsing through different days
 */

import {
  makeStyles,
  Text,
  Button,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  navigationBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  navigationButtons: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  dateDisplay: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
});

interface InsulinDayNavigatorProps {
  currentDate: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function InsulinDayNavigator({
  currentDate,
  onPreviousDay,
  onNextDay,
  canGoPrevious,
  canGoNext,
}: InsulinDayNavigatorProps) {
  const styles = useStyles();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.navigationBar}>
      <div className={styles.navigationButtons}>
        <Button
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          onClick={onPreviousDay}
          disabled={!canGoPrevious}
        >
          Previous Day
        </Button>
      </div>
      
      <Text className={styles.dateDisplay}>
        {formatDate(currentDate)}
      </Text>
      
      <div className={styles.navigationButtons}>
        <Button
          appearance="subtle"
          icon={<ChevronRightRegular />}
          iconPosition="after"
          onClick={onNextDay}
          disabled={!canGoNext}
        >
          Next Day
        </Button>
      </div>
    </div>
  );
}
