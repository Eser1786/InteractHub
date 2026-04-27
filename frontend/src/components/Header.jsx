import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import logoTextImage from '../assets/chữ logo 2.png';
import '../styles/Header.css';

export default function Header({ onLogout, showControls = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load user data from localStorage
    const loadUserData = () => {
      try {
        const userDataJson = localStorage.getItem('user');
        if (userDataJson) {
          const userData = JSON.parse(userDataJson);
          setCurrentUser(userData);
          
          // Debug logging
          console.log('Header - currentUser loaded:', {
            id: userData.Id,
            name: userData.UserName,
            ProfilePictureUrl: userData.ProfilePictureUrl
          });
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();

    // Listen for storage changes (when updated in other tabs or same page)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === null) {
        loadUserData();
      }
    };

    // Listen for custom events (when updated on same page)
    const handleUserUpdate = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch event to notify App.jsx about token change
    window.dispatchEvent(new Event('tokenUpdated'));
    
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <img src={logoImage} alt="Logo icon" className="logo-icon" />
          <img src={logoTextImage} alt="Logo text" className="logo-text-image" />
        </div>

        {showControls && (
          <>
            <div className="header-search">
              <input 
                type="text" 
                placeholder="Tìm kiếm" 
                className="search-input"
              />
              <button className="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>

            <div className="header-actions">
              <button 
                className={`header-icon-btn ${location.pathname === '/home' ? 'active' : ''}`}
                onClick={() => navigate('/home')}
                title="Home"
              >
                <span className="icon-home"><i class="fa-regular fa-house"></i></span>
              </button>
              <button 
                className={`header-icon-btn ${location.pathname === '/group' ? 'active' : ''}`}
                onClick={() => navigate('/group')}
                title="Groups"
              >
                <span className="icon-friends"><i className="fa-solid fa-users"></i></span>
              </button>
              <button 
                className={`header-icon-btn ${location.pathname === '/message' ? 'active' : ''}`}
                onClick={() => navigate('/message')}
                title="Messages"
              >
                <span className="icon-messages"><i class="fa-regular fa-envelope"></i></span>
              </button>
              <button 
                className="header-icon-btn logout-btn" 
                onClick={handleLogout}
                title="Logout"
              >
                <span className="icon-logout"><i className="fa-solid fa-arrow-right-from-bracket"></i></span>
              </button>
              <button 
                className={`header-icon-btn profile-btn ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                {currentUser?.ProfilePictureUrl ? (
                  <span className="icon-profile-avatar">
                    <img 
                      src={currentUser.ProfilePictureUrl} 
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => {
                        console.warn('Failed to load profile avatar:', currentUser.ProfilePictureUrl);
                        e.target.style.display = 'none';
                        if (e.target.parentElement?.nextElementSibling) {
                          e.target.parentElement.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  </span>
                ) : (
                  <span className="icon-profile"><i className="fa-solid fa-user"></i></span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
