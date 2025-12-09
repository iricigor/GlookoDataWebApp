/**
 * Styles for BG Overview Report components
 */

import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';

/**
 * Shared base card style for all section cards in BG Overview.
 * This object is spread into individual card styles to ensure consistency.
 * Exported for use in other component files that need matching card styling.
 */
export const cardBaseStyle = {
  ...shorthands.padding('24px'),
  ...shorthands.borderRadius('14px'),
  ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  backgroundColor: tokens.colorNeutralBackground2,
  boxShadow: tokens.shadow4,
  display: 'flex',
  flexDirection: 'column' as const,
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
};

export const useBGOverviewStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  stickyControlBarWrapper: {
    position: 'sticky',
    top: '0',
    zIndex: 100,
    marginLeft: '-24px',
    marginRight: '-24px',
    ...shorthands.padding('0', '24px'),
    paddingTop: '12px',
    paddingBottom: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    '@media (max-width: 767px)': {
      marginLeft: '-16px',
      marginRight: '-16px',
      ...shorthands.padding('0', '16px'),
      paddingTop: '8px',
      paddingBottom: '8px',
    },
  },
  controlBar: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('20px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow4,
    // Reduce padding and gap on mobile to save vertical space
    '@media (max-width: 767px)': {
      ...shorthands.padding('12px'),
      ...shorthands.gap('8px'),
    },
  },
  controlGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    ...shorthands.gap('16px'),
    // On wider screens, show first two filters in first row, last two in second row
    '@media (min-width: 768px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    // Reduce gap between filter rows on mobile
    '@media (max-width: 767px)': {
      ...shorthands.gap('6px'),
    },
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    flexWrap: 'wrap',
    // On mobile, keep label and controls on same row (no wrapping) and ensure full width
    '@media (max-width: 767px)': {
      flexWrap: 'nowrap',
      ...shorthands.gap('8px'),
      width: '100%',
    },
  },
  controlLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '120px',
    // Reduce label width on mobile to allow more space for controls
    '@media (max-width: 767px)': {
      minWidth: '70px',
      flexShrink: 0,
      fontSize: tokens.fontSizeBase200,
    },
  },
  pillGroup: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
    // On mobile, expand to fill available space
    '@media (max-width: 767px)': {
      flex: 1,
      ...shorthands.gap('6px'),
    },
  },
  pillButton: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    minWidth: '100px',
    // On mobile, extend buttons to use available space
    '@media (max-width: 767px)': {
      flex: 1,
      minWidth: 'auto',
      fontSize: tokens.fontSizeBase200,
      ...shorthands.padding('4px', '8px'),
    },
  },
  datePickerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
    // On mobile, expand to fill available space and align right margin
    '@media (max-width: 767px)': {
      flex: 1,
      ...shorthands.gap('6px'),
    },
  },
  dropdownControl: {
    // On mobile, expand to fill available space and align right margin
    '@media (max-width: 767px)': {
      flex: 1,
      minWidth: 'auto',
    },
  },
  tirCard: {
    ...cardBaseStyle,
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  cardIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  tirBarContainer: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  tirBar: {
    display: 'flex',
    height: '48px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow2,
  },
  tirSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.85,
      transform: 'scale(1.02)',
    },
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    ...shorthands.gap('8px'),
    marginTop: '4px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginRight: '4px',
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  targetInfoContainer: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorBrandBackground2,
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  targetInfo: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    position: 'relative',
  },
  targetInfoText: {
    flex: 1,
    textAlign: 'center',
  },
  aiAnalysisContainer: {
    display: 'flex',
    flexDirection: 'row',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
  aiAnalysisButton: {
    minWidth: '140px',
  },
  aiResponseArea: {
    width: '100%',
    ...shorthands.padding('0'),
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  aiResponseHeader: {
    display: 'none',
  },
  aiResponseContent: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: '1.5',
    color: tokens.colorNeutralForeground2,
    marginTop: '8px',
  },
  collapseIcon: {
    fontSize: '16px',
    transition: 'transform 0.2s ease',
  },
  collapseIconExpanded: {
    transform: 'rotate(180deg)',
  },
  analyzingSpinner: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  aiAccordion: {
    marginTop: '8px',
  },
  promptTextContainer: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'monospace',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  hba1cCard: {
    ...cardBaseStyle,
  },
  hba1cMainRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    marginTop: '8px',
  },
  hba1cValueSection: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('8px'),
  },
  hba1cValue: {
    fontSize: '36px',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    lineHeight: '1',
  },
  hba1cUnit: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  hba1cMmolMol: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  hba1cDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  hba1cDetailItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  hba1cDetailLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  hba1cDetailValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  hba1cWarning: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorStatusWarningBackground1,
    marginTop: '8px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorStatusWarningForeground1,
  },
  hba1cWarningIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  riskCard: {
    ...cardBaseStyle,
  },
  riskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap('16px'),
    marginTop: '12px',
  },
  riskItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  riskLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  riskValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1.2',
  },
  riskInterpretation: {
    fontSize: tokens.fontSizeBase100,
    marginTop: '4px',
    ...shorthands.padding('2px', '6px'),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    display: 'inline-block',
    width: 'fit-content',
  },
  riskLow: {
    color: tokens.colorStatusSuccessForeground1,
    backgroundColor: tokens.colorStatusSuccessBackground1,
  },
  riskModerate: {
    color: tokens.colorStatusWarningForeground1,
    backgroundColor: tokens.colorStatusWarningBackground1,
  },
  riskHigh: {
    color: tokens.colorStatusDangerForeground1,
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  riskDescription: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    marginTop: '12px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  baseCard: {
    ...cardBaseStyle,
  },
  sectionCard: {
    ...cardBaseStyle,
  },
  agpCard: {
    ...cardBaseStyle,
  },
  accordion: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '0'),
  },
  linkButton: {
    justifyContent: 'flex-start',
  },
  loading: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center',
    ...shorthands.padding('24px'),
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center',
    ...shorthands.padding('24px'),
  },
  noData: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontStyle: 'italic',
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
  agpTableDescription: {
    ...shorthands.padding('8px', '0'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inRangeCell: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  inRangeHeader: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  highlightedHeaderCell: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  highlightedCell: {
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  timeCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'monospace',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  valueCell: {
    textAlign: 'center',
    fontFamily: 'monospace',
    verticalAlign: 'middle',
  },
  countCell: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    verticalAlign: 'middle',
  },
  tableSection: {
    marginTop: '16px',
  },
  periodBarsContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '8px',
  },
  periodBarRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  periodLabel: {
    minWidth: '70px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  periodBarWrapper: {
    flex: 1,
  },
  periodBar: {
    display: 'flex',
    height: '32px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  periodSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.85,
    },
  },
  hourlyChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    marginTop: '8px',
  },
  hourlyChartRow: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap('2px'),
  },
  hourlyBar: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: '20px',
    maxWidth: '60px',
    height: '180px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall, tokens.borderRadiusSmall, '0', '0'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '&:hover': {
      opacity: 0.9,
      transform: 'scaleY(1.02)',
    },
    // On mobile, ensure all 24 bars fit by removing max-width
    '@media (max-width: 767px)': {
      maxWidth: 'none',
      minWidth: '0',
    },
  },
  hourlySegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    minHeight: '0',
  },
  hourlyLabels: {
    display: 'flex',
    ...shorthands.gap('2px'),
  },
  hourlyLabel: {
    flex: 1,
    minWidth: '20px',
    maxWidth: '60px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    paddingTop: '4px',
    // On mobile, ensure all 24 labels fit by removing max-width
    '@media (max-width: 767px)': {
      maxWidth: 'none',
      minWidth: '0',
      fontSize: tokens.fontSizeBase100,
    },
  },
  chartDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    paddingTop: '8px',
  },
  filterIcon: {
    color: tokens.colorBrandForeground1,
    marginLeft: '8px',
    fontSize: '16px',
  },
  accordionHeaderContent: {
    display: 'flex',
    alignItems: 'center',
  },
  desktopOnly: {
    display: 'inline',
    '@media (max-width: 767px)': {
      display: 'none',
    },
  },
  mobileOnly: {
    display: 'none',
    '@media (max-width: 767px)': {
      display: 'inline',
    },
  },
});
