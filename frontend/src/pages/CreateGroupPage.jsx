import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/CreateGroupPage.css';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [commentInput, setCommentInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    // Initialize with current user as first member
    if (userData) {
      setMembers([userData]);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddMember = () => {
    // Add mock member
    const newMember = {
      id: Math.random().toString(),
      fullName: 'Thành viên mới',
      userName: 'member' + Math.random()
    };
    setMembers([...members, newMember]);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }
    alert(`Tạo nhóm "${groupName}" thành công!`);
    // Navigate back to group page after creating
    navigate('/group');
  };

  return (
    <div className="create-group-wrapper">
      <Header onLogout={handleLogout} />
      
      <div className="create-group-container">
        {/* Left Sidebar */}
        <aside className="create-group-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Tạo Nhóm</h3>
          </div>

          {/* Current User */}
          <div className="member-item current-member">
            <div className="member-avatar"><i className="fa-solid fa-user"></i></div>
            <div className="member-info">
              <p className="member-name">{currentUser?.fullName || 'Người dùng'}</p>
              <p className="member-status">Quản lý nhóm</p>
            </div>
          </div>

          {/* Search Members */}
          <input
            type="text"
            placeholder="Nhập tên nhóm"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-name-input"
          />

          {/* Invite Button */}
          <button className="btn-invite" onClick={handleAddMember}>
            <span>➕</span> Mời bạn bè
          </button>

          {/* Additional Members */}
          {members.slice(1).map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-avatar"><i className="fa-solid fa-user"></i></div>
              <div className="member-info">
                <p className="member-name">{member.fullName}</p>
              </div>
            </div>
          ))}

          {/* Create Button */}
          <button className="btn-create-group" onClick={handleCreateGroup}>
            Tạo
          </button>
        </aside>

        {/* Main Content */}
        <main className="create-group-main">
          {/* Group Cover Image */}
          <div className="group-cover">
            {groupImage ? (
              <img src={groupImage} alt="Group cover" />
            ) : (
              <div className="cover-placeholder">
                <input
                  type="text"
                  value={groupImage}
                  onChange={(e) => setGroupImage(e.target.value)}
                  placeholder="Nhập URL ảnh bìa"
                  className="cover-image-input"
                />
              </div>
            )}
          </div>

          {/* Group Info */}
          <div className="group-info-section">
            <h2 className="group-display-name">{groupName || 'Tên nhóm'}</h2>
            <p className="group-member-count">{members.length} thành viên</p>

            {/* Tabs */}
            <div className="group-tabs">
              <button
                className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTab('all')}
              >
                Tất cả
              </button>
              <button
                className={`tab ${selectedTab === 'intro' ? 'active' : ''}`}
                onClick={() => setSelectedTab('intro')}
              >
                Giới thiệu
              </button>
              <button
                className={`tab ${selectedTab === 'posts' ? 'active' : ''}`}
                onClick={() => setSelectedTab('posts')}
              >
                Bài viết
              </button>
              <button className="tab-menu">⋮</button>
            </div>

            {/* Comment Section */}
            <div className="comment-section">
              <div className="comment-input-wrapper">
                <div className="comment-avatar"><i className="fa-solid fa-user"></i></div>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Bạn đang nghĩ gì?"
                  className="comment-input"
                />
              </div>
              <button className="btn-submit-comment">Thêm bài viết</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
