import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { checkAuthentication, getCurrentUser } from './auth/auth-utils';
import LoginButton from './auth/LoginButton';
import LogoutButton from './auth/LogoutButton';

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await checkAuthentication();
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

// Home page component
const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="home-page">
      <h1>Property Management Dashboard</h1>

      {user ? (
        <div className="user-info">
          <h2>Welcome, {user.username || user.email || 'User'}!</h2>
          <div className="user-details">
            <p><strong>User ID:</strong> {user.user_id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.groups && user.groups.length > 0 && (
              <p><strong>Groups:</strong> {user.groups.join(', ')}</p>
            )}
          </div>
          <LogoutButton className="logout-btn" />
        </div>
      ) : (
        <div className="login-prompt">
          <p>Please log in to access your dashboard</p>
          <LoginButton className="login-btn" />
        </div>
      )}
    </div>
  );
};

// Login page component
const Login = () => {
  return (
    <div className="login-page">
      <h1>Property Management</h1>
      <h2>Login</h2>
      <LoginButton label="Sign in with Cognito" />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
