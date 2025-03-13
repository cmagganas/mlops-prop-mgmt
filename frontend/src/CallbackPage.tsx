import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import { getConfig } from './config';
import { initializeAuth } from './auth/auth-components';

/**
 * Callback page that handles the redirect from Cognito hosted UI
 * after successful authentication
 */
const CallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    // Initialize auth
    const config = getConfig();
    initializeAuth(config);

    // Parse the URL to handle the authentication code
    const handleCallback = async () => {
      try {
        // AWS Amplify will automatically handle the OAuth code exchange
        // when accessing this page with the code param in the URL
        await Auth.currentSession();
        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');
        
        // Redirect to the home page after successful authentication
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Authentication error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto',
      marginTop: '100px'
    }}>
      <h1>Property Management System</h1>
      
      <div style={{ 
        padding: '2rem',
        backgroundColor: status === 'loading' ? '#f8f9fa' : 
                        status === 'success' ? '#d4edda' : '#f8d7da',
        borderRadius: '8px',
        marginTop: '2rem',
        color: status === 'loading' ? '#212529' : 
              status === 'success' ? '#155724' : '#721c24'
      }}>
        <h2>
          {status === 'loading' ? 'Processing...' : 
           status === 'success' ? 'Success!' : 'Error'}
        </h2>
        <p>{message}</p>
        
        {status === 'error' && (
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
              marginTop: '1rem'
            }}
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default CallbackPage; 