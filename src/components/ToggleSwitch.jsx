import React from 'react';

export const ToggleSwitch = ({ checked, onChange, id, label }) => {
  return (
    <label htmlFor={id} className="toggle-switch-wrapper" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-switch-checkbox"
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <div className={`toggle-switch-track ${checked ? 'checked' : ''}`} aria-label={label}>
        <div className="toggle-switch-thumb" />
      </div>
    </label>
  );
};

export default ToggleSwitch;
