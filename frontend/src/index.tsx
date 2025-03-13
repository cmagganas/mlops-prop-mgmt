import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { signInWithCognito, signOut, isAuthenticated, getCurrentUser, configureAmplifyCognitoAuthSingleton } from './auth/cognitoAuth';
import { defaultConfig } from './config';

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Minimal Auth App component
const AuthApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Configure Amplify with Cognito 
  useEffect(() => {
    try {
      configureAmplifyCognitoAuthSingleton(defaultConfig);
      console.log('Amplify configured with Cognito');
    } catch (error) {
      console.error('Failed to configure Amplify:', error);
    }
  }, []);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
        setIsLoggedIn(authenticated);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Property Management System</h1>
      
      {isLoggedIn ? (
        <div style={{ marginTop: '2rem' }}>
          <h2>Welcome, {user?.username || user?.email || 'User'}!</h2>
          <p>You are successfully logged in.</p>
          <button 
            onClick={signOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '1rem'
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <p>Please sign in to access the property management system.</p>
          <button 
            onClick={signInWithCognito}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '1rem'
            }}
          >
            Sign in with Cognito
          </button>
        </div>
      )}
    </div>
  );
};

// Render the app
root.render(
  <React.StrictMode>
    <AuthApp />
  </React.StrictMode>
); 