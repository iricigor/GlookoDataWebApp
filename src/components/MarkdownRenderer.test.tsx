import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

// Mock the CopyAIResponseButton component
vi.mock('./CopyAIResponseButton', () => ({
  CopyAIResponseButton: ({ content }: { content: string }) => (
    <button data-testid="copy-button">Copy {content.substring(0, 10)}</button>
  ),
}));

describe('MarkdownRenderer', () => {
  it('should render plain text', () => {
    render(<MarkdownRenderer content="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render markdown headers', () => {
    const content = '## Clinical Assessment';
    render(<MarkdownRenderer content={content} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Clinical Assessment');
  });

  it('should render bold text', () => {
    const content = 'This is **bold text**';
    render(<MarkdownRenderer content={content} />);
    const boldElement = screen.getByText('bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('should render italic text', () => {
    const content = 'This is *italic text*';
    render(<MarkdownRenderer content={content} />);
    const italicElement = screen.getByText('italic text');
    expect(italicElement.tagName).toBe('EM');
  });

  it('should render lists', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should render numbered lists', () => {
    const content = '1. First\n2. Second\n3. Third';
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('should render inline code', () => {
    const content = 'Use `console.log()` for debugging';
    render(<MarkdownRenderer content={content} />);
    const codeElement = screen.getByText('console.log()');
    expect(codeElement.tagName).toBe('CODE');
  });

  it('should render links', () => {
    const content = '[GitHub](https://github.com)';
    render(<MarkdownRenderer content={content} />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com');
  });

  it('should render multiple paragraphs', () => {
    const content = 'First paragraph\n\nSecond paragraph';
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('should render complex markdown with headers and lists', () => {
    const content = `## Clinical Assessment

Your patient's TIR of 68.5% is **just below the recommended target of 70%**, indicating room for improvement.

### Recommendations:
- Review medication dosing
- Monitor blood glucose
- Adjust diet`;
    
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 2, name: 'Clinical Assessment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Recommendations:' })).toBeInTheDocument();
    expect(screen.getByText(/just below the recommended target of 70%/)).toBeInTheDocument();
    expect(screen.getByText('Review medication dosing')).toBeInTheDocument();
    expect(screen.getByText('Monitor blood glucose')).toBeInTheDocument();
    expect(screen.getByText('Adjust diet')).toBeInTheDocument();
  });

  it('should render markdown tables with proper HTML structure', () => {
    const tableContent = `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Data A   | Data B   | Data C   |`;
    
    render(<MarkdownRenderer content={tableContent} />);
    
    // Check that a table element exists
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByRole('columnheader', { name: 'Column 1' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Column 2' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Column 3' })).toBeInTheDocument();
    
    // Check for table cells with data
    expect(screen.getByRole('cell', { name: 'Value 1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Value 2' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Value 3' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Data A' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Data B' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Data C' })).toBeInTheDocument();
  });

  it('should show copy button when showCopyButton is true', () => {
    render(<MarkdownRenderer content="Test content" showCopyButton={true} />);
    
    // Check if copy button is shown (always visible now, no hover required)
    const copyButton = screen.queryByTestId('copy-button');
    expect(copyButton).toBeInTheDocument();
  });

  it('should not show copy button when showCopyButton is false', () => {
    render(<MarkdownRenderer content="Test content" showCopyButton={false} />);
    
    // Check if copy button is not shown
    const copyButton = screen.queryByTestId('copy-button');
    expect(copyButton).not.toBeInTheDocument();
  });

  it('should default showCopyButton to true', () => {
    render(<MarkdownRenderer content="Test content" />);
    
    // Check if copy button is shown by default (always visible, no hover required)
    const copyButton = screen.queryByTestId('copy-button');
    expect(copyButton).toBeInTheDocument();
  });
});
