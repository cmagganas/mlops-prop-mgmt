/**
 * Authentication utilities for AWS Cognito
 */

// API URL for backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Redirect the user to the Cognito login page
 */
export const signInWithCognito = () => {
  // Redirect to the backend login endpoint, which will redirect to Cognito
  window.location.href = `${API_URL}/auth/login`;
};

/**
 * Check if the user is authenticated by making a request to the user endpoint
 */
export const checkAuthentication = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      credentials: 'include', // Important for cookies to be sent
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

/**
 * Fetch the current user's information
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      credentials: 'include', // Important for cookies to be sent
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

/**
 * Log the user out
 */
export const signOut = () => {
  window.location.href = `${API_URL}/auth/logout`;
}; 