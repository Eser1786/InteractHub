import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/GroupDetailPage.css';

export default function GroupDetailPage() {
  const { groupSlug } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock groups data - same as in GroupPage
  const mockGroups = [
    {
      id: '1',
      name: 'Nhóm lập trình Java',
      slug: 'nhom-lap-trinh-java',
      description: 'Vừa vào',
      images: ['img1', 'img2', 'img3'],
      isJoined: true
    },
    {
      id: '2',
      name: 'Nhóm giải tích',
      slug: 'nhom-giai-tich',
      description: '2 tuần trước',
      images: ['img1', 'img2', 'img3'],
      isJoined: true
    },
    {
      id: '3',
      name: 'Nhóm thiết kế đồ họa',
      slug: 'nhom-thiet-ke-do-hoa',
      description: '1 ngày trước',
      images: ['img1', 'img2', 'img3'],
      isJoined: false
    },
    {
      id: '4',
      name: 'Nhóm phát triển web',
      slug: 'nhom-phat-trien-web',
      description: '3 ngày trước',
      images: ['img1', 'img2', 'img3'],
      isJoined: false
    }
  ];

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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Find group by slug
    const foundGroup = mockGroups.find(g => g.slug === groupSlug);
    if (foundGroup) {
      setGroup(foundGroup);
      // Filter posts for this group
      const groupPosts = mockPosts.filter(p => p.groupId === foundGroup.id);
      
      // Apply localStorage likes to posts
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
      const updatedPosts = groupPosts.map(p => ({
        ...p,
        likedBy: likedPosts[p.id] || []
      }));
      setPosts(updatedPosts);
    }

    setLoading(false);
  }, [groupSlug]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleLike = (post) => {
    // Toggle like
    const newPosts = posts.map(p => {
      if (p.id === post.id) {
        const isLiked = p.likedBy.includes(currentUser?.id);
        const updatedLikedBy = isLiked
          ? p.likedBy.filter(id => id !== currentUser?.id)
          : [...p.likedBy, currentUser?.id];
        
        // Save to localStorage
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '{}');
        if (updatedLikedBy.length > 0) {
          likedPosts[p.id] = updatedLikedBy;
        } else {
          delete likedPosts[p.id];
        }
        localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        
        return {
          ...p,
          likedBy: updatedLikedBy,
          likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    });
    setPosts(newPosts);
  };

  const handleBackToGroup = () => {
    navigate('/group');
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
              <span className="search-icon">🔍</span>
            </div>

            <div className="nav-item active">
              <span className="nav-icon">👥</span>
              <span>Nhóm của bạn</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon">🔍</span>
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
            <button className="btn-back" onClick={handleBackToGroup}>
              ← Quay lại
            </button>
            <h1 className="group-title">{group.name}</h1>
          </div>

          {/* Posts Feed */}
          <section className="posts-feed">
            {posts.length === 0 ? (
              <p className="no-posts">Chưa có bài viết nào trong nhóm</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar">👤</div>
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
      </div>
    </div>
  );
}
