/**
 * Styles for the Settings page and components
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
    ...shorthands.padding('40px', '24px'),
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  description: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'Segoe UI, sans-serif',
    display: 'block',
  },
  contentWrapper: {
    display: 'flex',
    ...shorthands.gap('24px'),
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  tabList: {
    flexShrink: 0,
    width: '200px',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  contentArea: {
    flex: 1,
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  settingSection: {
    marginBottom: '24px',
    '&:last-child': {
      marginBottom: '0',
    },
  },
  sectionTitle: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero700,
    marginBottom: '8px',
  },
  divider: {
    marginTop: '8px',
    marginBottom: '16px',
  },
  settingLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
    display: 'block',
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '12px',
    display: 'block',
  },
  insulinDurationRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  insulinDurationInput: {
    width: '100px',
  },
  apiKeyContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginTop: '24px',
    marginBottom: '16px',
  },
  apiKeyRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  apiKeyLabel: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '120px',
    flexShrink: 0,
    textAlign: 'left',
  },
  apiKeyInputGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    height: '32px',
  },
  apiKeyInput: {
    flex: 1,
    '& .fui-Input': {
      ...shorthands.border('0', 'none'),
      ...shorthands.borderRadius('0'),
    },
    '& input': {
      ...shorthands.border('0', 'none'),
    },
  },
  apiKeyInputBorderless: {
    flex: 1,
    '& .fui-Input__root': {
      ...shorthands.border('0', 'none'),
      backgroundColor: 'transparent',
      height: '100%',
    },
    '& input': {
      height: '100%',
    },
  },
  statusButton: {
    ...shorthands.borderRadius('0'),
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke1),
    minWidth: '100px',
    height: '100%',
  },
  statusButtonUnavailable: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    cursor: 'default',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground3,
    },
  },
  statusButtonSelected: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  verifyButton: {
    ...shorthands.borderRadius('0'),
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke1),
    minWidth: '32px',
    width: '32px',
    height: '100%',
    padding: '0',
  },
  verifyButtonValid: {
    color: tokens.colorStatusSuccessForeground1,
  },
  verifyButtonInvalid: {
    color: tokens.colorStatusDangerForeground1,
  },
  privacyInfoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('1px', 'solid', tokens.colorBrandForeground1),
    color: tokens.colorBrandForeground1,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  versionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  versionLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  versionValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: 'monospace',
  },
  versionLink: {
    fontSize: tokens.fontSizeBase300,
    fontFamily: 'monospace',
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  supportButtons: {
    display: 'flex',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  selectedText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  selectButton: {
    minWidth: 'auto',
  },
  helperText: {
    marginTop: '12px',
    marginBottom: '12px',
  },
  infoSection: {
    marginTop: '24px',
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  accordionContent: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    '& p': {
      margin: '0 0 12px 0',
      '&:last-child': {
        marginBottom: '0',
      },
    },
    '& strong': {
      color: tokens.colorNeutralForeground1,
      fontWeight: tokens.fontWeightSemibold,
    },
    '& a': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& ul': {
      margin: '8px 0',
      paddingLeft: '24px',
    },
    '& li': {
      marginBottom: '4px',
    },
  },
  accordionSummary: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    marginBottom: '0',
    display: 'block',
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
  },
  warningIcon: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorPaletteYellowForeground1,
    flexShrink: 0,
    marginTop: '2px',
  },
});
