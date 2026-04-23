import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getAcceptedFriends, getAllUsers, createPost, getPendingRequests, likePost, unlikePost } from '../api';
import { getPostsForUser, getFriendsForUser, getLikedPostsForUser, updateUserData, getUserData, getAllUsers as getAllRegisteredUsers, addPost, addFriend } from '../utils/userDataManager';
import Header from '../components/Header';
import '../styles/HomePage.css';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [postType, setPostType] = useState('text');
  const [selectedNav, setSelectedNav] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        // Check if user is logged in
        if (!userData || !userData.id) {
          setError('Vui lòng đăng nhập');
          setLoading(false);
          return;
        }
        
        setCurrentUser(userData);

        // Load user's posts
        let userPosts = getPostsForUser(userData.id);
        
        // Update userName for all posts to match current user's fullName
        userPosts = userPosts.map(p => ({
          ...p,
          userName: userData.fullName,
          username: userData.fullName
        }));
        
        // Apply liked posts from user's data and total likes from storage
        const userLikedPosts = getLikedPostsForUser(userData.id);
        const updatedPostsData = userPosts.map(p => {
          const totalLikes = getTotalLikesForPost(p.id);
          return {
            ...p,
            likedBy: userLikedPosts[p.id] || [],
            likesCount: totalLikes > 0 ? totalLikes : p.likesCount
          };
        });
        setPosts(updatedPostsData);

        // Load user's friends
        const userFriends = getFriendsForUser(userData.id);
        setFriends(userFriends);

        // Load all registered users as suggested users
        const registeredUsers = getAllRegisteredUsers();
        const currentUserFriendIds = userFriends.map(f => f.id);
        const suggested = registeredUsers
          .filter(u => u.id !== userData.id && !currentUserFriendIds.includes(u.id))
          .slice(0, 5)
          .map(u => ({
            id: u.id,
            fullName: u.fullName,
            userName: u.userName,
            avatar: '👤'
          }));
        setSuggestedUsers(suggested);
        setAllUsers(registeredUsers);

        // Load stories from friends
        const friendStories = userFriends.map((friend, idx) => ({
          id: friend.id,
          userName: friend.name || friend.fullName || `Bạn ${idx + 1}`,
          createdAt: new Date().toISOString()
        }));
        setStories(friendStories);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage.trim()) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: newPostContent,
        imageUrl: newPostImage || null,
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        avatar: '👤',
        likesCount: 0,
        commentsCount: 0,
        likedBy: []
      };
      
      // Add post to user data
      addPost(currentUser.id, newPost);
      
      // Save total likes for this new post
      saveTotalLikesForPost(newPost.id, 0);
      
      setNewPostContent('');
      setNewPostImage('');
      setPostType('text');
      
      // Add new post to the beginning of the list
      setPosts([newPost, ...posts]);
      console.log('Post created successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddFriend = (userToAdd) => {
    if (!currentUser) return;
    
    try {
      // Add friend to current user's friends list
      addFriend(currentUser.id, {
        id: userToAdd.id,
        fullName: userToAdd.fullName,
        userName: userToAdd.userName,
        avatar: '👤'
      });
      
      // Update local friends state
      const newFriends = [...friends, {
        id: userToAdd.id,
        fullName: userToAdd.fullName,
        userName: userToAdd.userName,
        avatar: '👤'
      }];
      setFriends(newFriends);
      
      // Reload suggested users to remove the just-added friend
      const registeredUsers = getAllRegisteredUsers();
      const currentUserFriendIds = newFriends.map(f => f.id);
      const suggested = registeredUsers
        .filter(u => u.id !== currentUser.id && !currentUserFriendIds.includes(u.id))
        .slice(0, 5)
        .map(u => ({
          id: u.id,
          fullName: u.fullName,
          userName: u.userName,
          avatar: '👤'
        }));
      setSuggestedUsers(suggested);
    } catch (err) {
      console.error('Error adding friend:', err);
    }
  };

  // Helper function to get total likes for a post from all users
  const getTotalLikesForPost = (postId) => {
    const likeCounts = JSON.parse(localStorage.getItem('post_likes') || '{}');
    return likeCounts[postId] || 0;
  };

  // Helper function to save total likes for a post
  const saveTotalLikesForPost = (postId, count) => {
    const likeCounts = JSON.parse(localStorage.getItem('post_likes') || '{}');
    if (count > 0) {
      likeCounts[postId] = count;
    } else {
      delete likeCounts[postId];
    }
    localStorage.setItem('post_likes', JSON.stringify(likeCounts));
  };

  const handleLike = async (post) => {
    if (!currentUser) {
      console.warn('No current user');
      return;
    }
    
    try {
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(currentUser.id);
      
      // Get current user data
      const userData = getUserData(currentUser.id);
      const likedPosts = userData.likedPosts || {};
      
      let newLikesCount = post.likesCount || 0;
      
      // Update liked posts
      if (isLiked) {
        if (likedPosts[post.id]) {
          likedPosts[post.id] = likedPosts[post.id].filter(id => id !== currentUser.id);
          if (likedPosts[post.id].length === 0) {
            delete likedPosts[post.id];
          }
        }
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        if (!likedPosts[post.id]) {
          likedPosts[post.id] = [];
        }
        if (!likedPosts[post.id].includes(currentUser.id)) {
          likedPosts[post.id].push(currentUser.id);
        }
        newLikesCount = newLikesCount + 1;
      }
      
      // Update user data
      updateUserData(currentUser.id, { likedPosts });
      
      // Save total likes count for this post
      saveTotalLikesForPost(post.id, newLikesCount);
      
      // Update local posts state
      const updatedPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            likedBy: likedPosts[p.id] || [],
            likesCount: newLikesCount
          };
        }
        return p;
      });
      setPosts(updatedPosts);
      
      console.log('Like/Unlike successful');
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  if (loading) {
    return <div className="home-container"><p>Đang tải...</p></div>;
  }

  if (error) {
    return (
      <div className="home-container">
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Lỗi:</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>Quay lại đăng nhập</button>
        </div>
      </div>
    );
  }

  // Debug: log all users
  console.log('=== DEBUG: All Users ===');
  console.log('Total allUsers:', allUsers.length);
  console.log('allUsers content:', allUsers);
  console.log('Current user:', currentUser);
  console.log('Current user ID:', currentUser?.id);
  console.log('Friends:', friends);
  console.log('Search Query:', searchQuery);

  const filteredUsersList = searchQuery.trim() ? 
    allUsers.filter(u => 
      u.id !== currentUser?.id &&
      !friends.some(f => f.id === u.id) &&
      (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : suggestedUsers;

  console.log('Final filtered users list:', filteredUsersList);

  return (
    <div className="home-wrapper">
      <Header onLogout={handleLogout} />
      <div className="home-container">
        {/* Left Sidebar */}
        <aside className="sidebar-left">
          <nav className="sidebar-nav">
            <div className={`nav-item ${selectedNav === 'friends' ? 'active' : ''}`} onClick={() => setSelectedNav('friends')}>
              <span className="nav-icon">👥</span>
              <span>Tất cả bạn bè</span>
            </div>
            <div className={`nav-item ${selectedNav === 'requests' ? 'active' : ''}`} onClick={() => setSelectedNav('requests')}>
              <span className="nav-icon">📬</span>
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
                <div className="avatar-placeholder">👤</div>
              </div>
              <p className="create-post-prompt">
                Bạn đang nghĩ gì? Hãy chia sẻ cảm nghĩ của bạn đến bạn bè thông qua...
              </p>
            </div>

            <div className="create-post-tabs">
              <button 
                className={`tab ${postType === 'text' ? 'active' : ''}`}
                onClick={() => setPostType('text')}
              >
                <span className="tab-icon">📝</span>
                <span>Văn bản</span>
              </button>
              <button 
                className={`tab ${postType === 'image' ? 'active' : ''}`}
                onClick={() => setPostType('image')}
              >
                <span className="tab-icon">🖼️</span>
                <span>Hình ảnh</span>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="create-post-form">
              {postType === 'text' ? (
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                  className="post-textarea"
                  rows="4"
                />
              ) : (
                <div className="image-input-wrapper">
                  <input
                    type="text"
                    value={newPostImage}
                    onChange={(e) => setNewPostImage(e.target.value)}
                    placeholder="Nhập URL hình ảnh"
                    className="post-image-input"
                  />
                  {newPostImage && (
                    <img src={newPostImage} alt="Preview" className="image-preview" />
                  )}
                </div>
              )}
              <button 
                type="submit" 
                className="btn-post"
                disabled={posting}
              >
                {posting ? 'Đang đăng...' : 'Đăng'}
              </button>
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
                  <div 
                    key={story.id} 
                    className="story-card"
                    onClick={() => navigate('/story')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="story-background"></div>
                    <div className="story-avatar">👤</div>
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
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar">👤</div>
                      <div className="post-user-details">
                        <p className="post-username">{post.userName || post.username || 'Người dùng'}</p>
                        <p className="post-time">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="post-content">
                    <p>{post.content}</p>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="Post" className="post-image" />
                    )}
                  </div>

                  <div className="post-stats">
                    <span>❤️ {post.likesCount} lượt thích</span>
                    <span>💬 {post.commentsCount} bình luận</span>
                  </div>

                  <div className="post-actions">
                    <button 
                      className={`post-action-btn ${(post.likedBy || []).includes(currentUser?.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn">
                      <span>💬</span> Bình luận
                    </button>
                    <button className="post-action-btn">
                      <span>↗️</span> Chia sẻ
                    </button>
                  </div>
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
                  <span className="search-icon">🔍</span>
                </div>
                
                <div className="search-results">
                  {filteredUsersList.length > 0 ? (
                    <>
                      {searchQuery.trim() === '' && <h4 className="suggestions-title">Gợi ý bạn bè</h4>}
                      {filteredUsersList.map(user => (
                        <div key={user.id} className="suggested-friend-card">
                          <div className="friend-avatar">👤</div>
                          <p className="friend-name">{user.fullName}</p>
                          <button 
                            className="btn-add-friend"
                            onClick={() => handleAddFriend(user)}
                          >
                            Kết bạn
                          </button>
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
                        <div className="friend-avatar-small">👤</div>
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
                    <div key={friend.id} className="friend-item">
                      <div className="friend-avatar-small">👤</div>
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
