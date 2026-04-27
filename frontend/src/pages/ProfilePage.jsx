import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, likePost, unlikePost, getUser, updateUser, uploadProfilePicture } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    bio: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userDataJson = localStorage.getItem('user');
        if (!userDataJson) {
          console.error('No user data found in localStorage');
          setCurrentUser(null);
          setError('Không thể tải thông tin người dùng');
          setLoading(false);
          return;
        }

        const userData = JSON.parse(userDataJson);
        
        // Fetch full user data from backend
        try {
          const fullUserData = await getUser(userData.Id || userData.id);
          setCurrentUser(fullUserData);
          setEditFormData({
            fullName: fullUserData.FullName || '',
            bio: fullUserData.Bio || ''
          });
        } catch (userErr) {
          console.error('Error loading user from backend:', userErr);
          // Fall back to localStorage data if backend fails
          setCurrentUser(userData);
          setEditFormData({
            fullName: userData.FullName || userData.fullName || '',
            bio: userData.Bio || userData.bio || ''
          });
        }

        // Load user's posts
        try {
          const postsData = await getPosts();
          setPosts((postsData || []).map((post) => ({
            ...post,
            commentsCount: commentsByPost[post.Id]?.length ?? 0
          })));
        } catch (postsErr) {
          console.error('Error loading posts:', postsErr);
          setError(`Failed to load posts: ${postsErr.message}`);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(`Error loading profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      fullName: currentUser?.FullName || currentUser?.fullName || '',
      bio: currentUser?.Bio || currentUser?.bio || ''
    });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must not exceed 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      const userId = currentUser.Id || currentUser.id;
      let updatedProfilePictureUrl = currentUser.ProfilePictureUrl || currentUser.profilePictureUrl || '';
      
      // First, upload profile picture if selected
      if (selectedFile) {
        try {
          const uploadedUser = await uploadProfilePicture(userId, selectedFile);
          updatedProfilePictureUrl = uploadedUser.ProfilePictureUrl;
          console.log('Profile picture uploaded:', uploadedUser);
        } catch (uploadErr) {
          console.error('Error uploading profile picture:', uploadErr);
          setError(`Failed to upload profile picture: ${uploadErr.message}`);
          setIsSaving(false);
          return;
        }
      }

      // Then, update other user info (fullName, bio)
      await updateUser(userId, {
        fullName: editFormData.fullName,
        bio: editFormData.bio,
        profilePictureUrl: updatedProfilePictureUrl
      });
      
      // Force reload user data from backend to ensure everything is synced
      try {
        const freshUserData = await getUser(userId);
        console.log('Fresh user data from backend:', freshUserData);
        
        const updatedUserState = {
          ...freshUserData,
          FullName: freshUserData.FullName || editFormData.fullName,
          fullName: freshUserData.FullName || editFormData.fullName,
          Bio: freshUserData.Bio || editFormData.bio,
          bio: freshUserData.Bio || editFormData.bio
        };
        
        setCurrentUser(updatedUserState);
        
        // Update localStorage with error handling
        try {
          localStorage.setItem('user', JSON.stringify(updatedUserState));
          // Dispatch event to notify Header and other components about user update
          window.dispatchEvent(new Event('userUpdated'));
        } catch (storageErr) {
          console.warn('localStorage save error (size limit?):', storageErr);
          // Even if localStorage fails, state is updated, so component will still display
        }
      } catch (reloadErr) {
        console.error('Error reloading user data:', reloadErr);
        // Fallback: use the local updated state
        const updatedUserState = {
          ...currentUser,
          FullName: editFormData.fullName,
          fullName: editFormData.fullName,
          Bio: editFormData.bio,
          bio: editFormData.bio,
          ProfilePictureUrl: updatedProfilePictureUrl,
          profilePictureUrl: updatedProfilePictureUrl
        };
        
        setCurrentUser(updatedUserState);
        
        try {
          localStorage.setItem('user', JSON.stringify(updatedUserState));
          // Dispatch event to notify Header and other components about user update
          window.dispatchEvent(new Event('userUpdated'));
        } catch (storageErr) {
          console.warn('localStorage save error (size limit?):', storageErr);
        }
      }
      
      setIsEditMode(false);
      setSelectedFile(null);
      setFilePreview(null);
      setError('');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async (post) => {
    if (!currentUser) {
      console.warn('No current user');
      return;
    }
    
    try {
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(currentUser.Id || currentUser.id);
      
      if (isLiked) {
        await unlikePost(post.Id, currentUser.Id || currentUser.id);
      } else {
        await likePost(post.Id, currentUser.Id || currentUser.id);
      }
      
      // Reload posts to get updated like count
      const postsData = await getPosts();
      setPosts(postsData || []);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.Id ? null : post.Id));
  };

  const handleAddComment = (postId, content) => {
    const newComment = {
      id: `${postId}-${Date.now()}`,
      userName: currentUser?.FullName || currentUser?.fullName || currentUser?.UserName || currentUser?.userName || 'Bạn',
      content,
      createdAt: 'Vừa xong',
      replies: []
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])]
    }));
  };

  const filteredPosts = selectedTab === 'all' 
    ? posts 
    : posts;

  if (loading) {
    return <div className="profile-wrapper"><p style={{padding: '20px', textAlign: 'center'}}>Đang tải...</p></div>;
  }

  if (!currentUser) {
    return (
      <div className="profile-wrapper">
        <Header onLogout={handleLogout} />
        <div className="profile-container">
          <div style={{background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#d32f2f'}}>
            <p style={{margin: '0 0 20px 0', fontSize: '16px'}}>Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.</p>
            <button onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('tokenUpdated'));
              navigate('/login');
            }} style={{padding: '10px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600'}}>
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <Header onLogout={handleLogout} />
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover"></div>
          
          <div className="profile-info-section">
            <div className="profile-avatar-large">
              {currentUser?.ProfilePictureUrl || currentUser?.profilePictureUrl ? (
                <img src={currentUser.ProfilePictureUrl || currentUser.profilePictureUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
            
            <div className="profile-user-info">
              <h1 className="profile-username">{currentUser?.FullName || currentUser?.fullName || currentUser?.UserName || currentUser?.userName}</h1>
              
              <div className="profile-bio">
                {currentUser?.Bio || currentUser?.bio ? (
                  <p>{currentUser.Bio || currentUser.bio}</p>
                ) : (
                  <p style={{color: '#999'}}>Chưa có tiểu sử</p>
                )}
              </div>

              <button className="profile-edit-btn" onClick={handleEditClick}>
                <span><i className="fa-solid fa-pen-nib"></i></span> Chỉnh sửa
              </button>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs">
            <button 
              className={`profile-tab ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              Tất cả
            </button>
            <button 
              className={`profile-tab ${selectedTab === 'friends' ? 'active' : ''}`}
              onClick={() => setSelectedTab('friends')}
            >
              Bạn bè
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditMode && (
          <div className="modal-overlay" onClick={handleCancelEdit}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Chỉnh sửa Hồ sơ</h2>
                <button className="modal-close" onClick={handleCancelEdit}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Họ và Tên:</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditInputChange}
                    placeholder="Nhập họ và tên"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio" className="form-label">Tiểu sử:</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleEditInputChange}
                    placeholder="Nói giới thiệu về bản thân"
                    className="form-input"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profilePicture" className="form-label">Ảnh Đại Diện:</label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-input-file"
                  />
                  <p style={{fontSize: '12px', color: '#999', marginTop: '8px'}}>
                    Chọn ảnh JPEG, PNG, GIF hoặc WebP (tối đa 5MB)
                  </p>
                </div>

                {filePreview && (
                  <div className="form-group">
                    <label>Xem trước ảnh:</label>
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      style={{maxWidth: '120px', maxHeight: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6b4fc7'}}
                    />
                  </div>
                )}

                {error && <div className="error-message" style={{marginTop: '10px'}}>{error}</div>}
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-cancel" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Posts */}
        <main className="profile-main-content">
          <div className="profile-posts">
            {filteredPosts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào</p>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.Id} className="profile-post-card">
                  <div className="post-header-profile">
                    <div className="post-user-info-profile">
                      <div className="post-avatar-profile"><i className="fa-solid fa-user"></i></div>
                      <div className="post-user-details-profile">
                        <p className="post-username-profile">{post.username || 'Người dùng'}</p>
                        <p className="post-time-profile">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <button className="post-menu-btn">⋯</button>
                  </div>

                  <div className="post-content-profile">
                    <p>{post.content}</p>
                    {post.hashtags && (
                      <div className="post-hashtags">
                        {post.hashtags.split(' ').map((tag, idx) => (
                          tag.startsWith('#') && (
                            <span key={idx} className="hashtag">{tag}</span>
                          )
                        ))}
                      </div>
                    )}
                  </div>

                  {post.imageUrl && (
                    <div className="post-images-profile">
                      <img src={post.imageUrl} alt="Post" className="post-image-profile" />
                    </div>
                  )}

                  <div className="post-stats-profile">
                    <span>❤️ {post.likesCount}</span>
                    <span><i className="fa-solid fa-comments"></i> {commentsByPost[post.Id]?.length ?? 0} Bình luận</span>
                  </div>

                  <div className="post-actions-profile">
                    <button 
                      className={`post-action-btn-profile ${(post.likedBy || []).includes(currentUser?.Id || currentUser?.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.Id || currentUser?.id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.Id || currentUser?.id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn-profile" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
                    </button>
                  </div>
                  {activeCommentPostId === post.Id && (
                    <CommentSection
                      post={post}
                      comments={commentsByPost[post.Id] || []}
                      onClose={() => setActiveCommentPostId(null)}
                      onAddComment={handleAddComment}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
