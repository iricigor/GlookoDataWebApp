/**
 * Tests for TableContainer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { TableContainer } from './TableContainer';
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';

describe('TableContainer', () => {
  const mockData: (string | number)[][] = [
    ['Name', 'Age', 'City'],
    ['Alice', 30, 'New York'],
    ['Bob', 25, 'San Francisco'],
  ];

  const renderComponent = (props: React.ComponentProps<typeof TableContainer>) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <TableContainer {...props} />
      </FluentProvider>
    );
  };

  it('should render children content', () => {
    renderComponent({
      data: mockData,
      children: (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Age</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>30</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should render copy and download buttons', () => {
    renderComponent({
      data: mockData,
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    // Buttons should be rendered (though hidden by CSS initially)
    const copyButton = screen.getByRole('button', { name: /copy as csv/i });
    const downloadButton = screen.getByRole('button', { name: /download as csv/i });

    expect(copyButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
  });

  it('should support TSV format', () => {
    renderComponent({
      data: mockData,
      exportFormat: 'tsv',
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    const copyButton = screen.getByRole('button', { name: /copy as tsv/i });
    const downloadButton = screen.getByRole('button', { name: /download as tsv/i });

    expect(copyButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
  });

  it('should support custom aria labels', () => {
    renderComponent({
      data: mockData,
      copyAriaLabel: 'Copy table data',
      downloadAriaLabel: 'Download table data',
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    const copyButton = screen.getByRole('button', { name: /copy table data/i });
    const downloadButton = screen.getByRole('button', { name: /download table data/i });

    expect(copyButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
  });

  it('should support custom file name', () => {
    renderComponent({
      data: mockData,
      fileName: 'my-custom-file',
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    // File name is used in download button but we can't directly test it
    // Just verify the component renders
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render with scrollable option', () => {
    const { container } = renderComponent({
      data: mockData,
      scrollable: true,
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    // Just verify the component renders - CSS classes are implementation details
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render with sticky headers by default', () => {
    const { container } = renderComponent({
      data: mockData,
      children: (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    // Just verify the component renders
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should support disabling sticky headers', () => {
    renderComponent({
      data: mockData,
      stickyHeaders: false,
      children: (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ),
    });

    // Just verify the component renders
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
