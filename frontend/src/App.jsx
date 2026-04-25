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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Listen for storage changes (when token is saved from another tab or in this tab)
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
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
