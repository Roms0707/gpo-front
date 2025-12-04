import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  label,
  required = false,
  placeholder,
  min,
  max,
  className = ''
}) => {
  const { t } = useTranslation();
  const dateFormat = placeholder || t('common.dateFormat');
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="date"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-full bg-gray-100 dark:bg-dark-200 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          required={required}
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {t('common.formatLabel')}: {dateFormat}
      </p>
    </div>
  );
};

export default DateInput;
