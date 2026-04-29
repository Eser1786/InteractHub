import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { getStoryById } from '../api';
import '../styles/StoryPage.css';

export default function StoryPage() {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { storyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
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

  return (
    <div className="story-page-wrapper">
      <Header onLogout={handleLogout} />

      <div className="story-page-container">
        <button
          className="story-back-btn"
          onClick={() => navigate('/home')}
          title="Quay lại"
        >
          ←
        </button>

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

              <div className="story-input-section">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Gửi tin nhắn..."
                  className="story-message-input"
                />
                <button className="btn-like">♡</button>
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
