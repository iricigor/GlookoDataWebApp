/**
 * DayNavigator component
 * Reusable navigation bar for browsing through different days
 * 
 * Uses RSuite DatePicker wrapped with Fluent UI-styled navigation buttons.
 * 
 * Alternative date picker components for future exploration:
 * 1. @fluentui/react-datepicker-compat - Fluent UI's DatePicker from v8, compatible with v9
 *    https://react.fluentui.dev/?path=/docs/compat-components-datepicker--docs
 * 2. react-day-picker - A flexible date picker component for React
 *    https://react-day-picker.js.org/
 */

import {
  makeStyles,
  Button,
  Spinner,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { DatePicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

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
  navButton: {
    backgroundColor: tokens.colorNeutralBackground3,
    boxShadow: tokens.shadow4,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ':disabled': {
      backgroundColor: tokens.colorNeutralBackgroundDisabled,
      color: tokens.colorNeutralForegroundDisabled,
      boxShadow: 'none',
    },
  },
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  datePickerContainer: {
    // Override RSuite DatePicker styles to follow Fluent UI theme
    '& .rs-picker-toggle': {
      borderRadius: tokens.borderRadiusMedium,
      minWidth: '220px',
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
      backgroundColor: tokens.colorNeutralBackground1,
      borderTopColor: tokens.colorNeutralStroke1,
      borderRightColor: tokens.colorNeutralStroke1,
      borderBottomColor: tokens.colorNeutralStroke1,
      borderLeftColor: tokens.colorNeutralStroke1,
      boxShadow: tokens.shadow4,
      ':hover': {
        borderTopColor: tokens.colorNeutralStroke1Hover,
        borderRightColor: tokens.colorNeutralStroke1Hover,
        borderBottomColor: tokens.colorNeutralStroke1Hover,
        borderLeftColor: tokens.colorNeutralStroke1Hover,
        backgroundColor: tokens.colorNeutralBackground1Hover,
      },
    },
    '& .rs-picker-toggle-value': {
      color: tokens.colorNeutralForeground1,
    },
    // Style the calendar icon
    '& .rs-picker-toggle-caret': {
      color: tokens.colorNeutralForeground2,
    },
  },
});

interface DayNavigatorProps {
  currentDate: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  loading?: boolean;
  onDateSelect?: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DayNavigator({
  currentDate,
  onPreviousDay,
  onNextDay,
  canGoPrevious,
  canGoNext,
  loading = false,
  onDateSelect,
  minDate,
  maxDate,
}: DayNavigatorProps) {
  const styles = useStyles();

  // Convert string dates to Date objects for RSuite DatePicker
  const currentDateObj = new Date(currentDate + 'T00:00:00');
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : undefined;
  const maxDateObj = maxDate ? new Date(maxDate + 'T00:00:00') : undefined;

  // Handle date change from RSuite DatePicker
  const handleDateChange = (value: Date | null) => {
    if (value && onDateSelect) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      onDateSelect(`${year}-${month}-${day}`);
    }
  };

  // Format date for display (weekday, month day, year)
  const formatDisplayDate = (date: Date) => {
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
          className={styles.navButton}
          icon={<ChevronLeftRegular />}
          onClick={onPreviousDay}
          disabled={!canGoPrevious || loading}
        >
          Previous Day
        </Button>
      </div>
      
      <div className={styles.dateDisplay}>
        {loading && <Spinner size="tiny" />}
        {onDateSelect && minDate && maxDate ? (
          <div className={styles.datePickerContainer}>
            <DatePicker
              value={currentDateObj}
              onChange={handleDateChange}
              oneTap
              format="EEEE, MMMM d, yyyy"
              shouldDisableDate={(date) => {
                if (!date) return false;
                if (minDateObj && date < minDateObj) return true;
                if (maxDateObj && date > maxDateObj) return true;
                return false;
              }}
              cleanable={false}
              placement="bottom"
              renderValue={(value) => {
                return value ? formatDisplayDate(value) : '';
              }}
            />
          </div>
        ) : null}
      </div>
      
      <div className={styles.navigationButtons}>
        <Button
          appearance="subtle"
          className={styles.navButton}
          icon={<ChevronRightRegular />}
          iconPosition="after"
          onClick={onNextDay}
          disabled={!canGoNext || loading}
        >
          Next Day
        </Button>
      </div>
    </div>
  );
}
