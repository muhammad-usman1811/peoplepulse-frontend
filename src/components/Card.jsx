import React from 'react';

export const Card = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  headerAction = null 
}) => {
  return (
    <div className={`profile-card ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="profile-card-header">
          <div>
            {title && <h2 className="profile-card-title">{title}</h2>}
            {subtitle && <p className="profile-card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div className="profile-card-action">{headerAction}</div>}
        </div>
      )}
      <div className="profile-card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
