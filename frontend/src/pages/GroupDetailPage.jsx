import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLikedPostsForUser, getUserData, updateUserData } from '../utils/userDataManager';
import { useGroups } from '../contexts/GroupsContext';
import { getPostsByGroup, createPost, deletePost, getCommentsByPost, createComment, updateComment, deleteComment } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import '../styles/GroupDetailPage.css';
import { mergeCommentIntoList } from '../utils/commentNormalize';

export default function GroupDetailPage() {
  const { groupSlug } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFile, setNewPostFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const navigate = useNavigate();
  const { groups, leaveGroup, joinGroup } = useGroups();

  const normalizePost = (post) => ({
    id: post.id || post.Id,
    groupId: post.groupId || post.GroupId,
    userId: post.userId || post.UserId,
    UserId: post.userId || post.UserId,
    username: post.username || post.UserFullName || post.UserName || 'Người dùng',
    userProfilePictureUrl: post.userProfilePictureUrl || post.UserProfilePictureUrl,
    content: post.content || post.Content,
    imageUrl: post.imageUrl || post.ImageUrl,
    createdAt: post.createdAt || post.CreatedAt,
    likesCount: post.likesCount ?? post.LikesCount ?? 0,
    commentsCount: post.commentsCount ?? post.CommentsCount ?? 0,
    likedBy: post.likedBy || post.LikedByUserIds || []
  });

  useEffect(() => {
    const loadGroupAndPosts = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(userData);

      // Find group by slug from context
      const foundGroup = groups.find(g => g.slug === groupSlug);
      if (foundGroup) {
        setGroup(foundGroup);

        try {
          const groupPosts = await getPostsByGroup(foundGroup.id);

          const normalizedPosts = groupPosts.map((p) => {
            const normalized = normalizePost(p);
            const userLikedPosts = userData?.Id ? getLikedPostsForUser(userData.Id) : {};
            const likedByArray = userLikedPosts[normalized.id] || [];
            return {
              ...normalized,
              likedBy: likedByArray,
              likesCount: normalized.likesCount || likedByArray.length,
              commentsCount: normalized.commentsCount || 0
            };
          });

          setPosts(normalizedPosts);
        } catch (error) {
          console.error('Error loading group posts:', error);
          setPosts([]);
        }
      }

      setLoading(false);
    };

    loadGroupAndPosts();
  }, [groupSlug, groups]);

  useEffect(() => {
    if (!activeCommentPostId) {
      return;
    }

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
      const isLiked = likedBy.includes(currentUser.Id);
      const postId = post.id || post.Id;

      const userData = getUserData(currentUser.Id);
      const likedPosts = userData.likedPosts || {};
      let newLikesCount = post.likesCount || 0;

      if (isLiked) {
        if (likedPosts[postId]) {
          likedPosts[postId] = likedPosts[postId].filter(id => id !== currentUser.Id);
          if (likedPosts[postId].length === 0) {
            delete likedPosts[postId];
          }
        }
        newLikesCount = Math.max(0, newLikesCount - 1);
      } else {
        if (!likedPosts[postId]) {
          likedPosts[postId] = [];
        }
        if (!likedPosts[postId].includes(currentUser.Id)) {
          likedPosts[postId].push(currentUser.Id);
        }
        newLikesCount += 1;
      }

      updateUserData(currentUser.Id, { likedPosts });

      const newPosts = posts.map(p => {
        const normalizedId = p.id || p.Id;
        if (normalizedId === postId) {
          return {
            ...p,
            likedBy: likedPosts[postId] || [],
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

  const handleGroupFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setNewPostFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPostImagePreview(reader.result || '');
    };
    reader.onerror = () => {
      setError('Lỗi đọc tệp hình ảnh');
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveGroup = () => {
    leaveGroup(group.id);
    // Navigate back to group list with discover tab selected
    navigate('/group', { state: { tab: 'discover' } });
  };

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
      // Refresh local group state immediately so UI updates without reload
      setGroup((prev) => (prev ? { ...prev, isJoined: true, memberCount: (prev.memberCount || 0) + 1 } : prev));
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Không thể vào nhóm lúc này');
    }
  };

  const handleToggleComments = (post) => {
    setActiveCommentPostId((current) => (current === post.id ? null : post.id));
  };

  const handleOpenUserProfile = (userId) => {
    if (!userId) return;
    navigate(`/user-profile/${userId}`);
  };

  useEffect(() => {
    if (!activeCommentPostId) {
      return;
    }

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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImagePreview) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    setPosting(true);
    try {
      const imageUrl = postImagePreview || null;

      // Create post via API
      const createdPost = await createPost({
        content: newPostContent,
        imageUrl,
        groupId: group.id
      });

      if (createdPost) {
        // Add the created post to the list and normalize keys for this page
        const normalized = normalizePost(createdPost);
        const newPost = {
          ...normalized,
          likedBy: [],
          commentsCount: 0
        };
        setPosts([newPost, ...posts]);
      }

      setNewPostContent('');
      setNewPostFile(null);
      setPostImagePreview('');
      setActivePostMenuId(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!currentUser || post.userId !== currentUser.Id) {
      setError('Bạn chỉ có thể xóa bài viết của chính mình');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      await deletePost(post.id);
      setPosts(posts.filter((p) => p.id !== post.id));
      setActivePostMenuId(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddComment = async (postId, content) => {
    try {
      const createdComment = await createComment(postId, content);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: mergeCommentIntoList(prev[postId] || [], createdComment, { prepend: true })
      }));
      setPosts((prev) => prev.map((post) =>
        post.id === postId
          ? { ...post, commentsCount: (post.commentsCount ?? 0) + 1 }
          : post
      ));
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteComment(commentId);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(comment => comment.id !== commentId)
      }));
      setPosts((prev) => prev.map((post) =>
        post.id === postId
          ? { ...post, commentsCount: Math.max(0, (post.commentsCount ?? 1) - 1) }
          : post
      ));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleEditComment = async (postId, commentId, newContent) => {
    try {
      await updateComment(commentId, newContent);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map(comment =>
          comment.id === commentId
            ? { ...comment, content: newContent }
            : comment
        )
      }));
    } catch (err) {
      console.error('Error updating comment:', err);
    }
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
          {(() => {
            let parsedImages = null;
            try {
              if (group.imageUrl && group.imageUrl.startsWith('[')) {
                parsedImages = JSON.parse(group.imageUrl);
              } else if (group.imageUrl) {
                parsedImages = [group.imageUrl];
              }
            } catch (e) {}
            const coverImg = parsedImages && parsedImages.length > 0 ? parsedImages[0] : null;

            return (
              <div className="group-detail-header" style={{ position: 'relative', overflow: 'hidden', padding: coverImg ? '120px 20px 20px' : '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {coverImg && (
                  <img src={coverImg} alt={group.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.3 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div className="group-header-left" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button className="btn-back" onClick={handleBackToGroup} style={{ alignSelf: 'flex-start' }}>
                      ← Quay lại
                    </button>
                    <h1 className="group-title" style={{ fontSize: '28px', margin: 0 }}>{group.name}</h1>
                    {group.description && <p style={{ margin: 0, color: '#555', fontSize: '15px' }}>{group.description}</p>}
                    <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>{group.memberCount} thành viên</p>
                  </div>
            {group.isJoined ? (
              <div className="group-menu-container">
                <button
                  className="btn-group-menu"
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                >
                  ⋯
                </button>
                {showGroupMenu && (
                  <div className="group-menu-dropdown">
                    <button
                      className="menu-item leave"
                      onClick={() => {
                        handleLeaveGroup();
                        setShowGroupMenu(false);
                      }}
                    >
                      Rời nhóm
                    </button>
                  </div>
                )}
              </div>
                ) : (
                  <button className="btn-post" onClick={handleJoinGroup}>Vào nhóm</button>
                )}
                </div>
              </div>
            );
          })()}

          {group.isJoined ? (
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
                Bạn đang nghĩ gì? Hãy chia sẻ cảm nghĩ của bạn đến thành viên nhóm...
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                  <label htmlFor="group-post-image-input" className="file-input-label">
                    <i className="fa-solid fa-image"></i>
                    <span>Thêm hình ảnh</span>
                  </label>
                  <input
                    id="group-post-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleGroupFileChange}
                    className="post-file-input"
                  />
                  {newPostFile && (
                    <span className="file-selected">✓ {newPostFile.name}</span>
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
                </div>
              )}
            </form>
          </section>
          ) : null}

          <section className="posts-feed">
            {posts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào trong nhóm</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info post-user-clickable" onClick={() => handleOpenUserProfile(post.userId || post.UserId)}>
                      <div className="post-avatar">
                        {post.userProfilePictureUrl ? (
                          <img 
                            src={post.userProfilePictureUrl} 
                            alt="User Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <i className="fa-solid fa-user"></i>
                        )}
                      </div>
                      <div className="post-user-details">
                        <p className="post-username">{post.username}</p>
                        <p className="post-time">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                <div className="post-menu-container">
                  <button
                    className="post-menu-btn"
                    onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                  >
                    ⋯
                  </button>
                  {activePostMenuId === post.id && currentUser?.Id === post.userId && (
                    <div className="post-menu-dropdown">
                      <button className="menu-item delete" onClick={() => handleDeletePost(post)}>
                        <i className="fa-solid fa-trash"></i> Xóa bài viết
                      </button>
                    </div>
                  )}
                </div>
                  </div>

                  {/* Post Content */}
                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="post-image-container">
                      <img src={post.imageUrl} alt="Post" className="post-image" />
                    </div>
                  )}

                  <div className="post-stats">
                    <span>❤️ {post.likesCount} lượt thích</span>
                    <span><i className="fa-solid fa-comments"></i> {(commentsByPost[post.id]?.length ?? 0)} bình luận</span>
                  </div>

                  <div className="post-actions">
                    <button 
                      className={`post-action-btn ${(post.likedBy || []).includes(currentUser?.Id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post)}
                    >
                      <span>{(post.likedBy || []).includes(currentUser?.Id) ? '❤️' : '🤍'}</span> 
                      {(post.likedBy || []).includes(currentUser?.Id) ? 'Bỏ thích' : 'Thích'}
                    </button>
                    <button className="post-action-btn" onClick={() => handleToggleComments(post)}>
                      <span><i className="fa-solid fa-comments"></i></span> Bình luận
                    </button>
                    <button className="post-action-btn">
                      <span><i className="fa-solid fa-share"></i></span> Chia sẻ
                    </button>
                  </div>

                  {activeCommentPostId === post.id && (
                    <CommentSection
                      post={post}
                      comments={commentsByPost[post.id] || []}
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
