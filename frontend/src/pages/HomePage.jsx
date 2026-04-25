import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getAcceptedFriends, getAllUsers, createPost, getPendingRequests, likePost, unlikePost } from '../api';
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
  const [newPostImage, setNewPostImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [postType, setPostType] = useState('text');
  const [selectedNav, setSelectedNav] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [stories, setStories] = useState([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(userData);

        const postsData = await getPosts();
        setPosts((postsData || []).map((post) => ({
          ...post,
          commentsCount: commentsByPost[post.id]?.length ?? 0
        })));

        const friendsData = await getAcceptedFriends(userData.id, 1, 10);
        setFriends(friendsData?.Data || []);

        const requestsData = await getPendingRequests(userData.id, 1, 20);
        setPendingRequests(requestsData || []);

        const allUsersData = await getAllUsers();
        setAllUsers(allUsersData);
        const friendIds = (friendsData?.Data || []).map(f => f.friendId);
        const suggested = allUsersData.filter(
          u => u.id !== userData.id && !friendIds.includes(u.id)
        ).slice(0, 5);
        setSuggestedUsers(suggested);

        // Load stories from friends
        const friendStories = (friendsData?.Data || []).map((friend, idx) => ({
          id: friend.friendId,
          userName: friend.friendName || `Bạn ${idx + 1}`,
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

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage.trim()) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      const newPost = await createPost({
        content: newPostContent,
        imageUrl: newPostImage
      });
      
      setNewPostContent('');
      setNewPostImage('');
      setPostType('text');
      
      // Add new post to the beginning of the list with current timestamp
      if (newPost) {
        setPosts([newPost, ...posts]);
      }
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

  const handleLike = async (post) => {
    if (!currentUser) {
      console.warn('No current user');
      return;
    }
    
    try {
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(currentUser.id);
      console.log('Like status:', { postId: post.id, userId: currentUser.id, isLiked, likedBy });
      
      if (isLiked) {
        await unlikePost(post.id, currentUser.id);
      } else {
        await likePost(post.id, currentUser.id);
      }
      
      // Reload posts to get updated like count
      const postsData = await getPosts();
      setPosts(postsData || []);
      console.log('Posts updated after like/unlike');
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.id ? null : post.id));
  };

  const handleAddComment = (postId, content) => {
    const newComment = {
      id: `${postId}-${Date.now()}`,
      userName: currentUser?.fullName || currentUser?.userName || 'Bạn',
      content,
      createdAt: 'Vừa xong',
      replies: []
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])]
    }));
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
      u.id !== currentUser?.id &&
      !friends.some(f => f.friendId === u.id) &&
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
                <div className="avatar-placeholder"><i className="fa-solid fa-user"></i></div>
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
                <span className="tab-icon"><i className="fa-solid fa-pen"></i></span>
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
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar"><i className="fa-solid fa-user"></i></div>
                      <div className="post-user-details">
                        <p className="post-username">{post.username || 'Người dùng'}</p>
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
                    <span><i className="fa-solid fa-comments"></i> {(commentsByPost[post.id]?.length ?? 0)} bình luận</span>
                  </div>

                  <div className="post-actions">
                    <button 
                      className={`post-action-btn ${(post.likedBy || []).includes(currentUser?.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
                    </button>
                    <button className="post-action-btn">
                      <span>↗️</span> Chia sẻ
                    </button>
                  </div>
                  {activeCommentPostId === post.id && (
                    <CommentSection
                      post={post}
                      comments={commentsByPost[post.id] || []}
                      onClose={() => setActiveCommentPostId(null)}
                      onAddComment={handleAddComment}
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
                  <span className="search-icon">🔍</span>
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
                    <div key={friend.id} className="friend-item">
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
