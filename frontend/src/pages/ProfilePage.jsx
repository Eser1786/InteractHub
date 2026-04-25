import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, likePost, unlikePost } from '../api';
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
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userDataJson = localStorage.getItem('user');
        if (!userDataJson) {
          console.error('No user data found in localStorage');
          setCurrentUser(null);
          return;
        }

        const userData = JSON.parse(userDataJson);
        setCurrentUser(userData);

        // Load user's posts
        try {
          const postsData = await getPosts();
          setPosts((postsData || []).map((post) => ({
            ...post,
            commentsCount: commentsByPost[post.id]?.length ?? 0
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

  const handleLike = async (post) => {
    if (!currentUser) {
      console.warn('No current user');
      return;
    }
    
    try {
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(currentUser.id);
      
      if (isLiked) {
        await unlikePost(post.id, currentUser.id);
      } else {
        await likePost(post.id, currentUser.id);
      }
      
      // Reload posts to get updated like count
      const postsData = await getPosts();
      setPosts(postsData || []);
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

  const filteredPosts = selectedTab === 'all' 
    ? posts 
    : posts; // 'friends' tab for future use

  if (loading) {
    return <div className="profile-wrapper"><p>Đang tải...</p></div>;
  }

  if (!currentUser) {
    return (
      <div className="profile-wrapper">
        <Header onLogout={handleLogout} />
        <div className="profile-container">
          <div className="error-message" style={{ textAlign: 'center', padding: '20px', color: '#d32f2f' }}>
            <p>Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.</p>
            <button onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('tokenUpdated'));
              navigate('/login');
            }} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
            <div className="profile-avatar-large"><i className="fa-solid fa-user"></i></div>
            
            <div className="profile-user-info">
              <h1 className="profile-username">{currentUser?.fullName || currentUser?.userName}</h1>
              
              <div className="profile-bio">
                <p>Nói giới thiệu bản thân</p>
                <p>Địa chỉ nơi sống...</p>
                <p>Đã học tại....</p>
              </div>

              <button className="profile-edit-btn">
                <span><i class="fa-solid fa-pen-nib"></i></span> Chỉnh sửa
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
                    <span><i className="fa-solid fa-comments"></i> {commentsByPost[post.id]?.length ?? 0} Bình luận</span>
                  </div>

                  <div className="post-actions-profile">
                    <button 
                      className={`post-action-btn-profile ${(post.likedBy || []).includes(currentUser?.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn-profile" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
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
          </div>
        </main>
      </div>
    </div>
  );
}
