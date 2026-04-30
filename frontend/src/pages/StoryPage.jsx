import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { getStoryById, getStories, deleteStory } from '../api';
import '../styles/StoryPage.css';

export default function StoryPage() {
  const [story, setStory] = useState(null);
  const [storiesList, setStoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showStoryOptions, setShowStoryOptions] = useState(false);
  const { storyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
  }, []);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const allStories = await getStories();
        const activeStories = (allStories || []).filter(story => {
          return !story.ExpireAt || new Date(story.ExpireAt) > new Date();
        });
        setStoriesList(activeStories);
      } catch (err) {
        console.error('Error loading story list:', err);
      }
    };

    loadStories();
  }, []);

  useEffect(() => {
    const loadStory = async () => {
      setLoading(true);
      setError('');

      try {
        if (!storyId) {
          setError('Story ID không hợp lệ');
          setLoading(false);
          return;
        }

        const storyData = await getStoryById(storyId);
        if (!storyData) {
          setError('Không tìm thấy story');
        } else {
          setStory(storyData);
        }
      } catch (err) {
        console.error('Error loading story:', err);
        setError(err.message || 'Lỗi khi tải story');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const handleDeleteStory = async () => {
    if (!story || currentUser?.Id !== story.UserId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin này?')) return;

    try {
      await deleteStory(story.Id);
      navigate('/home');
    } catch (err) {
      console.error('Error deleting story:', err);
      setError(`Lỗi xóa tin: ${err.message}`);
    }
  };

  return (
    <div className="story-page-wrapper">
      <Header onLogout={handleLogout} />

      <div className="story-page-container">
        <aside className="story-sidebar">
          <div className="sidebar-top">
            <div className="sidebar-title-row">
              <h3>Tin</h3>
              <span className="sidebar-subtitle">Kho lưu trữ</span>
            </div>
            <div className="story-card-mini create-story-card-mini" onClick={() => navigate('/home')}>
              <div className="story-icon-btn">+</div>
              <div>
                <p className="story-mini-title">Tạo tin</p>
              </div>
            </div>
          </div>

          <div className="stories-list-section">
            <p className="stories-list-heading">Tất cả tin</p>
            <div className="stories-list">
              {storiesList.map((item) => (
                <div
                  key={item.Id}
                  className={`story-item ${item.Id.toString() === storyId ? 'active' : ''}`}
                  onClick={() => navigate(`/story/${item.Id}`)}
                >
                  <div className="story-avatar">
                    {item.UserProfilePictureUrl ? (
                      <img src={item.UserProfilePictureUrl} alt="Avatar" />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                  </div>
                  <div className="story-name-group">
                    <p className="story-name">{item.UserName || 'Người dùng'}</p>
                    <span className="story-time-small">{new Date(item.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="story-main">
          {loading ? (
            <div className="story-empty">
              <p>Đang tải story...</p>
            </div>
          ) : error ? (
            <div className="story-empty">
              <p>{error}</p>
            </div>
          ) : story ? (
            <div className="story-viewer story-page-viewer">
              <div className="story-header">
                <div className="story-user-info">
                  <div className="story-user-avatar">
                    {story.UserProfilePictureUrl ? (
                      <img src={story.UserProfilePictureUrl} alt="Avatar" />
                    ) : (
                      <i className="fa-solid fa-user"></i>
                    )}
                  </div>
                  <div className="story-user-details">
                    <p className="story-username">{story.UserName || 'Người dùng'}</p>
                    <p className="story-time">
                      {new Date(story.CreatedAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {currentUser?.Id === story.UserId && (
                  <div className="story-options">
                    <button
                      type="button"
                      className="story-options-dot"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStoryOptions((current) => !current);
                      }}
                      aria-label="Tùy chọn tin"
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {showStoryOptions && (
                      <div className="story-options-dropdown">
                        <button
                          type="button"
                          className="menu-item delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStory();
                          }}
                        >
                          <i className="fa-solid fa-trash"></i> Xóa tin
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="story-content-area">
                {story.ImageUrl ? (
                  <img src={story.ImageUrl} alt="Story" className="story-image-content" />
                ) : (
                  <div className="story-viewer-text-card">
                    <p>{story.Content || 'Không có nội dung.'}</p>
                  </div>
                )}
                {story.Content && story.ImageUrl && (
                  <p className="story-viewer-caption">{story.Content}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="story-empty">
              <p>Không có story để hiển thị.</p>
            </div>
          )}
        </main>
          </div>
    </div>
  );
}
