import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, likePost, unlikePost } from '../api';
import Header from '../components/Header';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(userData);

        // Load user's posts
        const postsData = await getPosts();
        
        // Apply localStorage likes to posts
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
        const updatedPostsData = (postsData || []).map(p => ({
          ...p,
          likedBy: likedPosts[p.id] || []
        }));
        setPosts(updatedPostsData || []);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      
      // Update likes in localStorage
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
      if (isLiked) {
        await unlikePost(post.id, currentUser.id);
        // Remove from localStorage
        if (likedPosts[post.id]) {
          likedPosts[post.id] = likedPosts[post.id].filter(id => id !== currentUser.id);
          if (likedPosts[post.id].length === 0) {
            delete likedPosts[post.id];
          }
        }
      } else {
        await likePost(post.id, currentUser.id);
        // Add to localStorage
        if (!likedPosts[post.id]) {
          likedPosts[post.id] = [];
        }
        if (!likedPosts[post.id].includes(currentUser.id)) {
          likedPosts[post.id].push(currentUser.id);
        }
      }
      localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
      
      // Reload posts to get updated like count
      const postsData = await getPosts();
      // Apply localStorage likes to posts
      const updatedPosts = (postsData || []).map(p => ({
        ...p,
        likedBy: likedPosts[p.id] || []
      }));
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const filteredPosts = selectedTab === 'all' 
    ? posts 
    : posts; // 'friends' tab for future use

  if (loading) {
    return <div className="profile-wrapper"><p>Đang tải...</p></div>;
  }

  return (
    <div className="profile-wrapper">
      <Header onLogout={handleLogout} />
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover"></div>
          
          <div className="profile-info-section">
            <div className="profile-avatar-large">👤</div>
            
            <div className="profile-user-info">
              <h1 className="profile-username">{currentUser?.fullName || currentUser?.userName}</h1>
              
              <div className="profile-bio">
                <p>Nói giới thiệu bản thân</p>
                <p>Địa chỉ nơi sống...</p>
                <p>Đã học tại....</p>
              </div>

              <button className="profile-edit-btn">
                <span>✏️</span> Chỉnh sửa
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

        {/* Profile Posts */}
        <main className="profile-main-content">
          <div className="profile-posts">
            {filteredPosts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào</p>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="profile-post-card">
                  <div className="post-header-profile">
                    <div className="post-user-info-profile">
                      <div className="post-avatar-profile">👤</div>
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
                    <span>{post.commentsCount} Bình luận</span>
                  </div>

                  <div className="post-actions-profile">
                    <button 
                      className={`post-action-btn-profile ${(post.likedBy || []).includes(currentUser?.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn-profile">
                      <span>💬</span> Bình luận
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
