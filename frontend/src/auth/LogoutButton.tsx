import React from 'react';
import { signOut } from './auth-utils';

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

/**
 * Logout Button Component
 * Redirects to Cognito logout endpoint on click
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  label = 'Logout' 
}) => {
  return (
    <button 
      className={`logout-button ${className}`}
      onClick={() => signOut()}
    >
      {label}
    </button>
  );
};

export default LogoutButton; 