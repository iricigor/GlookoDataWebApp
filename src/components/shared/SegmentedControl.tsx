/**
 * SegmentedControl Component
 * A reusable segmented control component for toggling between multiple options.
 * Uses Fluent UI Button components to achieve a segmented selector look.
 */

import { Button } from '@fluentui/react-components';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

interface SegmentedControlProps<T extends string | number> {
  /** Array of options to display */
  options: T[];
  /** Currently selected option */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Optional CSS class name */
  className?: string;
}

const useStyles = makeStyles({
  container: {
    display: 'inline-flex',
    ...shorthands.gap('0'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.overflow('hidden'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  button: {
    ...shorthands.borderRadius('0'),
    ...shorthands.border('none'),
    minWidth: '60px',
    height: '32px',
    ...shorthands.padding('0', '16px'),
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    
    // Remove left border for all buttons except first
    '&:not(:first-child)': {
      borderLeftWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftColor: tokens.colorNeutralStroke1,
    },
    
    // Hover effect for non-selected buttons
    '&:hover:not([data-selected="true"])': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selectedButton: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
});

/**
 * SegmentedControl - A reusable component for selecting between multiple mutually exclusive options
 * 
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={['100%', '24h']}
 *   value={selectedUnit}
 *   onChange={setSelectedUnit}
 *   ariaLabel="Time unit selector"
 * />
 * ```
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const styles = useStyles();

  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = option === value;
        return (
          <Button
            key={String(option)}
            appearance={isSelected ? 'primary' : 'subtle'}
            className={`${styles.button} ${isSelected ? styles.selectedButton : ''}`}
            onClick={() => onChange(option)}
            data-selected={isSelected}
            aria-pressed={isSelected}
          >
            {String(option)}
          </Button>
        );
      })}
    </div>
  );
}
