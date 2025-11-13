import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const useStyles = makeStyles({
  markdown: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.6',
    fontFamily: 'Segoe UI, sans-serif',
    '& h1': {
      fontSize: tokens.fontSizeBase600,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
      marginTop: '24px',
      marginBottom: '16px',
      ...shorthands.borderBottom('2px', 'solid', tokens.colorNeutralStroke2),
      paddingBottom: '8px',
    },
    '& h2': {
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
      marginTop: '20px',
      marginBottom: '12px',
    },
    '& h3': {
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
      marginTop: '16px',
      marginBottom: '8px',
    },
    '& p': {
      marginTop: '0',
      marginBottom: '12px',
    },
    '& ul, & ol': {
      marginTop: '8px',
      marginBottom: '12px',
      paddingLeft: '24px',
    },
    '& li': {
      marginBottom: '4px',
    },
    '& strong': {
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& code': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorBrandForeground1,
      ...shorthands.padding('2px', '6px'),
      ...shorthands.borderRadius('4px'),
      fontSize: tokens.fontSizeBase300,
      fontFamily: 'Consolas, Monaco, monospace',
    },
    '& pre': {
      backgroundColor: tokens.colorNeutralBackground3,
      ...shorthands.padding('12px'),
      ...shorthands.borderRadius('8px'),
      ...shorthands.overflow('auto'),
      marginTop: '12px',
      marginBottom: '12px',
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: '0',
      fontSize: tokens.fontSizeBase300,
    },
    '& blockquote': {
      ...shorthands.borderLeft('4px', 'solid', tokens.colorNeutralStroke2),
      paddingLeft: '16px',
      marginLeft: '0',
      marginTop: '12px',
      marginBottom: '12px',
      color: tokens.colorNeutralForeground2,
      fontStyle: 'italic',
    },
    '& a': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline',
      },
    },
    '& hr': {
      ...shorthands.border('none'),
      ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
      marginTop: '16px',
      marginBottom: '16px',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      marginTop: '12px',
      marginBottom: '12px',
    },
    '& th, & td': {
      ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
      ...shorthands.padding('8px', '12px'),
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: tokens.colorNeutralBackground3,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
});

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const styles = useStyles();
  
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
