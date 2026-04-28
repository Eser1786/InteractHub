import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPosts, likePost, unlikePost, deletePost } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import HashtagContent from '../components/HashtagContent';
import '../styles/HomePage.css';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

export default function HashtagPage() {
  const { hashtagSlug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [commentsByPost, setCommentsByPost] = useState(() => JSON.parse(localStorage.getItem('postComments') || '{}'));
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [activePostMenuId, setActivePostMenuId] = useState(null);

  const hashtag = hashtagSlug ? decodeURIComponent(hashtagSlug) : '';
  const hashtagLabel = hashtag ? `#${hashtag}` : '';

  const loadPosts = async (userData) => {
    try {
      const postsData = await getPosts();
      const postList = postsData || [];
      setPosts(postList);

      if (userData) {
        const userLikedPostIds = postList
          .filter(post => post.LikedByUserIds && post.LikedByUserIds.includes(userData.Id))
          .map(post => post.Id);
        setLikedPosts(new Set(userLikedPostIds));
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userDataJson = localStorage.getItem('user');
        if (userDataJson) {
          const userData = JSON.parse(userDataJson);
          setCurrentUser(userData);
          await loadPosts(userData);
        } else {
          await loadPosts(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hashtagSlug]);

  useEffect(() => {
    localStorage.setItem('postComments', JSON.stringify(commentsByPost));
  }, [commentsByPost]);

  const hasHashtag = (content = '') => {
    if (!hashtag) return false;
    const tag = `#${hashtag}`;
    const regex = new RegExp(`(^|\\s)${escapeRegExp(tag)}(?=\\s|$|[^a-zA-Z0-9_])`, 'i');
    return regex.test(content);
  };

  const filteredPosts = posts.filter(post => hasHashtag(post.Content || ''));

  const handleHashtagClick = (newHashtag) => {
    const slug = newHashtag.startsWith('#') ? newHashtag.slice(1) : newHashtag;
    navigate(`/hashtag/${encodeURIComponent(slug)}`);
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.Id ? null : post.Id));
  };

  const handleAddComment = (postId, content) => {
    if (!currentUser) return;
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
          comment.id === commentId ? { ...comment, content: newContent } : comment
        )
      };
      localStorage.setItem('postComments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLike = async (post) => {
    if (!currentUser) return;
    try {
      const isLiked = likedPosts.has(post.Id);
      if (isLiked) {
        await unlikePost(post.Id, currentUser.Id);
      } else {
        await likePost(post.Id, currentUser.Id);
      }
      await loadPosts(currentUser);
    } catch (err) {
      console.error('Error liking post:', err);
      setError('Không thể cập nhật lượt thích. Vui lòng thử lại.');
    }
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
      setPosts((prev) => prev.filter(p => p.Id !== post.Id));
      setActivePostMenuId(null);
      setError('');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Lỗi xóa bài viết. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="home-wrapper">
        <Header />
        <div className="hashtag-container">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <Header />
      <div className="hashtag-container">
        <main className="main-content">
          <div className="hashtag-page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="btn-clear-hashtag"
              onClick={() => navigate('/home')}
              style={{ padding: '8px 14px', marginRight: '12px' }}
            >
              ← Quay lại
            </button>
            <div>
              <h2 style={{ margin: 0 }}>{hashtagLabel || 'Hashtag không hợp lệ'}</h2>
              <p style={{ margin: '4px 0 0', color: '#555' }}>
                Hiển thị các bài viết chứa {hashtagLabel || 'hashtag'}.
              </p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <section className="posts-feed">
            {filteredPosts.length === 0 ? (
              <p className="no-posts">Không có bài viết nào với hashtag này.</p>
            ) : (
              filteredPosts.map((post) => (
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
                          <button className="menu-item" onClick={() => handleDeletePost(post)}>
                            <i className="fa-solid fa-trash"></i> Xóa bài viết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="post-content">
                    <p>
                      <HashtagContent content={post.Content} onHashtagClick={handleHashtagClick} />
                    </p>
                    {post.ImageUrl && <img src={post.ImageUrl} alt="Post" className="post-image" />}
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
                      <span>{likedPosts.has(post.Id) ? '❤️' : '🤍'}</span> {likedPosts.has(post.Id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
                    </button>
                    <button className="post-action-btn">
                      <span><i className="fa-solid fa-share"></i></span> Chia sẻ
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
      </div>
    </div>
  );
}
