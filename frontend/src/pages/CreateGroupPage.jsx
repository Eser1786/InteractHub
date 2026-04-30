import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../api';
import { useGroups } from '../contexts/GroupsContext';
import Header from '../components/Header';
import '../styles/CreateGroupPage.css';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [commentInput, setCommentInput] = useState('');
  const navigate = useNavigate();
  const { refreshGroups } = useGroups();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setCurrentUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    try {
      await createGroup({ name: groupName.trim(), description: '' });
      await refreshGroups();
      alert(`Tạo nhóm "${groupName}" thành công!`);
      navigate('/group');
    } catch (err) {
      console.error('Failed to create group', err);
      alert('Tạo nhóm thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="create-group-wrapper">
      <Header onLogout={handleLogout} />
      
      <div className="create-group-container">
        <aside className="create-group-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Tạo Nhóm</h3>
          </div>

          <div className="member-item current-member">
            <div className="member-avatar"><i className="fa-solid fa-user"></i></div>
            <div className="member-info">
              <p className="member-name">{currentUser?.FullName || currentUser?.fullName || 'Người dùng'}</p>
              <p className="member-status">Quản lý nhóm</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Nhập tên nhóm"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-name-input"
          />

          <button className="btn-create-group" onClick={handleCreateGroup}>
            Tạo
          </button>
        </aside>

        <main className="create-group-main">
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

          <div className="group-info-section">
            <h2 className="group-display-name">{groupName || 'Tên nhóm'}</h2>
            <p className="group-member-count">1 thành viên</p>

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
