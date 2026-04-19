import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

export default function Header({ onLogout, showControls = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <div className="logo-circle"></div>
          <span className="logo-text">Logo</span>
        </div>

        {showControls && (
          <>
            <div className="header-search">
              <input 
                type="text" 
                placeholder="Tìm kiếm" 
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>

            <div className="header-actions">
              <button 
                className={`header-icon-btn ${location.pathname === '/home' ? 'active' : ''}`}
                onClick={() => navigate('/home')}
                title="Home"
              >
                <span className="icon-home">🏠</span>
              </button>
              <button 
                className={`header-icon-btn ${location.pathname === '/group' ? 'active' : ''}`}
                onClick={() => navigate('/group')}
                title="Groups"
              >
                <span className="icon-friends">👥</span>
              </button>
              <button 
                className={`header-icon-btn ${location.pathname === '/message' ? 'active' : ''}`}
                onClick={() => navigate('/message')}
                title="Messages"
              >
                <span className="icon-messages">✉️</span>
              </button>
              <button 
                className="header-icon-btn logout-btn" 
                onClick={handleLogout}
                title="Logout"
              >
                <span className="icon-logout">🚪</span>
              </button>
              <button 
                className={`header-icon-btn profile-btn ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <span className="icon-profile">👤</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
