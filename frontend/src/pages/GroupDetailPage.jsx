import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLikedPostsForUser, getUserData, updateUserData } from '../utils/userDataManager';
import { useGroups } from '../contexts/GroupsContext';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import '../styles/GroupDetailPage.css';

export default function GroupDetailPage() {
  const { groupSlug } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [postType, setPostType] = useState('text');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { groups, leaveGroup } = useGroups();

  // Mock posts data
  const mockPosts = [
    {
      id: '1',
      groupName: 'Nhóm lập trình Java',
      groupId: '1',
      username: 'Nhóm lập trình Java',
      content: 'Tối nay nộp đồ án nhé!',
      imageUrl: 'https://via.placeholder.com/300',
      createdAt: new Date(),
      likesCount: 5,
      commentsCount: 38,
      likedBy: []
    },
    {
      id: '2',
      groupName: 'Nhóm lập trình Java',
      groupId: '1',
      username: 'Nhóm lập trình Java',
      content: 'Mai kiểm tra giữa kì nhé các em.',
      imageUrl: 'https://via.placeholder.com/300',
      createdAt: new Date(Date.now() - 86400000),
      likesCount: 5,
      commentsCount: 38,
      likedBy: []
    }
  ];

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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Find group by slug from context
    const foundGroup = groups.find(g => g.slug === groupSlug);
    if (foundGroup) {
      setGroup(foundGroup);
      // Filter posts for this group
      const groupPosts = mockPosts.filter(p => p.groupId === foundGroup.id);
      
      // Apply user's liked posts to posts (check userData exists first)
      if (userData && userData.id) {
        const userLikedPosts = getLikedPostsForUser(userData.id);
        const updatedPosts = groupPosts.map(p => {
          const likedByArray = userLikedPosts[p.id] || [];
          const totalLikes = getTotalLikesForPost(p.id);
          return {
            ...p,
            likedBy: likedByArray,
            likesCount: totalLikes > 0 ? totalLikes : likedByArray.length,
            commentsCount: commentsByPost[p.id]?.length ?? 0
          };
        });
        setPosts(updatedPosts);
      } else {
        // If no user, just show posts without liked info
        setPosts(groupPosts.map(p => ({
          ...p,
          commentsCount: commentsByPost[p.id]?.length ?? 0
        })));
      }
    }

    setLoading(false);
  }, [groupSlug, groups]);

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch event to notify App.jsx about token change
    window.dispatchEvent(new Event('tokenUpdated'));
    
    navigate('/login');
  };

  const handleBackToGroup = () => {
    navigate('/group');
  };

  const handleLike = (post) => {
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
      const newPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            likedBy: likedPosts[p.id] || [],
            likesCount: newLikesCount
          };
        }
        return p;
      });
      setPosts(newPosts);
      console.log('Like/Unlike successful');
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleLeaveGroup = () => {
    leaveGroup(group.id);
    // Navigate back to group list with discover tab selected
    navigate('/group', { state: { tab: 'discover' } });
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.id ? null : post.id));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage.trim()) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      // Create new post for the group
      const newPost = {
        id: `${group.id}-${Date.now()}`,
        groupName: group.name,
        groupId: group.id,
        username: currentUser?.fullName || currentUser?.userName || 'Bạn',
        content: newPostContent,
        imageUrl: newPostImage || null,
        createdAt: new Date(),
        likesCount: 0,
        commentsCount: 0,
        likedBy: []
      };

      setNewPostContent('');
      setNewPostImage('');
      setPostType('text');
      setError('');
      
      // Add new post to the beginning of the list
      setPosts([newPost, ...posts]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
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
    return <div>Đang tải...</div>;
  }

  if (!group) {
    return (
      <div className="group-detail-wrapper">
        <Header onLogout={handleLogout} />
        <div className="not-found">
          <p>Không tìm thấy nhóm</p>
          <button onClick={handleBackToGroup}>Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-detail-wrapper">
      <Header onLogout={handleLogout} />
      
      <div className="group-detail-container">
        {/* Left Sidebar */}
        <aside className="group-detail-sidebar">
          <nav className="group-sidebar-nav">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="search-input"
              />
              <span className="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
            </div>

            <div className="nav-item active">
              <span className="nav-icon"><i class="fa-solid fa-users"></i></span>
              <span>Nhóm của bạn</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
              <span>Khám phá</span>
            </div>
            <div 
              className="nav-item create-group-item"
              onClick={() => navigate('/creategroup')}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">➕</span>
              <span>Tạo nhóm mới</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="group-detail-main">
          {/* Group Header */}
          <div className="group-detail-header">
            <div className="group-header-left">
              <button className="btn-back" onClick={handleBackToGroup}>
                ← Quay lại
              </button>
              <h1 className="group-title">{group.name}</h1>
            </div>
            <button className="btn-leave-group" onClick={handleLeaveGroup}>
              ✕ Rời nhóm
            </button>
          </div>

          {/* Create Post Section */}
          <section className="create-post-section">
            <div className="create-post-header">
              <div className="user-avatar">
                <div className="avatar-placeholder"><i className="fa-solid fa-user"></i></div>
              </div>
              <p className="create-post-prompt">
                Bạn đang nghĩ gì? Hãy chia sẻ cảm nghĩ của bạn đến thành viên nhóm...
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
                <span className="tab-icon"><i class="fa-solid fa-image"></i></span>
                <span>Hình ảnh</span>
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

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

          {/* Posts Feed */}
          <section className="posts-feed">
            {posts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào trong nhóm</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar"><i className="fa-solid fa-user"></i></div>
                      <div className="post-user-details">
                        <p className="post-username">{post.username}</p>
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
                      <span><i class="fa-solid fa-share"></i></span> Chia sẻ
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
      </div>
    </div>
  );
}
