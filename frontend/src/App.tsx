import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { fetchConfig } from './config';
import { configureAmplifyCognitoAuthSingleton, isAuthenticated } from './auth/cognitoAuth';
import Login from './pages/Login';
import ProtectedPage from './pages/ProtectedPage';

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      setIsAuthed(authed);
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return isAuthed ? children : <Navigate to="/login" />;
};

function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const setupConfig = async () => {
      try {
        const config = await fetchConfig();
        configureAmplifyCognitoAuthSingleton(config);
        setIsConfigured(true);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }
    };

    setupConfig();
  }, []);

  if (!isConfigured) {
    return <div>Loading configuration...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <ProtectedPage />
            </ProtectedRoute>
          } 
        />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
