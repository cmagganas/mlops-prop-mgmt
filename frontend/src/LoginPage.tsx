import React, { useEffect } from 'react';
import { LoginButton, initializeAuth, useAuth } from './auth/auth-components';
import { getConfig } from './config';

// Basic user type for authenticated users
interface User {
  username?: string;
  email?: string;
  [key: string]: any; // Allow any other properties
}

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Initialize auth when the component mounts
  useEffect(() => {
    const config = getConfig();
    initializeAuth(config);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    // Cast user to our User interface
    const userData = user as User;
    
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Property Management System</h1>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <h2>Welcome, {userData.username || userData.email || 'User'}!</h2>
          <p>You are signed in.</p>
          <p>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Property Management System</h1>
      <div style={{ 
        padding: '2rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        <h2>Sign In</h2>
        <p>Please sign in to access the property management system.</p>
        <div style={{ marginTop: '2rem' }}>
          <LoginButton label="Sign in with Cognito" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 