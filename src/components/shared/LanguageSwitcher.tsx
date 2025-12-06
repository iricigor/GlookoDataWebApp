/**
 * Language Switcher Component
 * Provides a dropdown for switching the UI language between English and German
 */

import { Dropdown, Option, type DropdownProps } from '@fluentui/react-components';
import { useUILanguage, type UILanguage } from '../../hooks/useUILanguage';

interface LanguageSwitcherProps {
  /** Optional appearance style for the dropdown */
  appearance?: DropdownProps['appearance'];
  /** Optional custom className */
  className?: string;
}

/**
 * Language switcher component that allows users to change the UI language.
 * Uses Fluent UI Dropdown component with English and German options.
 * The selected language is persisted in LocalStorage.
 * 
 * @param appearance - Optional appearance style ('outline' | 'underline' | 'filled-darker' | 'filled-lighter')
 * @param className - Optional custom CSS class
 * @returns The language switcher dropdown element
 */
export function LanguageSwitcher({ appearance = 'outline', className }: LanguageSwitcherProps) {
  const { uiLanguage, setUILanguage } = useUILanguage();

  const handleLanguageChange: DropdownProps['onOptionSelect'] = (_, data) => {
    const newLanguage = data.optionValue as UILanguage;
    if (newLanguage === 'en' || newLanguage === 'de') {
      setUILanguage(newLanguage);
    }
  };

  return (
    <Dropdown
      appearance={appearance}
      value={uiLanguage === 'en' ? 'English' : 'Deutsch'}
      selectedOptions={[uiLanguage]}
      onOptionSelect={handleLanguageChange}
      className={className}
      aria-label="Select UI language"
    >
      <Option value="en">English</Option>
      <Option value="de">Deutsch</Option>
    </Dropdown>
  );
}
