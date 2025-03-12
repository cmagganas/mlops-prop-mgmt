import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCognito, isAuthenticated } from '../auth/cognitoAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      if (authed) {
        navigate('/');
      }
      setChecking(false);
    };
    
    checkAuth();
  }, [navigate]);

  if (checking) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <h1>Property Management System</h1>
      <p>Please sign in to continue</p>
      <button 
        onClick={signInWithCognito}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Sign In
      </button>
    </div>
  );
};

export default Login;
