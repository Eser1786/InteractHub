import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserPosts, getUser, likePost, unlikePost, sendFriendRequest, deletePost } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import HashtagContent from '../components/HashtagContent';
import '../styles/ProfilePage.css';

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const loadUserData = async () => {
    try {
      if (!userId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }

      const userData = await getUser(userId);
      setUser(userData);

      // Load user's posts
      const postsData = await getUserPosts(userId);
      const commentsByPostData = JSON.parse(localStorage.getItem('postComments') || '{}');
      setPosts((postsData || []).map((post) => ({
        ...post,
        commentsCount: commentsByPostData[post.Id]?.length ?? 0
      })));

      // Get current user for like tracking
      const currentUserJson = localStorage.getItem('user');
      if (currentUserJson) {
        const currentUserData = JSON.parse(currentUserJson);
        setCurrentUser(currentUserData);
        
        // Track liked posts
        const userLikedPostIds = (postsData || [])
          .filter(post => post.LikedByUserIds && post.LikedByUserIds.includes(currentUserData.Id))
          .map(post => post.Id);
        setLikedPosts(new Set(userLikedPostIds));
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(`Error loading user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const handleAddFriend = async () => {
    if (!currentUser || !user) return;

    setIsAddingFriend(true);
    try {
      await sendFriendRequest(user.Id || userId);
      setFriendRequestSent(true);
      setError('');
      
      // Show success notification
      setTimeout(() => {
        setFriendRequestSent(false);
      }, 3000);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(`Lỗi gửi lời mời: ${err.message}`);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleLike = async (post) => {
    if (!currentUser) return;

    try {
      const currentUserId = currentUser.Id || currentUser.id;
      const isLiked = likedPosts.has(post.Id);

      if (isLiked) {
        await unlikePost(post.Id, currentUserId);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.Id);
          return newSet;
        });
      } else {
        await likePost(post.Id, currentUserId);
        setLikedPosts(prev => new Set(prev).add(post.Id));
      }

      // Reload posts to get updated like count
      const postsData = await getUserPosts(user.Id);
      if (postsData) {
        const commentsByPostData = JSON.parse(localStorage.getItem('postComments') || '{}');
        setPosts((postsData || []).map((post) => ({
          ...post,
          commentsCount: commentsByPostData[post.Id]?.length ?? 0
        })));

        const userLikedPostIds = postsData
          .filter(p => p.LikedByUserIds && p.LikedByUserIds.includes(currentUserId))
          .map(p => p.Id);
        setLikedPosts(new Set(userLikedPostIds));
      }
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
      userId: currentUser?.Id || currentUser?.id,
      userName: currentUser?.FullName || currentUser?.fullName || currentUser?.UserName || currentUser?.userName || 'User',
      userProfilePictureUrl: currentUser?.ProfilePictureUrl || currentUser?.profilePictureUrl || null,
      content,
      createdAt: new Date().toISOString(),
      replies: [],
      likes: []
    };

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

  const handleHashtagClick = (hashtag) => {
    console.log('Hashtag clicked:', hashtag);
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
        <Header />
        <div className="profile-container">
          <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-wrapper">
        <Header />
        <div className="profile-container">
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#d32f2f' }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Không tìm thấy người dùng này.</p>
            <button 
              onClick={() => navigate('/home')}
              style={{ padding: '10px 20px', backgroundColor: '#6b4fc7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <Header />
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover"></div>

          <div className="profile-info-section">
            <div className="profile-avatar-large">
              {user?.ProfilePictureUrl || user?.profilePictureUrl ? (
                <img src={user.ProfilePictureUrl || user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>

            <div className="profile-user-info">
              <h1 className="profile-username">{user?.FullName || user?.fullName || user?.UserName || user?.userName}</h1>

              <div className="profile-bio">
                {user?.Bio || user?.bio ? (
                  <p>{user.Bio || user.bio}</p>
                ) : (
                  <p style={{ color: '#999' }}>Chưa có tiểu sử</p>
                )}
              </div>

              {friendRequestSent ? (
                <div style={{ padding: '10px 20px', background: '#4caf50', color: 'white', borderRadius: '6px', fontWeight: '600', textAlign: 'center' }}>
                  ✓ Đã gửi lời mời kết bạn
                </div>
              ) : (
                <button 
                  className="profile-edit-btn" 
                  onClick={handleAddFriend}
                  disabled={isAddingFriend}
                  style={{ background: '#ffffff' }}
                >
                  <span><i className="fa-solid fa-user-plus"></i></span> Kết bạn
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <main className="profile-main-content">
          <div className="profile-posts">
            {posts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào</p>
            ) : (
              posts.map((post) => (
                <div key={post.Id} className="profile-post-card">
                  <div className="post-header-profile">
                    <div className="post-user-info-profile">
                      <div className="post-avatar-profile">
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
                      <div className="post-user-details-profile">
                        <p className="post-username-profile">{post.UserFullName || post.UserName || 'Người dùng'}</p>
                        <p className="post-time-profile">
                          {new Date(post.CreatedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="post-content-profile">
                    <p>
                      <HashtagContent 
                        content={post.Content} 
                        onHashtagClick={handleHashtagClick}
                      />
                    </p>
                  </div>

                  {post.ImageUrl && (
                    <div className="post-images-profile">
                      <img src={post.ImageUrl} alt="Post" className="post-image-profile" />
                    </div>
                  )}

                  <div className="post-stats-profile">
                    <span>❤️ {post.LikesCount}</span>
                    <span><i className="fa-solid fa-comments"></i> {commentsByPost[post.Id]?.length ?? 0} Bình luận</span>
                  </div>

                  <div className="post-actions-profile">
                    <button 
                      className={`post-action-btn-profile ${likedPosts.has(post.Id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{likedPosts.has(post.Id) ? '❤️' : '🤍'}</span> 
                      {likedPosts.has(post.Id) ? 'Bỏ thích' : 'Thích'}
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
                      onDeleteComment={handleDeleteComment}
                      onEditComment={handleEditComment}
                      currentUser={currentUser}
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
