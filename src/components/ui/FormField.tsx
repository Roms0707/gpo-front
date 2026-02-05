import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  children?: React.ReactNode; // For select options or custom content
  as?: 'input' | 'textarea' | 'select';
  className?: string;
  min?: string;
  max?: string;
  accept?: string;
  pattern?: string;
  title?: string;
  minLength?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  children,
  as = 'input',
  className = '',
  min,
  max,
  accept,
  pattern,
  title,
  minLength
}) => {
  const baseClassName = `input ${className}`;
  const labelClassName = `label ${required ? 'required' : ''}`;

  const renderField = () => {
    const commonProps = {
      id,
      value,
      onChange,
      className: baseClassName,
      required,
      disabled,
      placeholder,
      'aria-describedby': helpText || error ? `${id}-help` : undefined,
      'aria-invalid': error ? 'true' : 'false'
    };

    switch (as) {
      case 'textarea':
        return <textarea {...commonProps} />;
      case 'select':
        return (
          <select {...commonProps}>
            {children}
          </select>
        );
      default:
        return (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
            accept={accept}
            pattern={pattern}
            title={title}
            minLength={minLength}
          />
        );
    }
  };

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      {renderField()}
      {(helpText || error) && (
        <p 
          id={`${id}-help`}
          className={`text-xs mt-1 ${error ? 'text-error-500' : 'text-gray-400'}`}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;