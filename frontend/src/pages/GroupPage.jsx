import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGroups } from '../contexts/GroupsContext';
import Header from '../components/Header';
import '../styles/GroupPage.css';

export default function GroupPage() {
  const [selectedNav, setSelectedNav] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { groups, joinGroup } = useGroups();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Check if there's a tab to select from navigation state
    if (location.state?.tab) {
      setSelectedNav(location.state.tab);
    }

    setLoading(false);
  }, [location.state]);

  const handleViewGroup = (group) => {
    if (group.isJoined) {
      navigate(`/group/${group.slug}`);
    }
  };

  const handleJoinGroup = (group) => {
    if (!group.isJoined) {
      joinGroup(group.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const filteredGroups = searchQuery.trim() 
    ? groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : selectedNav === 'my-groups' 
      ? groups.filter(g => g.isJoined)
      : groups.filter(g => !g.isJoined);

  if (loading) {
    return <div className="group-wrapper"><p>Đang tải...</p></div>;
  }

  return (
    <div className="group-wrapper">
      <Header onLogout={handleLogout} />
      <div className="group-container">
        {/* Left Sidebar */}
        <aside className="group-sidebar-left">
          <div className="group-search-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="group-search-input"
            />
            <span className="group-search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          </div>

          <nav className="group-nav">
            <div 
              className={`group-nav-item ${selectedNav === 'my-groups' ? 'active' : ''}`}
              onClick={() => setSelectedNav('my-groups')}
            >
              <span className="group-nav-icon"><i class="fa-solid fa-users"></i></span>
              <span>Nhóm của bạn</span>
            </div>
            <div 
              className={`group-nav-item ${selectedNav === 'discover' ? 'active' : ''}`}
              onClick={() => setSelectedNav('discover')}
            >
              <span className="group-nav-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
              <span>Khám phá</span>
            </div>
            <div 
              className="group-nav-item create-group"
              onClick={() => navigate('/creategroup')}
            >
              <span className="group-nav-icon">➕</span>
              <span>Tạo nhóm mới</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="group-main-content">
          <h2 className="group-title">{selectedNav === 'my-groups' ? 'Nhóm của bạn' : 'Khám phá nhóm'}</h2>
          
          <div className="group-list">
            {filteredGroups.length === 0 ? (
              <p className="no-groups">
                {searchQuery.trim() ? 'Không tìm thấy nhóm nào' : 'Chưa có nhóm nào'}
              </p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} className="group-card">
                  <div className="group-images">
                    {group.images.map((_, idx) => (
                      <div key={idx} className="group-image-placeholder"></div>
                    ))}
                  </div>

                  <div className="group-info">
                    <h3 className="group-name">{group.name}</h3>
                  </div>

                  <div className="group-actions">
                    <button 
                      className="group-action-btn"
                      onClick={() => group.isJoined ? handleViewGroup(group) : handleJoinGroup(group)}
                    >
                      <span>{group.isJoined ? <i class="fa-solid fa-eye"></i> : '➕'}</span> {group.isJoined ? 'Xem' : 'Tham gia'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
