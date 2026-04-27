import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getAcceptedFriends, getAllUsers, createPost, getPendingRequests, likePost, unlikePost, deletePost } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import '../styles/HomePage.css';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFile, setNewPostFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [selectedNav, setSelectedNav] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [stories, setStories] = useState([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const navigate = useNavigate();

  const loadPosts = async (userData) => {
    try {
      const postsData = await getPosts();
      // Get commentsByPost from localStorage to ensure we have latest data
      const commentsByPostData = JSON.parse(localStorage.getItem('postComments') || '{}');
      setPosts((postsData || []).map((post) => ({
        ...post,
        commentsCount: commentsByPostData[post.Id]?.length ?? 0
      })));

      // Initialize liked posts from response data
      const userLikedPostIds = (postsData || [])
        .filter(post => post.LikedByUserIds && post.LikedByUserIds.includes(userData.Id))
        .map(post => post.Id);
      setLikedPosts(new Set(userLikedPostIds));
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userDataJson = localStorage.getItem('user');
        if (!userDataJson) {
          throw new Error('User data not found. Please login again.');
        }

        const userData = JSON.parse(userDataJson);
        setCurrentUser(userData);
        
        // Debug logging for avatar
        console.log('HomePage - currentUser loaded:', {
          id: userData.Id,
          name: userData.UserName,
          ProfilePictureUrl: userData.ProfilePictureUrl,
          profilePictureUrl: userData.profilePictureUrl
        });

        await loadPosts(userData);

        const friendsData = await getAcceptedFriends(userData.Id, 1, 10);
        setFriends(friendsData || []);

        const requestsData = await getPendingRequests(userData.Id, 1, 20);
        setPendingRequests(requestsData || []);

        const allUsersData = await getAllUsers();
        setAllUsers(allUsersData || []);
        const friendIds = ((friendsData || []).map(f => f.friendId));
        const suggested = (allUsersData || []).filter(
          u => u.Id !== userData.Id && !friendIds.includes(u.Id)
        ).slice(0, 5);
        setSuggestedUsers(suggested);

        // Load stories from friends
        const friendStories = ((friendsData || []).map((friend, idx) => ({
          id: friend.friendId,
          userName: friend.friendName || `Bạn ${idx + 1}`,
          createdAt: new Date().toISOString()
        })));
        setStories(friendStories);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for user data updates from other components (e.g., profile page)
    const handleUserUpdate = async () => {
      const userDataJson = localStorage.getItem('user');
      if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        setCurrentUser(userData);
        // Reload posts to reflect updated user name in post author info
        console.log('User updated - reloading posts with new user name');
        await loadPosts(userData);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      setError('Kích thước hình ảnh không được vượt quá 5MB');
      return;
    }
    
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ các định dạng: JPEG, PNG, GIF, WebP');
      return;
    }

    // Read file as Base64
    const reader = new FileReader();
    reader.onload = () => {
      setNewPostFile(file);
      setPostImagePreview(reader.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Lỗi đọc tệp hình ảnh');
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostFile) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      let imageBase64 = null;
      if (newPostFile) {
        imageBase64 = postImagePreview;
      }

      const newPost = await createPost({
        content: newPostContent,
        imageUrl: imageBase64
      });
      
      console.log('Post created successfully:', newPost);
      
      setNewPostContent('');
      setNewPostFile(null);
      setPostImagePreview('');
      
      // Add new post to the beginning of the list
      if (newPost) {
        setPosts([newPost, ...posts]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating post:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const handleLike = async (post) => {
    if (!currentUser) {
      console.warn('No current user');
      return;
    }
    
    try {
      const isLiked = likedPosts.has(post.Id);
      console.log('Like status:', { postId: post.Id, userId: currentUser.Id, isLiked });
      
      if (isLiked) {
        // Unlike
        await unlikePost(post.Id, currentUser.Id);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.Id);
          return newSet;
        });
      } else {
        // Like
        await likePost(post.Id, currentUser.Id);
        setLikedPosts(prev => new Set(prev).add(post.Id));
      }
      
      // Reload posts to get updated like count
      const postsData = await getPosts();
      if (postsData) {
        setPosts(postsData);
        // Update likedPosts Set based on fresh data from backend
        const userLikedPostIds = postsData
          .filter(post => post.LikedByUserIds && post.LikedByUserIds.includes(currentUser.Id))
          .map(post => post.Id);
        setLikedPosts(new Set(userLikedPostIds));
      }
      console.log('Posts updated after like/unlike');
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.Id ? null : post.Id));
  };

  const handleAddComment = (postId, content) => {
    console.log('handleAddComment - currentUser:', currentUser);
    
    const newComment = {
      id: `${postId}-${Date.now()}`,
      userId: currentUser?.Id || currentUser?.id,
      userName: currentUser?.FullName || currentUser?.fullName || currentUser?.UserName || currentUser?.userName || 'User',
      userProfilePictureUrl: currentUser?.ProfilePictureUrl || currentUser?.profilePictureUrl || null,
      content,
      createdAt: 'Vừa xong',
      replies: [],
      likes: []
    };

    console.log('New comment created:', newComment);

    setCommentsByPost((prev) => {
      const updated = {
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])]
      };
      localStorage.setItem('postComments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteComment = (postId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    setCommentsByPost((prev) => {
      const updated = {
        ...prev,
        [postId]: (prev[postId] || []).filter(comment => comment.id !== commentId)
      };
      localStorage.setItem('postComments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditComment = (postId, commentId, newContent) => {
    setCommentsByPost((prev) => {
      const updated = {
        ...prev,
        [postId]: (prev[postId] || []).map(comment =>
          comment.id === commentId
            ? { ...comment, content: newContent }
            : comment
        )
      };
      localStorage.setItem('postComments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeletePost = async (post) => {
    if (post.UserId !== currentUser?.Id) {
      setError('Bạn chỉ có thể xóa bài viết của chính mình');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      await deletePost(post.Id);
      setPosts(posts.filter(p => p.Id !== post.Id));
      setActivePostMenuId(null);
      setError('');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(`Lỗi xóa bài viết: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="home-container"><p>Đang tải...</p></div>;
  }

  // Debug: log all users
  console.log('=== DEBUG: All Users ===');
  console.log('Total users:', allUsers.length);
  console.log('All users:', allUsers);
  console.log('Current user:', currentUser);
  console.log('Friends:', friends);

  const filteredUsers = searchQuery.trim() ? 
    allUsers.filter(u => 
      u.Id !== currentUser?.Id &&
      !friends.some(f => f.friendId === u.Id) &&
      (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : suggestedUsers;

  console.log('Search query:', searchQuery);
  console.log('Filtered users:', filteredUsers);

  return (
    <div className="home-wrapper">
      <Header onLogout={handleLogout} />
      <div className="home-container">
        {/* Left Sidebar */}
        <aside className="sidebar-left">
          <nav className="sidebar-nav">
            <div className={`nav-item ${selectedNav === 'friends' ? 'active' : ''}`} onClick={() => setSelectedNav('friends')}>
              <span className="nav-icon"><i class="fa-solid fa-people-pulling"></i></span>
              <span>Tất cả bạn bè</span>
            </div>
            <div className={`nav-item ${selectedNav === 'requests' ? 'active' : ''}`} onClick={() => setSelectedNav('requests')}>
              <span className="nav-icon"><i class="fa-solid fa-address-book"></i></span>
              <span>Lời mời kết bạn</span>
            </div>
            <div className={`nav-item ${selectedNav === 'add-friends' ? 'active' : ''}`} onClick={() => setSelectedNav('add-friends')}>
              <span className="nav-icon">➕</span>
              <span>Thêm bạn bè</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {error && <div className="error-message">{error}</div>}

          <section className="create-post-section">
            <div className="create-post-header">
              <div className="user-avatar">
                {currentUser?.ProfilePictureUrl ? (
                  <img 
                    src={currentUser.ProfilePictureUrl} 
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.warn('Failed to load avatar image:', currentUser.ProfilePictureUrl);
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
                Bạn đang nghĩ gì? Hãy chia sẻ cảm nghĩ của bạn đến bạn bè thông qua...
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
                  <label htmlFor="post-image-input" className="file-input-label">
                    <i className="fa-solid fa-image"></i>
                    <span>Thêm hình ảnh</span>
                  </label>
                  <input
                    id="post-image-input"
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


          {/* Stories Section - Only show if there are stories or always show create story */}
          {friends.length > 0 || stories.length > 0 ? (
            <section className="stories-section">
              <div className="stories-carousel">
                {/* Create Story Card */}
                <div className="story-card create-story-card">
                  <div className="story-create-icon">+</div>
                  <p className="story-label">Tạo tin</p>
                </div>

                {/* Friend Stories */}
                {stories.map((story) => (
                  <div key={story.id} className="story-card">
                    <div className="story-background"></div>
                    <div className="story-avatar"><i className="fa-solid fa-user"></i></div>
                    <p className="story-label">{story.userName}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="posts-feed">
            {posts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
            ) : (
              posts.map((post) => (
                <div key={post.Id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar">
                        {post.UserProfilePictureUrl ? (
                          <img 
                            src={post.UserProfilePictureUrl} 
                            alt="User Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <i className="fa-solid fa-user"></i>
                        )}
                      </div>
                      <div className="post-user-details">
                        <p className="post-username">{post.UserFullName || post.UserName || 'Người dùng'}</p>
                        <p className="post-time">
                          {new Date(post.CreatedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="post-menu-container">
                      <button 
                        className="post-menu-btn" 
                        onClick={() => setActivePostMenuId(activePostMenuId === post.Id ? null : post.Id)}
                      >
                        ⋯
                      </button>
                      {activePostMenuId === post.Id && currentUser?.Id === post.UserId && (
                        <div className="post-menu-dropdown">
                          <button 
                            className="menu-item"
                            onClick={() => handleDeletePost(post)}
                          >
                            <i className="fa-solid fa-trash"></i> Xóa bài viết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="post-content">
                    <p>{post.Content}</p>
                    {post.ImageUrl && (
                      <img src={post.ImageUrl} alt="Post" className="post-image" />
                    )}
                  </div>

                  <div className="post-stats">
                    <span>❤️ {post.LikesCount} lượt thích</span>
                    <span><i className="fa-solid fa-comments"></i> {(commentsByPost[post.Id]?.length ?? 0)} bình luận</span>
                  </div>

                  <div className="post-actions">
                    <button 
                      className={`post-action-btn ${likedPosts.has(post.Id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{likedPosts.has(post.Id) ? '❤️' : '🤍'}</span> 
                      {likedPosts.has(post.Id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
                    </button>
                    <button className="post-action-btn">
                      <span><i class="fa-solid fa-share"></i></span> Chia sẻ
                    </button>
                  </div>
                  {activeCommentPostId === post.Id && (
                    <CommentSection
                      post={post}
                      comments={commentsByPost[post.Id] || []}
                      onClose={() => setActiveCommentPostId(null)}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      onEditComment={handleEditComment}
                      currentUser={currentUser}
                    />
                  )}
                </div>
              ))
            )}
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
          {selectedNav === 'add-friends' ? (
            <>
              <h3 className="sidebar-title">Thêm bạn bè</h3>
              <div className="add-friends-container">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="Tìm bạn bè..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="add-friends-search"
                  />
                  <span className="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
                </div>
                
                <div className="search-results">
                  {filteredUsers.length > 0 ? (
                    <>
                      {searchQuery.trim() === '' && <h4 className="suggestions-title">Gợi ý bạn bè</h4>}
                      {filteredUsers.map(user => (
                        <div key={user.id} className="suggested-friend-card">
                          <div className="friend-avatar"><i className="fa-solid fa-user"></i></div>
                          <p className="friend-name">{user.fullName}</p>
                          <button className="btn-add-friend">Kết bạn</button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="no-results">
                      {searchQuery.trim() ? 'Không tìm thấy người dùng' : 'Không có gợi ý bạn bè'}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : selectedNav === 'requests' ? (
            <>
              <h3 className="sidebar-title">Lời mời kết bạn</h3>
              <div className="friends-list">
                {pendingRequests.length === 0 ? (
                  <p className="no-friends">Hiện chưa có lời mời kết bạn</p>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="friend-request-item">
                      <div className="request-header">
                        <div className="friend-avatar-small"><i className="fa-solid fa-user"></i></div>
                        <p className="friend-name-small">{request.requesterName || 'Người dùng'}</p>
                      </div>
                      <div className="request-actions">
                        <button className="btn-accept">Xác nhận</button>
                        <button className="btn-reject">Xóa bỏ</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="sidebar-title">Danh sách bạn bè</h3>
              <div className="friends-list">
                {friends.length === 0 ? (
                  <p className="no-friends">Chưa có bạn bè</p>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.Id} className="friend-item">
                      <div className="friend-avatar-small"><i className="fa-solid fa-user"></i></div>
                      <p className="friend-name-small">{friend.friendName || 'Bạn'}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
