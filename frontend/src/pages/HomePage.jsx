import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
 import { getPosts, getAcceptedFriends, getAllUsers, createPost, createStory, getStories, getPendingRequests, likePost, unlikePost, deletePost, acceptFriendRequest, declineFriendRequest, getUser, getCommentsByPost, createComment, updateComment, deleteComment } from '../api';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import HashtagContent from '../components/HashtagContent';
import '../styles/HomePage.css';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsInfo, setFriendsInfo] = useState({}); // Store user info for each friend
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestersInfo, setRequestersInfo] = useState({}); // Store user info for each requester
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
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Bạn có lời mời kết bạn mới', time: '2 giờ trước' },
    { id: '2', title: 'Bài viết mới từ bạn thân', time: '5 giờ trước' },
    { id: '3', title: 'Thành viên mới vừa tham gia nhóm', time: '1 ngày trước' }
  ]);
  const [stories, setStories] = useState([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [hashtagSearch, setHashtagSearch] = useState(null);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [newStoryFile, setNewStoryFile] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState('');
  const [creatingStory, setCreatingStory] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const loadPosts = async (userData) => {
    try {
      const postsData = await getPosts();
      // Sort posts by CreatedAt descending (newest first)
      const sortedPosts = (postsData || [])
        .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
        .map((post) => ({
          ...post,
          commentsCount: 0
        }));
      setPosts(sortedPosts);

      // Initialize liked posts from response data
      const userLikedPostIds = (postsData || [])
        .filter(post => post.LikedByUserIds && post.LikedByUserIds.includes(userData.Id))
        .map(post => post.Id);
      setLikedPosts(new Set(userLikedPostIds));
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const loadFriendAndRequesterInfo = async (friendsData, requestsData) => {
    const friendIds = friendsData
      .map(f => f.FriendId || f.friendId)
      .filter(Boolean);
    const requesterIds = requestsData
      .map(r => r.UserId)
      .filter(Boolean);

    const idsToLoad = [...new Set([...friendIds, ...requesterIds])]
      .filter(id => !friendsInfo[id] && !requestersInfo[id]);

    if (idsToLoad.length === 0) {
      return;
    }

    try {
      const users = await Promise.all(idsToLoad.map(async (id) => {
        try {
          return await getUser(id);
        } catch (err) {
          console.error('Error preloading user info:', err);
          return null;
        }
      }));

      const newFriendsInfo = {};
      const newRequestersInfo = {};

      users.forEach((user) => {
        if (!user) return;
        if (friendIds.includes(user.Id)) {
          newFriendsInfo[user.Id] = user;
        }
        if (requesterIds.includes(user.Id)) {
          newRequestersInfo[user.Id] = user;
        }
      });

      if (Object.keys(newFriendsInfo).length > 0) {
        setFriendsInfo((prev) => ({ ...prev, ...newFriendsInfo }));
      }
      if (Object.keys(newRequestersInfo).length > 0) {
        setRequestersInfo((prev) => ({ ...prev, ...newRequestersInfo }));
      }
    } catch (err) {
      console.error('Error loading friend/requester info:', err);
    }
  };

  const fetchAllUsers = async (searchTerm = '') => {
    try {
      const users = await getAllUsers(searchTerm);
      setAllUsers(users || []);

      if (!searchTerm.trim()) {
        const friendIds = friends.map(f => f.FriendId || f.friendId);
        const availableUsers = (users || []).filter(
          u => u.Id !== currentUser?.Id && !friendIds.includes(u.Id)
        );
        const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
        setSuggestedUsers(shuffled.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading all users:', err);
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

        const loadPostsPromise = loadPosts(userData);
        const [friendsData, requestsData, storyData] = await Promise.all([
          getAcceptedFriends(userData.Id, 1, 10),
          getPendingRequests(userData.Id, 1, 20),
          getStories()
        ]);

        console.log('Friends data from API:', friendsData);
        setFriends(friendsData || []);

        setPendingRequests(requestsData || []);

        const activeStories = (storyData || []).filter(story => {
          return !story.ExpireAt || new Date(story.ExpireAt) > new Date();
        });
        setStories(activeStories);

        await loadFriendAndRequesterInfo(friendsData || [], requestsData || []);
        await loadPostsPromise;
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

    // Listen for new friend request from UserProfilePage
    const handleFriendRequestSent = async () => {
      if (currentUser) {
        console.log('Friend request sent - reloading pending requests');
        const requestsData = await getPendingRequests(currentUser.Id, 1, 20);
        setPendingRequests(requestsData || []);
        // Clear requesters info cache to reload user info
        setRequestersInfo({});
      }
    };

    // Listen for friend acceptance - reload friends list
    const handleFriendAccepted = async () => {
      if (currentUser) {
        console.log('Friend accepted - reloading friends list');
        const friendsData = await getAcceptedFriends(currentUser.Id, 1, 10);
        setFriends(friendsData || []);
        // Clear friends info cache to reload user info
        setFriendsInfo({});
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendAccepted', handleFriendAccepted);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendAccepted', handleFriendAccepted);
    };
  }, []);

  useEffect(() => {
    const loadInfoForFriends = async () => {
      const friendIds = friends
        .map(f => f.FriendId || f.friendId)
        .filter(Boolean);
      const requesterIds = pendingRequests
        .map(r => r.UserId)
        .filter(Boolean);

      const idsToLoad = [...new Set([...friendIds, ...requesterIds])]
        .filter(id => !friendsInfo[id] && !requestersInfo[id]);

      if (idsToLoad.length === 0) {
        return;
      }

      try {
        const users = await Promise.all(idsToLoad.map(async (id) => {
          try {
            return await getUser(id);
          } catch (err) {
            console.error('Error preloading user info:', err);
            return null;
          }
        }));

        const newFriendsInfo = {};
        const newRequestersInfo = {};

        users.forEach((user) => {
          if (!user) return;
          if (friendIds.includes(user.Id)) {
            newFriendsInfo[user.Id] = user;
          }
          if (requesterIds.includes(user.Id)) {
            newRequestersInfo[user.Id] = user;
          }
        });

        if (Object.keys(newFriendsInfo).length > 0) {
          setFriendsInfo((prev) => ({ ...prev, ...newFriendsInfo }));
        }
        if (Object.keys(newRequestersInfo).length > 0) {
          setRequestersInfo((prev) => ({ ...prev, ...newRequestersInfo }));
        }
      } catch (err) {
        console.error('Error loading friend/requester info:', err);
      }
    };

    loadInfoForFriends();
  }, [friends, pendingRequests, friendsInfo, requestersInfo]);

  useEffect(() => {
    if (selectedNav !== 'add-friends') return;

    const loadUsers = async () => {
      await fetchAllUsers(searchQuery.trim());
    };

    loadUsers();
  }, [selectedNav, searchQuery]);

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

  const handleStoryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewStoryFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setStoryImagePreview(event.target?.result || '');
      };
      reader.onerror = () => {
        setError('Lỗi đọc tệp hình ảnh');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!newStoryContent.trim() && !newStoryFile) {
      setError('Vui lòng nhập nội dung hoặc chọn hình ảnh cho tin');
      return;
    }

    setCreatingStory(true);
    try {
      let imageBase64 = null;
      if (newStoryFile) {
        imageBase64 = storyImagePreview;
      }

      const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const createdStory = await createStory({
        content: newStoryContent,
        imageUrl: imageBase64,
        expireAt
      });

      if (!createdStory) {
        throw new Error('Tạo tin thất bại');
      }

      setStories([createdStory, ...stories]);
      setNewStoryContent('');
      setNewStoryFile(null);
      setStoryImagePreview('');
      setShowCreateStoryModal(false);
      setError('');
      navigate(`/story/${createdStory.Id}`);
    } catch (err) {
      setError(err.message);
      console.error('Error creating story:', err);
    } finally {
      setCreatingStory(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const extractHashtag = (query) => {
    if (!query) return null;
    const match = query.match(/#?([a-zA-Z0-9_]+)/);
    return match?.[1] ? `#${match[1]}` : null;
  };

  const handleHomeSearch = (query) => {
    const hashtag = extractHashtag(query);
    setHashtagSearch(hashtag);
    if (hashtag && location.pathname === '/home') {
      navigate(`/home?hashtag=${encodeURIComponent(hashtag.slice(1))}`, { replace: true });
    }
    if (!hashtag && location.pathname === '/home') {
      navigate('/home', { replace: true });
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const hashtagParam = queryParams.get('hashtag');
    const hashtag = extractHashtag(hashtagParam);
    setHashtagSearch(hashtag);
  }, [location.search]);

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
        // Sort posts by CreatedAt descending (newest first)
        const sortedPosts = (postsData || [])
          .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        setPosts(sortedPosts);
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

  const handleAddComment = async (postId, content) => {
    try {
      const createdComment = await createComment(postId, content);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [createdComment, ...(prev[postId] || [])]
      }));
      setPosts((prev) => prev.map((post) =>
        post.Id === postId
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
        post.Id === postId
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

  const handleAcceptRequest = async (request) => {
    try {
      await acceptFriendRequest(request.Id);
      // Remove from pending requests
      setPendingRequests(pendingRequests.filter(r => r.Id !== request.Id));
      // Reload friends list
      const friendsData = await getAcceptedFriends(currentUser.Id, 1, 10);
      setFriends(friendsData || []);
      // Clear cache
      setFriendsInfo({});
      setError('');
      
      // Emit event to notify other components
      window.dispatchEvent(new Event('friendAccepted'));
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(`Lỗi chấp nhận lời mời: ${err.message}`);
    }
  };

  const handleDeclineRequest = async (request) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối lời mời này?')) {
      return;
    }

    try {
      await declineFriendRequest(request.Id);
      setPendingRequests(pendingRequests.filter(r => r.Id !== request.Id));
      setError('');
      
      // Emit event to notify other components
      window.dispatchEvent(new Event('friendDeclined'));
    } catch (err) {
      console.error('Error declining friend request:', err);
      setError(`Lỗi từ chối lời mời: ${err.message}`);
    }
  };

  const handleHashtagClick = (hashtag) => {
    const slug = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    navigate(`/home?hashtag=${encodeURIComponent(slug)}`);
  };

  const hasHashtag = (content = '', tag) => {
    if (!tag) return false;
    const escaped = tag.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$|[^a-zA-Z0-9_])`, 'i');
    return regex.test(content);
  };

  const displayedPosts = hashtagSearch
    ? posts.filter(post => hasHashtag(post.Content || '', hashtagSearch))
    : posts;

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
      !friends.some(f => {
        const fId = f.FriendId || f.friendId;
        return fId === u.Id;
      }) &&
      (u.FullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.UserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : suggestedUsers;

  console.log('Search query:', searchQuery);
  console.log('Filtered users:', filteredUsers);

  return (
    <div className="home-wrapper">
      <Header onLogout={handleLogout} onSearch={handleHomeSearch} searchValue={hashtagSearch || ''} />
      <div className="home-container">
        {/* Left Sidebar */}
        <aside className="sidebar-left">
          <nav className="sidebar-nav">
            <div className={`sidebar-notification ${selectedNav === 'notifications' ? 'active' : ''}`} onClick={() => setSelectedNav('notifications')}>
              <span className="nav-icon"><i className="fa-solid fa-bell"></i></span>
              <div className="notification-text">
                <strong>Thông báo</strong>
                <p>{notifications.length} cập nhật mới</p>
              </div>
            </div>
            <div className={`nav-item ${selectedNav === 'friends' ? 'active' : ''}`} onClick={() => setSelectedNav('friends')}>
              <span className="nav-icon"><i className="fa-solid fa-people-pulling"></i></span>
              <span>Tất cả bạn bè</span>
            </div>
            <div className={`nav-item ${selectedNav === 'requests' ? 'active' : ''}`} onClick={() => setSelectedNav('requests')}>
              <span className="nav-icon"><i className="fa-solid fa-address-book"></i></span>
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


          {/* Stories Section - Always show */}
          <section className="stories-section">
            <div className="stories-carousel">
              {/* Create Story Card */}
              <div 
                className="story-card create-story-card"
                onClick={() => setShowCreateStoryModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="story-create-icon">+</div>
                <p className="story-label">Tạo tin</p>
              </div>

              {/* Friend Stories */}
              {stories.map((story) => (
                <div
                  key={story.Id}
                  className="story-card story-card-clickable"
                  onClick={() => navigate(`/story/${story.Id}`)}
                >
                  <div className="story-background"></div>

                  <div className="story-avatar">
                    {story.UserProfilePictureUrl ? (
                      <img src={story.UserProfilePictureUrl} alt="Avatar" />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                  </div>
                  <p className="story-label">{story.UserName || 'Tin mới'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="posts-feed">
            {displayedPosts.length === 0 ? (
              <p className="no-posts">
                {hashtagSearch ? `Không có bài viết nào với ${hashtagSearch}.` : 'Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!'}
              </p>
            ) : (
              displayedPosts.map((post) => (
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
                    <p>
                      <HashtagContent 
                        content={post.Content} 
                        onHashtagClick={handleHashtagClick}
                      />
                    </p>
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
          {selectedNav === 'add-friends' && hashtagSearch ? (
            <>
              <h3 className="sidebar-title">
                Bài viết có #{hashtagSearch.slice(1)}
              </h3>
              <button 
                className="btn-clear-hashtag"
                onClick={() => {
                  setHashtagSearch(null);
                  setSearchQuery('');
                }}
              >
                ✕ Xóa tìm kiếm
              </button>
              <div className="hashtag-posts">
                {posts.length > 0 ? (
                  <>
                    {posts.filter(post => post.Content.includes(hashtagSearch)).map(post => (
                      <div key={post.Id} className="hashtag-post-item">
                        <p className="hashtag-post-author">{post.UserFullName || post.UserName}</p>
                        <p className="hashtag-post-content">{post.Content.substring(0, 100)}...</p>
                      </div>
                    )).length > 0 ? (
                      posts.filter(post => post.Content.includes(hashtagSearch)).map(post => (
                        <div key={post.Id} className="hashtag-post-item">
                          <p className="hashtag-post-author">{post.UserFullName || post.UserName}</p>
                          <p className="hashtag-post-content">{post.Content.substring(0, 100)}...</p>
                        </div>
                      ))
                    ) : (
                      <p className="no-results">Không có bài viết với hashtag này</p>
                    )}
                  </>
                ) : (
                  <p className="no-results">Không có bài viết với hashtag này</p>
                )}
              </div>
            </>
          ) : selectedNav === 'notifications' ? (
            <>
              <h3 className="sidebar-title">Thông báo</h3>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <p className="no-results">Hiện chưa có thông báo</p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="notification-item">
                      <p className="notification-title">{item.title}</p>
                      <p className="notification-time">{item.time}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : selectedNav === 'add-friends' ? (
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
                        <div 
                          key={user.Id || user.id} 
                          className="suggested-friend-card"
                          onClick={() => navigate(`/user-profile/${user.Id || user.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="friend-avatar">
                            {user.ProfilePictureUrl || user.profilePictureUrl ? (
                              <img 
                                src={user.ProfilePictureUrl || user.profilePictureUrl} 
                                alt={user.FullName || user.fullName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
                            ) : (
                              <i className="fa-solid fa-user"></i>
                            )}
                          </div>
                          <p className="friend-name">{user.FullName || user.fullName}</p>
                          <button 
                            className="btn-add-friend"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user-profile/${user.Id || user.id}`);
                            }}
                          >
                            Xem hồ sơ
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
                  pendingRequests.map((request) => {
                    const requesterInfo = requestersInfo[request.UserId];

                    return (
                      <div key={request.Id} className="friend-request-item">
                        <div className="request-header">
                          <div className="friend-avatar-small">
                            {requesterInfo?.ProfilePictureUrl || requesterInfo?.profilePictureUrl ? (
                              <img 
                                src={requesterInfo.ProfilePictureUrl || requesterInfo.profilePictureUrl} 
                                alt={requesterInfo?.FullName || requesterInfo?.fullName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <i className="fa-solid fa-user"></i>
                            )}
                          </div>
                          <p 
                            className="friend-name-small"
                            onClick={() => navigate(`/user-profile/${request.UserId}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            {requesterInfo?.FullName || requesterInfo?.fullName || 'Người dùng'}
                          </p>
                        </div>
                        <div className="request-actions">
                          <button 
                            className="btn-accept"
                            onClick={() => handleAcceptRequest(request)}
                          >
                            Xác nhận
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => handleDeclineRequest(request)}
                          >
                            Xóa bỏ
                          </button>
                        </div>
                      </div>
                    );
                  })
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
                  friends.map((friend) => {
                    const friendId = friend.FriendId || friend.friendId;
                    const friendInfo = friendsInfo[friendId];

                    return (
                      <div 
                        key={friend.Id || friendId} 
                        className="friend-item"
                        onClick={() => navigate(`/user-profile/${friendId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="friend-avatar-small">
                          {friendInfo?.ProfilePictureUrl || friendInfo?.profilePictureUrl ? (
                            <img 
                              src={friendInfo.ProfilePictureUrl || friendInfo.profilePictureUrl} 
                              alt={friendInfo?.FullName || friendInfo?.fullName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <i className="fa-solid fa-user"></i>
                          )}
                        </div>
                        <p className="friend-name-small">{friendInfo?.FullName || friendInfo?.fullName || 'Đang tải...'}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <div className="modal-overlay" onClick={() => setShowCreateStoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo tin</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowCreateStoryModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="create-story-form">
              <div className="create-story-container">
                <div className="story-preview">
                  {storyImagePreview && (
                    <img src={storyImagePreview} alt="Preview" className="story-preview-image" />
                  )}
                  <div className="story-content-display">
                    <p className="story-text">{newStoryContent}</p>
                  </div>
                </div>

                <div className="story-form-inputs">
                  <textarea
                    value={newStoryContent}
                    onChange={(e) => setNewStoryContent(e.target.value)}
                    placeholder="Chia sẻ tin của bạn..."
                    className="story-textarea"
                    rows="4"
                  />
                  
                  <div className="story-form-bottom">
                    <div className="file-input-wrapper">
                      <label htmlFor="story-image-input" className="file-input-label">
                        <i className="fa-solid fa-image"></i>
                        <span>Thêm hình ảnh</span>
                      </label>
                      <input
                        id="story-image-input"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleStoryFileChange}
                        className="post-file-input"
                      />
                      {newStoryFile && (
                        <span className="file-selected">
                          ✓ {newStoryFile.name}
                        </span>
                      )}
                    </div>
                    <button 
                      type="submit" 
                      className="btn-post"
                      disabled={creatingStory}
                    >
                      {creatingStory ? 'Đang đăng...' : 'Đăng tin'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
