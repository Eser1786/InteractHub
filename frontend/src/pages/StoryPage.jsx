import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/StoryPage.css';

export default function StoryPage() {
  const [stories, setStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Mock stories data
    const mockStories = [
      {
        id: '1',
        userId: '2',
        userName: 'Trần Siu Ngàu',
        userAvatar: '👤',
        content: 'Hôm nay thời tiết tuyệt vời!',
        imageUrl: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 5
      },
      {
        id: '2',
        userId: '3',
        userName: 'Thái Anh Gay',
        userAvatar: '👤',
        content: 'Vừa mới hoàn thành một dự án lớn 🎉',
        imageUrl: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likes: 12
      },
      {
        id: '3',
        userId: '4',
        userName: 'Meo Lành Mạnh',
        userAvatar: '👤',
        content: 'Đi du lịch tại đảo Phú Quốc',
        imageUrl: 'https://via.placeholder.com/400x300?text=Beach',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        likes: 23
      },
      {
        id: '4',
        userId: '5',
        userName: 'Sang Không Long',
        userAvatar: '👤',
        content: 'Mình yêu lập trình React!',
        imageUrl: null,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        likes: 8
      }
    ];
    
    setStories(mockStories);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePrevStory = () => {
    setCurrentStoryIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const handleNextStory = () => {
    setCurrentStoryIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
  };

  const filteredStories = searchQuery.trim()
    ? stories.filter(story =>
        story.userName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stories;

  const activeStory = stories[currentStoryIndex];

  return (
    <div className="story-page-wrapper">
      <Header onLogout={handleLogout} />
      
      <div className="story-page-container">
        {/* Left Sidebar */}
        <aside className="story-sidebar">
          <div className="sidebar-section">
            <h3 className="section-title">Tin</h3>
            <div className="section-tabs">
              <span className="tab active">Kho lưu trữ</span>
            </div>

            {/* Create Story */}
            <div className="story-item create-story-item">
              <div className="story-icon-btn">+</div>
              <span className="story-text">Tạo tin</span>
            </div>
          </div>

          {/* All Stories Section */}
          <div className="sidebar-section">
            <h3 className="section-title">Tất cả tin</h3>
            <div className="stories-list">
              {filteredStories.map((story, idx) => (
                <div
                  key={story.id}
                  className={`story-item ${currentStoryIndex === idx ? 'active' : ''}`}
                  onClick={() => setCurrentStoryIndex(idx)}
                >
                  <div className="story-avatar">👤</div>
                  <span className="story-name">{story.userName}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="story-main">
          {activeStory ? (
            <div className="story-viewer">
              {/* Story Header */}
              <div className="story-header">
                <div className="story-user-info">
                  <div className="story-user-avatar">👤</div>
                  <div className="story-user-details">
                    <p className="story-username">{activeStory.userName}</p>
                    <p className="story-time">
                      {new Date(activeStory.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Story Content */}
              <div className="story-content-area">
                <div className="story-background">
                  {activeStory.content && (
                    <p className="story-text-content">{activeStory.content}</p>
                  )}
                  {activeStory.imageUrl && (
                    <img src={activeStory.imageUrl} alt="Story" className="story-image-content" />
                  )}
                </div>

                {/* Navigation Arrows */}
                <button className="nav-arrow prev-arrow" onClick={handlePrevStory}>‹</button>
                <button className="nav-arrow next-arrow" onClick={handleNextStory}>›</button>
              </div>

              {/* Story Input */}
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
              <p>Không có tin nào</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
