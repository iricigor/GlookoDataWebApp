/**
 * Styles for the DailyBGReport component
 */

import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  stickyDatePickerWrapper: {
    position: 'sticky',
    top: '0',
    zIndex: 100,
    marginLeft: '-24px',
    marginRight: '-24px',
    ...shorthands.padding('12px', '24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    '@media (max-width: 767px)': {
      marginLeft: '-16px',
      marginRight: '-16px',
      ...shorthands.padding('8px', '16px'),
    },
  },
  // Section container that wraps title + stats + graph
  sectionCard: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '@media (hover: hover)': {
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadow16,
      },
    },
    '@media (max-width: 767px)': {
      ...shorthands.padding('16px'),
      ...shorthands.borderRadius('12px'),
    },
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '0',
    marginTop: '0',
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
  },
  summarySubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginTop: '4px',
  },
  // Inner container for chart content (used within sectionCard)
  chartCardInnerContent: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  chartContainer: {
    width: '100%',
    height: '400px',
    marginTop: '16px',
  },
  chartWithBarContainer: {
    display: 'flex',
    ...shorthands.gap('16px'),
    marginTop: '16px',
    '@media (max-width: 767px)': {
      ...shorthands.gap('8px'),
    },
  },
  chartWrapper: {
    flex: 1,
    height: '400px',
    '@media (max-width: 767px)': {
      height: '350px',
    },
  },
  summaryBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '60px',
    height: '400px',
    ...shorthands.gap('4px'),
    '@media (max-width: 767px)': {
      width: '40px',
      height: '350px',
    },
  },
  summaryBarSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.8,
    },
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    '@media (max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      ...shorthands.gap('12px'),
    },
  },
  maxValueContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    '@media (max-width: 767px)': {
      justifyContent: 'center',
    },
  },
  colorSchemeContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    '@media (max-width: 767px)': {
      width: '100%',
      ...shorthands.gap('8px'),
    },
  },
  colorSchemeDropdown: {
    minWidth: '200px',
    '@media (max-width: 767px)': {
      minWidth: 'auto',
      flex: 1,
    },
  },
  colorSchemeLabel: {
    fontSize: tokens.fontSizeBase300,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  colorSchemeLabelLong: {
    '@media (max-width: 767px)': {
      display: 'none',
    },
  },
  colorSchemeLabelShort: {
    display: 'none',
    '@media (max-width: 767px)': {
      display: 'inline',
    },
  },
  statValueBelow: {
    color: tokens.colorPaletteRedForeground1,
  },
  statValueInRange: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statValueAbove: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  noDataMessage: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase400,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('48px'),
  },
  iobChartContainer: {
    height: '300px',
    width: '100%',
    '@media (max-width: 767px)': {
      height: '250px',
    },
  },
  // Stats cards with icons (RoC and Hypo style)
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
    '@media (max-width: 600px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 400px)': {
      gridTemplateColumns: '1fr',
    },
  },
  statCard: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('12px'),
    boxShadow: tokens.shadow4,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  statCardSuccess: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
  },
  statCardWarning: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteMarigoldBorder1),
  },
  statCardDanger: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
  },
  statIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  statIconSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  statIconWarning: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  statIconDanger: {
    color: tokens.colorPaletteRedForeground1,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'monospace',
  },
  statUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  // RoC Summary Bar - now inside sectionCard, so simplified styling
  rocSummaryCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  rocSummaryTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  rocSummaryBar: {
    display: 'flex',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '16px',
  },
  rocSummarySegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase300,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeightSemibold,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.85,
    },
  },
  rocStandardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  rocStandardRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  rocStandardDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
  },
  rocStandardLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    minWidth: '70px',
  },
  rocStandardThreshold: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
  rocStandardDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    flex: 1,
  },
  rocChartContainer: {
    height: '300px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  hyposChartContainer: {
    height: '300px',
    width: '100%',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginTop: '8px',
    fontSize: tokens.fontSizeBase200,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendLine: {
    width: '20px',
    height: '3px',
    ...shorthands.borderRadius('2px'),
  },
  legendDashedLine: {
    width: '20px',
    height: '0',
    borderTop: `2px dashed ${tokens.colorNeutralStroke1}`,
  },
  legendDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
  },
  // RoC controls row
  rocControlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: '8px',
    ...shorthands.gap('16px'),
    flexWrap: 'wrap',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    minWidth: '180px',
  },
  sliderLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  sliderValue: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '40px',
  },
  rocChartCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('12px'),
  },
  hyposChartCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('12px'),
  },
  chartCardInner: {
    height: '300px',
    width: '100%',
  },
});
