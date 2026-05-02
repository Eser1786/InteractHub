import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById, likePost, unlikePost, getCommentsByPost, createComment, updateComment, deleteComment } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import HashtagContent from '../components/HashtagContent';
import '../styles/PostDetailPage.css';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const userDataJson = localStorage.getItem('user');
        if (!userDataJson) {
          navigate('/login');
          return;
        }

        const userData = JSON.parse(userDataJson);
        setCurrentUser(userData);

        const postData = await getPostById(postId);
        if (!postData) {
          setError('Bài viết không tồn tại');
          return;
        }

        setPost(postData);

        // Initialize liked posts
        const userLikedPostIds = new Set();
        if (postData.LikedByUserIds?.includes(userData.Id)) {
          userLikedPostIds.add(postData.Id);
        }
        if (postData.SharedPost?.LikedByUserIds?.includes(userData.Id)) {
          userLikedPostIds.add(postData.SharedPost.Id);
        }
        setLikedPosts(userLikedPostIds);

      } catch (err) {
        console.error('Error loading post:', err);
        setError('Không thể tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId, navigate]);

  const handleLike = async (targetPost) => {
    if (!currentUser) return;

    try {
      const isLiked = likedPosts.has(targetPost.Id);

      if (isLiked) {
        await unlikePost(targetPost.Id, currentUser.Id);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetPost.Id);
          return newSet;
        });
      } else {
        await likePost(targetPost.Id, currentUser.Id);
        setLikedPosts(prev => new Set(prev).add(targetPost.Id));
      }

      // Update post data
      const updatedPost = await getPostById(targetPost.Id);
      if (updatedPost) {
        if (targetPost.Id === post.Id) {
          setPost(updatedPost);
        } else if (post.SharedPost?.Id === targetPost.Id) {
          setPost(prev => ({
            ...prev,
            SharedPost: updatedPost
          }));
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleComments = (targetPost) => {
    setActiveCommentPostId((current) => (current === targetPost.Id ? null : targetPost.Id));
  };

  useEffect(() => {
    if (!activeCommentPostId) return;

    const loadComments = async () => {
      try {
        const comments = await getCommentsByPost(activeCommentPostId);
        setCommentsByPost((prev) => ({
          ...prev,
          [activeCommentPostId]: comments
        }));
      } catch (err) {
        console.error('Error loading comments for post:', activeCommentPostId, err);
      }
    };

    loadComments();
  }, [activeCommentPostId]);

  const handleAddComment = async (commentPostId, content) => {
    try {
      const createdComment = await createComment(commentPostId, content);
      setCommentsByPost((prev) => ({
        ...prev,
        [commentPostId]: [createdComment, ...(prev[commentPostId] || [])]
      }));

      // Update post comment count
      if (commentPostId === post.Id) {
        setPost(prev => ({
          ...prev,
          CommentsCount: (prev.CommentsCount || 0) + 1
        }));
      } else if (post.SharedPost?.Id === commentPostId) {
        setPost(prev => ({
          ...prev,
          SharedPost: {
            ...prev.SharedPost,
            CommentsCount: (prev.SharedPost.CommentsCount || 0) + 1
          }
        }));
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };

  const handleDeleteComment = async (commentPostId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      await deleteComment(commentId);
      setCommentsByPost((prev) => ({
        ...prev,
        [commentPostId]: (prev[commentPostId] || []).filter(comment => comment.id !== commentId)
      }));

      // Update post comment count
      if (commentPostId === post.Id) {
        setPost(prev => ({
          ...prev,
          CommentsCount: Math.max(0, (prev.CommentsCount || 0) - 1)
        }));
      } else if (post.SharedPost?.Id === commentPostId) {
        setPost(prev => ({
          ...prev,
          SharedPost: {
            ...prev.SharedPost,
            CommentsCount: Math.max(0, (prev.SharedPost.CommentsCount || 0) - 1)
          }
        }));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleEditComment = async (commentPostId, commentId, newContent) => {
    try {
      await updateComment(commentId, newContent);
      setCommentsByPost((prev) => ({
        ...prev,
        [commentPostId]: (prev[commentPostId] || []).map(comment =>
          comment.id === commentId ? { ...comment, content: newContent } : comment
        )
      }));
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/home?hashtag=${encodeURIComponent(hashtag.slice(1))}`);
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <Header onLogout={() => navigate('/login')} />
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-page">
        <Header onLogout={() => navigate('/login')} />
        <div className="error">{error || 'Bài viết không tồn tại'}</div>
        <button onClick={() => navigate(-1)} className="back-btn">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <Header onLogout={() => navigate('/login')} />

      <div className="post-detail-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Quay lại
        </button>

        <div className="post-detail-card">
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
          </div>

          <div className="post-content">
            <p>
              <HashtagContent
                content={post.Content}
                onHashtagClick={handleHashtagClick}
              />
            </p>
            {post.ImageUrl && (
              <img src={post.ImageUrl} alt="Post" className="post-image" />
            )}

            {/* Shared Post Display */}
            {post.IsShared && post.SharedPost && (
              <div className="shared-post-container" style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f0f2f5',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  color: '#65676b',
                  fontSize: '13px'
                }}>
                  <i className="fa-solid fa-share"></i>
                  <span>{post.UserFullName || post.UserName} đã chia sẻ</span>
                </div>

                <div className="original-post" style={{
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#e5e7eb'
                    }}>
                      {post.SharedPost.UserProfilePictureUrl ? (
                        <img
                          src={post.SharedPost.UserProfilePictureUrl}
                          alt="Author"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fa-solid fa-user"></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <p style={{
                        margin: '0',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {post.SharedPost.UserFullName || post.SharedPost.UserName}
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: '12px',
                        color: '#65676b'
                      }}>
                        {new Date(post.SharedPost.CreatedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <p style={{
                    margin: '8px 0',
                    fontSize: '14px',
                    color: '#050505'
                  }}>
                    <HashtagContent
                      content={post.SharedPost.Content}
                      onHashtagClick={handleHashtagClick}
                    />
                  </p>

                  {post.SharedPost.ImageUrl && (
                    <img
                      src={post.SharedPost.ImageUrl}
                      alt="Shared Post"
                      style={{
                        marginTop: '8px',
                        maxWidth: '100%',
                        borderRadius: '6px',
                        maxHeight: '300px',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '8px'
                  }}>
                    <button
                      type="button"
                      className={`post-action-btn shared-post-action ${likedPosts.has(post.SharedPost.Id) ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.SharedPost);
                      }}
                    >
                      <span>{likedPosts.has(post.SharedPost.Id) ? '❤️' : '🤍'}</span>
                      {likedPosts.has(post.SharedPost.Id) ? 'Bỏ thích bài gốc' : 'Thích bài gốc'}
                    </button>
                    <button
                      type="button"
                      className="post-action-btn shared-post-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComments(post.SharedPost);
                      }}
                    >
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận bài gốc
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '12px',
                    color: '#65676b'
                  }}>
                    <span>❤️ {post.SharedPost.LikesCount} lượt thích</span>
                    <span><i className="fa-solid fa-comments"></i> {post.SharedPost.CommentsCount} bình luận</span>
                  </div>

                  {activeCommentPostId === post.SharedPost.Id && (
                    <div style={{ marginTop: '12px' }}>
                      <CommentSection
                        post={post.SharedPost}
                        comments={commentsByPost[post.SharedPost.Id] || []}
                        onClose={() => setActiveCommentPostId(null)}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                        onEditComment={handleEditComment}
                        currentUser={currentUser}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="post-stats">
            <span>❤️ {post.LikesCount} lượt thích</span>
            <span><i className="fa-solid fa-comments"></i> {post.CommentsCount ?? (commentsByPost[post.Id]?.length ?? 0)} bình luận</span>
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
      </div>
    </div>
  );
}