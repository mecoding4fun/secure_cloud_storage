import React, { createContext, useContext, useState } from 'react';
import { syncServiceWorkerToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const envKey = import.meta.env.VITE_API_KEY || "";
  
  // Try to load key from sessionStorage first, then fallback to env var
  const [apiKey, setApiKeyState] = useState(() => {
    return sessionStorage.getItem('secure_cloud_api_key') || envKey;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!apiKey);

  const login = (key) => {
    sessionStorage.setItem('secure_cloud_api_key', key);
    setApiKeyState(key);
    setIsAuthenticated(true);
    syncServiceWorkerToken();
  };

  const logout = () => {
    sessionStorage.removeItem('secure_cloud_api_key');
    setApiKeyState('');
    setIsAuthenticated(false);
    syncServiceWorkerToken();
  };

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
