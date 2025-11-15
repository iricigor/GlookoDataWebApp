/**
 * TableContainer component
 * A unified container for tables with consistent styling, sticky headers,
 * and export functionality (copy to CSV and download CSV)
 */

import { ReactNode } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { CopyToCsvButton } from './CopyToCsvButton';
import { DownloadCsvButton } from './DownloadCsvButton';
import type { ExportFormat } from '../utils/data';

const useStyles = makeStyles({
  tableContainer: {
    position: 'relative',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    '&:hover .table-buttons': {
      opacity: 1,
    },
  },
  scrollableContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  buttonGroup: {
    position: 'sticky',
    top: '8px',
    right: '8px',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    zIndex: 10,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    boxShadow: tokens.shadow4,
    float: 'right',
    marginRight: '8px',
    marginTop: '8px',
    display: 'flex',
    ...shorthands.gap('4px'),
    ...shorthands.padding('4px'),
  },
  stickyHeader: {
    '& thead': {
      position: 'sticky',
      top: 0,
      backgroundColor: tokens.colorNeutralBackground1,
      zIndex: 1,
      '& th::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '1px',
        backgroundColor: tokens.colorNeutralStroke1,
      },
    },
  },
});

interface TableContainerProps {
  /** The table content to render */
  children: ReactNode;
  /** Data for CSV export (2D array with headers in first row) */
  data: (string | number)[][];
  /** Export format (CSV or TSV) */
  exportFormat?: ExportFormat;
  /** Optional file name for download (without extension) */
  fileName?: string;
  /** Aria label for copy button */
  copyAriaLabel?: string;
  /** Aria label for download button */
  downloadAriaLabel?: string;
  /** Whether table should be scrollable with max height */
  scrollable?: boolean;
  /** Whether headers should be sticky */
  stickyHeaders?: boolean;
}

/**
 * Unified table container with consistent styling and export functionality
 * 
 * Features:
 * - Sticky headers (optional, enabled by default)
 * - Scrollable content with max height (optional)
 * - Hover-based export buttons (copy and download)
 * - Consistent border and styling
 * 
 * Usage:
 * ```tsx
 * <TableContainer
 *   data={myTableData}
 *   exportFormat={exportFormat}
 *   fileName="my-report"
 *   scrollable
 * >
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </TableContainer>
 * ```
 */
export function TableContainer({
  children,
  data,
  exportFormat = 'csv',
  fileName = 'export',
  copyAriaLabel,
  downloadAriaLabel,
  scrollable = false,
  stickyHeaders = true,
}: TableContainerProps) {
  const styles = useStyles();
  
  const formatLabel = exportFormat.toUpperCase();
  const defaultCopyLabel = `Copy as ${formatLabel}`;
  const defaultDownloadLabel = `Download as ${formatLabel}`;

  const containerClasses = [
    styles.tableContainer,
    scrollable && styles.scrollableContainer,
    stickyHeaders && styles.stickyHeader,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={`${styles.buttonGroup} table-buttons`}>
        <CopyToCsvButton
          data={data}
          format={exportFormat}
          ariaLabel={copyAriaLabel || defaultCopyLabel}
        />
        <DownloadCsvButton
          data={data}
          format={exportFormat}
          fileName={fileName}
          ariaLabel={downloadAriaLabel || defaultDownloadLabel}
        />
      </div>
      {children}
    </div>
  );
}
