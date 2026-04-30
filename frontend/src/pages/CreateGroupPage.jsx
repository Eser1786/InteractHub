import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../api';
import { useGroups } from '../contexts/GroupsContext';
import Header from '../components/Header';
import '../styles/CreateGroupPage.css';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFile, setNewPostFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [posting, setPosting] = useState(false);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert('Vui lòng chọn ảnh JPEG, PNG, GIF hoặc WebP');
      return;
    }

    if (file.size > maxSize) {
      alert('Kích thước ảnh không vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPostFile(file);
      setPostImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImagePreview) {
      alert('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      // Here you would typically call API to create a post
      // For now, just reset the form
      setNewPostContent('');
      setNewPostFile(null);
      setPostImagePreview('');
      alert('Bài viết đã được tạo thành công!');
    } catch (err) {
      alert('Lỗi khi tạo bài viết');
      console.error(err);
    } finally {
      setPosting(false);
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
          <div className="group-info-section">
            <h2 className="group-display-name">{groupName || 'Tên nhóm'}</h2>
            <p className="group-member-count">1 thành viên</p>

            <section className="create-post-section">
              <div className="create-post-header">
                <div className="user-avatar">
                  {currentUser?.ProfilePictureUrl ? (
                    <img 
                      src={currentUser.ProfilePictureUrl} 
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className="avatar-placeholder" style={{ display: currentUser?.ProfilePictureUrl ? 'none' : 'flex' }}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                </div>
                <p className="create-post-prompt">
                  Bạn đang nghĩ gì? Hãy chia sẻ cảm nghĩ của bạn đến thành viên nhóm...
                </p>
              </div>

              <form onSubmit={handleCreatePost} className="create-post-form">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  className="post-textarea"
                  rows="4"
                />
                
                <div className="post-form-bottom">
                  <div className="file-input-wrapper">
                    <label htmlFor="create-post-image-input" className="file-input-label">
                      <i className="fa-solid fa-image"></i>
                      <span>Thêm hình ảnh</span>
                    </label>
                    <input
                      id="create-post-image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="post-file-input"
                    />
                    {newPostFile && (
                      <span className="file-selected">
                        ✓ {newPostFile.name}
                      </span>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="btn-post"
                    disabled={posting}
                  >
                    {posting ? 'Đang đăng...' : 'Đăng'}
                  </button>
                </div>
                
                {postImagePreview && (
                  <div className="post-image-preview-wrapper">
                    <img src={postImagePreview} alt="Preview" className="post-image-preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostFile(null);
                        setPostImagePreview('');
                      }}
                      className="btn-remove-image"
                    >
                      ✕ Xóa hình ảnh
                    </button>
                  </div>
                )}
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
