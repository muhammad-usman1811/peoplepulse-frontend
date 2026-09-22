import React, { useState, useEffect } from 'react';
import { checkApiHealth, API_BASE_URL } from '../services/api';
import { ServerIcon } from './Icons';

export const ApiStatusBadge = () => {
  const [status, setStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [details, setDetails] = useState('');

  const verifyHealth = async () => {
    setStatus('checking');
    try {
      const res = await checkApiHealth();
      if (res.success) {
        setStatus('online');
        setDetails(res.data?.status || 'Connected');
      } else {
        setStatus('offline');
        setDetails(res.error || 'Cannot connect');
      }
    } catch {
      setStatus('offline');
      setDetails('Offline');
    }
  };

  useEffect(() => {
    verifyHealth();
    // Re-check periodically every 30 seconds
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`api-status-badge status-${status}`}
      onClick={verifyHealth}
      title={`Backend API: ${API_BASE_URL}\nStatus: ${status}\nClick to refresh connection check`}
    >
      <span className="status-indicator-dot"></span>
      <ServerIcon />
      <span className="status-text">
        {status === 'checking' && 'Checking API...'}
        {status === 'online' && `API Online`}
        {status === 'offline' && `API Offline (Retry)`}
      </span>
    </div>
  );
};

export default ApiStatusBadge;
