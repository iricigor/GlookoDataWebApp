/**
 * Sample Fluent UI Card Component
 * 
 * This is an example component demonstrating best practices for:
 * - TypeScript typing
 * - Fluent UI component usage
 * - Custom styling with makeStyles
 * - Props documentation
 */

import { 
  Card, 
  CardHeader, 
  CardPreview,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { InfoRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  card: {
    width: '100%',
    maxWidth: '400px',
    ...shorthands.margin('10px'),
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '120px',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
});

export interface InfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactElement;
}

/**
 * InfoCard component displays information in a Fluent UI Card
 * 
 * @param title - The card title
 * @param description - The card description
 * @param icon - Optional icon to display in the header
 */
export function InfoCard({ title, description, icon = <InfoRegular /> }: InfoCardProps) {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <CardPreview className={styles.preview}>
        {icon}
      </CardPreview>
      <CardHeader
        header={
          <div className={styles.header}>
            <Text weight="semibold">{title}</Text>
          </div>
        }
        description={<Text size={300}>{description}</Text>}
      />
    </Card>
  );
}
