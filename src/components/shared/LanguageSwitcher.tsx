/**
 * Language Switcher Component
 * Provides a dropdown for switching the UI language between English, German, Czech, and Serbian
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
 * Uses Fluent UI Dropdown component with English, German, Czech, and Serbian options.
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
    if (newLanguage === 'en' || newLanguage === 'de' || newLanguage === 'cs' || newLanguage === 'sr') {
      setUILanguage(newLanguage);
    }
  };

  // Map language codes to display names
  const languageNames: Record<UILanguage, string> = {
    en: 'English',
    de: 'Deutsch',
    cs: 'Čeština',
    sr: 'Srpski'
  };

  return (
    <Dropdown
      appearance={appearance}
      value={languageNames[uiLanguage]}
      selectedOptions={[uiLanguage]}
      onOptionSelect={handleLanguageChange}
      className={className}
      aria-label="Select UI language"
    >
      <Option value="en">English</Option>
      <Option value="de">Deutsch</Option>
      <Option value="cs">Čeština</Option>
      <Option value="sr">Srpski</Option>
    </Dropdown>
  );
}
