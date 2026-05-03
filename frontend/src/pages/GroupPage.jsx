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
  const { groups } = useGroups();

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(userData);
    } catch (err) {
      console.error('Error loading user data:', err);
      setCurrentUser(null);
    }

    // Check if there's a tab to select from navigation state
    if (location.state?.tab) {
      setSelectedNav(location.state.tab);
    }

    setLoading(false);
  }, [location.state]);

  const handleViewGroup = (group) => {
    navigate(`/group/${group.slug}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // In 'my-groups', show groups user has joined or created
    // In 'discover', show groups user has NOT joined AND did NOT create
    const isMyGroup = g.isJoined || (currentUser && g.creatorId === (currentUser.Id || currentUser.id));
    const matchesNav = selectedNav === 'my-groups' ? isMyGroup : !isMyGroup;
    
    return matchesSearch && matchesNav;
  });

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
                    {(() => {
                      let parsedImages = null;
                      try {
                        if (group.imageUrl && group.imageUrl.startsWith('[')) {
                          parsedImages = JSON.parse(group.imageUrl);
                        } else if (group.imageUrl) {
                          parsedImages = [group.imageUrl];
                        }
                      } catch (e) {}

                      if (parsedImages && parsedImages.length > 0) {
                        if (parsedImages.length >= 3) {
                          return parsedImages.slice(0, 3).map((img, idx) => (
                            <img key={idx} src={img} alt={`${group.name}-${idx}`} className="group-image-placeholder" style={{ objectFit: 'cover' }} />
                          ));
                        } else {
                          return (
                            <div style={{ display: 'flex', gap: '5px', width: '100%', height: '100px' }}>
                              {parsedImages.map((img, idx) => (
                                <img key={idx} src={img} alt={`${group.name}-${idx}`} style={{ flex: 1, objectFit: 'cover', borderRadius: '8px' }} />
                              ))}
                            </div>
                          );
                        }
                      } else {
                        return group.images.map((_, idx) => (
                          <div key={idx} className="group-image-placeholder"></div>
                        ));
                      }
                    })()}
                  </div>

                  <div className="group-info">
                    <h3 className="group-name">{group.name}</h3>
                    {group.description && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="group-actions">
                    <button
                      className="group-action-btn"
                      onClick={() => handleViewGroup(group)}
                    >
                      <span><i className="fa-solid fa-eye"></i></span> Xem nhóm
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
