import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

export const Input = ({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  rightLabelElement = null,
  autoComplete,
  disabled = false,
  minLength,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';

  const computedType = isPasswordField
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={`form-group ${className}`}>
      <div className="label-row">
        {label && (
          <label htmlFor={id} className="form-label">
            {label}
          </label>
        )}
        {rightLabelElement}
      </div>

      <div className="input-wrapper">
        <input
          id={id}
          name={name}
          type={computedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          className={`form-input ${isPasswordField ? 'has-toggle' : ''}`}
        />

        {isPasswordField && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex="-1"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
