import React from 'react';
import { signInWithCognito } from './auth-utils';

interface LoginButtonProps {
  className?: string;
  label?: string;
}

/**
 * Login Button Component
 * Redirects to Cognito login page on click
 */
const LoginButton: React.FC<LoginButtonProps> = ({
  className = '',
  label = 'Login'
}) => {
  return (
    <button
      className={`login-button ${className}`}
      onClick={() => signInWithCognito()}
    >
      {label}
    </button>
  );
};

export default LoginButton;
