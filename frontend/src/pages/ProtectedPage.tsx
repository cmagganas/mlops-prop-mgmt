import React, { useEffect, useState } from 'react';
import { signOut, getCurrentUser } from '../auth/cognitoAuth';

const ProtectedPage: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        setUserData(user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px'
    }}>
      <h1>Property Management Dashboard</h1>
      <p>You are authenticated!</p>

      {userData && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          maxWidth: '600px'
        }}>
          <h2>User Information</h2>
          <p><strong>Username:</strong> {userData.username}</p>
          {userData.attributes && (
            <>
              <p><strong>Email:</strong> {userData.attributes.email}</p>
              {userData.attributes.sub && (
                <p><strong>User ID:</strong> {userData.attributes.sub}</p>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={signOut}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '30px'
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default ProtectedPage;
