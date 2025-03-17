import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { signInWithCognito, signOut } from './auth/cognitoAuth.ts';
import { defaultConfig } from './config.ts';
import axios from 'axios';

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Minimal Auth App component
const AuthApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication status via backend API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Configure axios to send cookies with requests
        axios.defaults.withCredentials = true;

        // Use the backend's /auth/user endpoint to check auth status
        const response = await axios.get(`${defaultConfig.backend_api_url}/auth/user`);

        if (response.status === 200 && response.data) {
          setUser(response.data);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      // Redirect to the backend sign-out endpoint
      window.location.href = `${defaultConfig.backend_api_url}/auth/logout`;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Test different logout options
  const testCustomLogout = (path: string, useRedirectUri: boolean, useLogoutUri: boolean) => {
    const url = `${defaultConfig.backend_api_url}/custom-logout?logout_path=${encodeURIComponent(path)}&use_redirect_uri=${useRedirectUri}&use_logout_uri=${useLogoutUri}`;
    window.location.href = url;
  };

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
            <button 
              onClick={handleSignOut}
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
              Sign Out (Normal)
            </button>
            
            <h3 style={{ marginTop: '20px' }}>Logout Test Options:</h3>
            
            <button 
              onClick={() => testCustomLogout('/logout', false, true)}
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
              Test 1: /logout + logout_uri
            </button>
            
            <button 
              onClick={() => testCustomLogout('/oauth2/logout', false, true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Test 2: /oauth2/logout + logout_uri
            </button>
            
            <button 
              onClick={() => testCustomLogout('/logout', true, false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Test 3: /logout + redirect_uri
            </button>
            
            <button 
              onClick={() => testCustomLogout('/oauth2/logout', true, false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Test 4: /oauth2/logout + redirect_uri
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <p>Please sign in to access the property management system.</p>
          <button
            onClick={() => window.location.href = `${defaultConfig.backend_api_url}/auth/login`}
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
