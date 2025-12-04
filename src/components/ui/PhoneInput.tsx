import React from 'react';
import { PhoneInput as ReactPhoneInput, defaultCountries, parseCountry } from 'react-international-phone';

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: string;
  preferredCountries?: string[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  defaultCountry = 'ci',
  preferredCountries = [],
  disabled = false,
  required = false,
  placeholder,
  id
}) => {
  const countries = React.useMemo(() => {
    if (preferredCountries.length > 0) {
      const preferred = preferredCountries.map(iso2 => {
        return defaultCountries.find(country => {
          const parsedCountry = parseCountry(country);
          return parsedCountry.iso2.toLowerCase() === iso2.toLowerCase();
        });
      }).filter(Boolean);

      return preferred.length > 0 ? preferred : defaultCountries;
    }
    return defaultCountries;
  }, [preferredCountries]);

  return (
    <div className="phone-input-wrapper w-full">
      <ReactPhoneInput
        value={value}
        onChange={(phone) => onChange(phone)}
        defaultCountry={defaultCountry}
        countries={countries}
        disabled={disabled}
        placeholder={placeholder}
        inputProps={{
          required,
          id,
          autoComplete: 'tel'
        }}
        style={{
          '--react-international-phone-height': '40px',
          '--react-international-phone-background-color': 'var(--bg-input)',
          '--react-international-phone-text-color': 'var(--text-input)',
          '--react-international-phone-border-color': 'var(--border-input)',
          '--react-international-phone-border-radius': '0.5rem',
          '--react-international-phone-country-selector-background-color-hover': 'var(--bg-hover)',
          '--react-international-phone-selected-dropdown-item-background-color': 'rgb(234 88 12)',
          '--react-international-phone-disabled-background-color': 'var(--bg-disabled)',
          '--react-international-phone-dropdown-item-background-color': 'var(--bg-dropdown)',
        } as React.CSSProperties}
        className="w-full phone-input-custom"
      />
    </div>
  );
};

export default PhoneInput;
