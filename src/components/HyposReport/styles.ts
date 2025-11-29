/**
 * Styles for HyposReport components
 */

import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';

export const useHyposStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  reportTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  reportSubtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    ...shorthands.gap('12px'),
  },
  summaryCard: {
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  summaryCardSuccess: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
  },
  summaryCardWarning: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteMarigoldBorder1),
  },
  summaryCardDanger: {
    ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1),
  },
  summaryIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  summaryIconSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  summaryIconWarning: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  summaryIconDanger: {
    color: tokens.colorPaletteRedForeground1,
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: '4px',
  },
  summaryValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    ...shorthands.gap('4px'),
  },
  summaryValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground1,
  },
  summaryValueSuccess: {
    color: tokens.colorPaletteGreenForeground1,
  },
  summaryValueSmiley: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: tokens.fontSizeBase500,
  },
  summaryUnit: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  chartCard: {
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
  },
  chartContainer: {
    width: '100%',
    height: '400px',
    marginTop: '16px',
  },
  chartContainerMobile: {
    ...shorthands.padding('4px', '0px'),
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  maxValueContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  noDataMessage: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase400,
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
  legendDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
  },
  legendDashedLine: {
    width: '20px',
    height: '0',
    borderTop: `2px dashed ${tokens.colorNeutralStroke1}`,
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
});
