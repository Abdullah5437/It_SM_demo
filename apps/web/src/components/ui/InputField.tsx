import React from 'react';
import styles from './InputField.module.css';

export interface InputFieldProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  icon,
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = [
    styles.input,
    error && styles['input--error'],
    disabled && styles['input--disabled'],
    icon && styles['input--with-icon'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputField}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default InputField;