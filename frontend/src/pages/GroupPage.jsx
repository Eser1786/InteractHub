import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupMembershipsForUser } from '../utils/userDataManager';
import Header from '../components/Header';
import '../styles/GroupPage.css';

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [selectedNav, setSelectedNav] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Mock groups data
    const mockGroups = [
      {
        id: '1',
        name: 'Nhóm lập trình Java',
        slug: 'nhom-lap-trinh-java',
        description: 'Vừa vào',
        images: ['img1', 'img2', 'img3'],
        likes: 5,
        comments: 36,
        isJoined: true
      },
      {
        id: '2',
        name: 'Nhóm giải tích',
        slug: 'nhom-giai-tich',
        description: '2 tuần trước',
        images: ['img1', 'img2', 'img3'],
        likes: 5,
        comments: 36,
        isJoined: true
      },
      {
        id: '3',
        name: 'Nhóm thiết kế đồ họa',
        slug: 'nhom-thiet-ke-do-hoa',
        description: '1 ngày trước',
        images: ['img1', 'img2', 'img3'],
        likes: 12,
        comments: 48,
        isJoined: false
      },
      {
        id: '4',
        name: 'Nhóm phát triển web',
        slug: 'nhom-phat-trien-web',
        description: '3 ngày trước',
        images: ['img1', 'img2', 'img3'],
        likes: 8,
        comments: 24,
        isJoined: false
      }
    ];

    // Load user's group memberships from userDataManager
    const userGroupMemberships = getGroupMembershipsForUser(userData.id);
    const userGroupIds = userGroupMemberships.map(g => g.id);
    
    // Update isJoined status based on user's memberships
    const updatedGroups = mockGroups.map(g => ({
      ...g,
      isJoined: userGroupIds.includes(g.id)
    }));

    setGroups(updatedGroups);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
            <span className="group-search-icon">🔍</span>
          </div>

          <nav className="group-nav">
            <div 
              className={`group-nav-item ${selectedNav === 'my-groups' ? 'active' : ''}`}
              onClick={() => setSelectedNav('my-groups')}
            >
              <span className="group-nav-icon">👥</span>
              <span>Nhóm của bạn</span>
            </div>
            <div 
              className={`group-nav-item ${selectedNav === 'discover' ? 'active' : ''}`}
              onClick={() => setSelectedNav('discover')}
            >
              <span className="group-nav-icon">🔍</span>
              <span>Khám phá</span>
            </div>
            <div 
              className="group-nav-item create-group"
              onClick={() => navigate('/creategroup')}
              style={{ cursor: 'pointer' }}
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
                      className={`group-action-btn view-btn ${selectedNav === 'discover' && !group.isJoined ? 'join-btn' : ''}`}
                      onClick={() => navigate(`/group/${group.slug || group.name.toLowerCase().replace(/\s+/g, '-')}`)}
                    >
                      <span>{selectedNav === 'discover' && !group.isJoined ? '➕' : '👁️'}</span> 
                      {selectedNav === 'discover' && !group.isJoined ? 'Tham gia' : 'Xem'}
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
