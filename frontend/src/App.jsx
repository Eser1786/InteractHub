import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GroupsProvider } from './contexts/GroupsContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import GroupPage from './pages/GroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import CreateGroupPage from './pages/CreateGroupPage';
import MessagePage from './pages/MessagePage';
import ProfilePage from './pages/ProfilePage';

// Helper function to check if JWT token is valid (not expired)
function isTokenValid(token) {
  if (!token) return false;
  
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expired (exp is in seconds, Date.now() is in milliseconds)
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    console.log('Token expiration check:', {
      expiresAt: new Date(expirationTime),
      currentTime: new Date(currentTime),
      isValid: currentTime < expirationTime
    });
    
    return currentTime < expirationTime;
  } catch (err) {
    console.error('Error validating token:', err);
    return false;
  }
}

function App() {
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage, but validate it
    const savedToken = localStorage.getItem('token');
    if (savedToken && isTokenValid(savedToken)) {
      return savedToken;
    } else {
      // Clear invalid/expired token
      if (savedToken) {
        console.log('Token is expired or invalid, clearing...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return null;
    }
  });

  useEffect(() => {
    // Listen for storage changes (when token is saved from another tab or in this tab)
    const handleStorageChange = () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken && isTokenValid(savedToken)) {
        setToken(savedToken);
      } else {
        setToken(null);
      }
    };

    // Listen to storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);

    // Also listen to custom event for same-tab updates
    window.addEventListener('tokenUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenUpdated', handleStorageChange);
    };
  }, []);

  return (
    <GroupsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={token ? <HomePage /> : <Navigate to="/login" replace />} />
          <Route path="/group" element={token ? <GroupPage /> : <Navigate to="/login" replace />} />
          <Route path="/group/:groupSlug" element={token ? <GroupDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/creategroup" element={token ? <CreateGroupPage /> : <Navigate to="/login" replace />} />
          <Route path="/message" element={token ? <MessagePage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/" element={token ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </GroupsProvider>
  );
}

export default App;
