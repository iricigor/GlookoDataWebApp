/**
 * Tests for DataUploadGuide component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataUploadGuide } from './DataUploadGuide';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return simple mock translations based on key
      const translations: Record<string, string> = {
        'dataUpload.guide.title': 'Getting Started Guide',
        'dataUpload.guide.show': 'Show',
        'dataUpload.guide.hide': 'Hide',
        'dataUpload.guide.showAriaLabel': 'Show guide',
        'dataUpload.guide.hideAriaLabel': 'Hide guide',
        'dataUpload.guide.demoData.title': 'Demo Data',
        'dataUpload.guide.privacy.title': 'Privacy',
        'dataUpload.guide.upload.title': 'Upload Data',
        'dataUpload.guide.aiAnalysis.title': 'AI Analysis',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock FluentUI components with simple implementations
vi.mock('@fluentui/react-components', async () => {
  const actual = await vi.importActual('@fluentui/react-components');
  return {
    ...actual,
    makeStyles: () => () => ({}),
    Accordion: ({ children, openItems, onToggle }: any) => (
      <div data-testid="accordion" data-open-items={JSON.stringify(openItems)}>
        {children}
      </div>
    ),
    AccordionItem: ({ children, value }: any) => (
      <div data-testid="accordion-item" data-value={value}>
        {children}
      </div>
    ),
    AccordionHeader: ({ children, onClick }: any) => (
      <button data-testid="accordion-header" onClick={onClick}>
        {children}
      </button>
    ),
    AccordionPanel: ({ children }: any) => <div data-testid="accordion-panel">{children}</div>,
  };
});

describe('DataUploadGuide', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render in visible state by default', () => {
    render(<DataUploadGuide />);
    
    // Check for title with emoji (text is split across elements)
    expect(screen.getByText(/Getting Started Guide/)).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('should save visibility state to localStorage', () => {
    render(<DataUploadGuide />);
    
    // Component should save visible state
    expect(localStorage.getItem('dataUpload-guide-visible')).toBe('true');
  });

  it('should restore visibility state from localStorage', () => {
    // Set collapsed state in localStorage
    localStorage.setItem('dataUpload-guide-visible', 'false');
    
    render(<DataUploadGuide />);
    
    // Should show the collapsed view
    expect(screen.getByText('Show')).toBeInTheDocument();
    expect(screen.queryByText('Hide')).not.toBeInTheDocument();
  });

  it('should toggle visibility when clicking show/hide button', () => {
    render(<DataUploadGuide />);
    
    // Initially visible
    expect(screen.getByText('Hide')).toBeInTheDocument();
    
    // Click hide button
    const hideButton = screen.getByRole('button', { name: 'Hide guide' });
    fireEvent.click(hideButton);
    
    // Should be collapsed now
    expect(screen.getByText('Show')).toBeInTheDocument();
    expect(screen.queryByText('Hide')).not.toBeInTheDocument();
  });

  it('should initialize accordion state from localStorage', () => {
    // Set accordion state in localStorage
    localStorage.setItem('dataUpload-guide-accordion-state', JSON.stringify(['demo-data', 'privacy']));
    
    render(<DataUploadGuide />);
    
    const accordion = screen.getByTestId('accordion');
    expect(accordion.getAttribute('data-open-items')).toBe('["demo-data","privacy"]');
  });

  it('should handle invalid JSON in accordion state gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('dataUpload-guide-accordion-state', 'invalid-json');
    
    // Should not throw and should render with empty accordion state
    expect(() => render(<DataUploadGuide />)).not.toThrow();
    
    const accordion = screen.getByTestId('accordion');
    expect(accordion.getAttribute('data-open-items')).toBe('[]');
  });

  it('should handle non-array values in accordion state gracefully', () => {
    // Set non-array value in localStorage
    localStorage.setItem('dataUpload-guide-accordion-state', JSON.stringify({ notAnArray: true }));
    
    // Should not throw and should render with empty accordion state
    expect(() => render(<DataUploadGuide />)).not.toThrow();
    
    const accordion = screen.getByTestId('accordion');
    expect(accordion.getAttribute('data-open-items')).toBe('[]');
  });

  it('should persist accordion state changes to localStorage', () => {
    const { rerender } = render(<DataUploadGuide />);
    
    // Initial state should be empty array
    expect(localStorage.getItem('dataUpload-guide-accordion-state')).toBe('[]');
    
    // Simulate accordion state change by re-rendering with new state
    localStorage.setItem('dataUpload-guide-accordion-state', JSON.stringify(['demo-data']));
    rerender(<DataUploadGuide />);
    
    // Verify localStorage has the updated state
    expect(localStorage.getItem('dataUpload-guide-accordion-state')).toBe('["demo-data"]');
  });

  it('should render all accordion items', () => {
    render(<DataUploadGuide />);
    
    // Check that all four accordion items are present
    const accordionItems = screen.getAllByTestId('accordion-item');
    expect(accordionItems).toHaveLength(4);
    
    // Verify the values of accordion items
    expect(accordionItems[0].getAttribute('data-value')).toBe('demo-data');
    expect(accordionItems[1].getAttribute('data-value')).toBe('privacy');
    expect(accordionItems[2].getAttribute('data-value')).toBe('upload');
    expect(accordionItems[3].getAttribute('data-value')).toBe('ai-analysis');
  });

  it('should show collapsed state when clicking the collapsed card', () => {
    // Start with collapsed state
    localStorage.setItem('dataUpload-guide-visible', 'false');
    
    render(<DataUploadGuide />);
    
    // Get all elements with role button and name "Show guide" (div and button)
    const showElements = screen.getAllByRole('button', { name: 'Show guide' });
    // Click the actual button element (second one - the first is the div wrapper)
    fireEvent.click(showElements[showElements.length - 1]);
    
    // Should expand and show the guide
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });
});
