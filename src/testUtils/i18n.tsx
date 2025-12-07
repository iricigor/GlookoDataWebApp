/**
 * Test utilities for i18n
 */

import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import i18n from '../i18n';

/**
 * Custom render function that ensures i18n is loaded before rendering
 */
export async function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Wait for i18n to be fully initialized and all namespaces loaded
  if (!i18n.isInitialized) {
    await i18n.init();
  }
  
  // Wait for all namespaces to be loaded
  const namespaces = Array.isArray(i18n.options.ns) ? i18n.options.ns : [i18n.options.ns as string];
  await Promise.all(
    namespaces.map(ns => 
      i18n.loadNamespaces(ns)
    )
  );
  
  return rtlRender(ui, options);
}

export { screen, waitFor, fireEvent, within } from '@testing-library/react';
