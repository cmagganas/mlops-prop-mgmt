import React, { useEffect, useState } from 'react';
import { signInWithCognito, signOut, isAuthenticated, getCurrentUser, configureAmplifyCognitoAuthSingleton } from './cognitoAuth';
import { PropertyManagementConfig } from '../config';

// Simple login button that uses the cognitoAuth implementation
export const LoginButton = ({ label = 'Sign in', className = '' }: { label?: string, className?: string }) => {
  return (
    <button
      className={`login-button ${className}`}
      onClick={() => signInWithCognito()}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      {label}
    </button>
  );
};

// Simple logout button
export const LogoutButton = ({ label = 'Sign out', className = '' }: { label?: string, className?: string }) => {
  return (
    <button
      className={`logout-button ${className}`}
      onClick={() => signOut()}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      {label}
    </button>
  );
};

// Hook to get auth status
export const useAuth = () => {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        const user = authenticated ? await getCurrentUser() : null;

        setAuthStatus({
          isAuthenticated: authenticated,
          isLoading: false,
          user
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
    };

    checkAuth();
  }, []);

  return authStatus;
};

// Initialize authentication
export const initializeAuth = (config: PropertyManagementConfig) => {
  try {
    configureAmplifyCognitoAuthSingleton(config);
    console.log('AWS Amplify authentication initialized');
  } catch (error) {
    console.error('Failed to initialize AWS Amplify authentication:', error);
  }
};
