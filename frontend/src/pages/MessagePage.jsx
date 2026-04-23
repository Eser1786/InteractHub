import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAcceptedFriends } from '../api';
import Header from '../components/Header';
import '../styles/MessagePage.css';

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(userData);

        // Load friends as conversations
        const friendsData = await getAcceptedFriends(userData.id, 1, 100);
        const friends = friendsData?.Data || [];

        // Mock conversations with friends
        const conversationList = friends.map((friend, idx) => ({
          id: friend.friendId,
          name: friend.friendName || 'Bạn',
          lastMessage: ['Tôi nằp lí một lúc Trần', 'May vừa vào', 'Bạn ơi, bạn khỏe không?', 'OK, see you!'][idx % 4],
          lastTime: ['2 phút', '5 phút', '30 phút', '1 giờ'][idx % 4],
          isUnread: idx % 2 === 0,
          isActive: idx % 3 !== 0,
          avatar: '👤'
        }));

        setConversations(conversationList);
        if (conversationList.length > 0) {
          setSelectedConversation(conversationList[0]);
          loadMessages(conversationList[0]);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadMessages = (conversation) => {
    // Load messages from localStorage or use mock messages
    const allMessages = JSON.parse(localStorage.getItem('messages') || '{}');
    
    if (allMessages[conversation.id]) {
      // Use saved messages
      setMessages(allMessages[conversation.id]);
    } else {
      // Use mock messages for first time
      const currentUserId = currentUser?.id || JSON.parse(localStorage.getItem('user') || '{}').id;
      const today = new Date().toLocaleDateString('vi-VN');
      const mockMessages = [
        { id: 1, senderId: conversation.id, text: 'Chào bạn!', timestamp: '10:30', date: today },
        { id: 2, senderId: currentUserId, text: 'Chào, bạn khỏe không?', timestamp: '10:31', date: today },
        { id: 3, senderId: conversation.id, text: 'Khỏe, cảm ơn! Bạn thì sao?', timestamp: '10:32', date: today },
        { id: 4, senderId: currentUserId, text: 'Tôi cũng khỏe, cảm ơn', timestamp: '10:33', date: today },
        { id: 5, senderId: conversation.id, text: 'Bạn có rảnh không? Gặp nhau nào', timestamp: '10:35', date: today },
      ];
      
      // Save mock messages to localStorage for this conversation
      allMessages[conversation.id] = mockMessages;
      localStorage.setItem('messages', JSON.stringify(allMessages));
      
      setMessages(mockMessages);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const now = new Date();
      const message = {
        id: messages.length + 1,
        senderId: currentUser?.id,
        text: newMessage,
        timestamp: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('vi-VN')
      };
      
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      setNewMessage('');
      
      // Save to localStorage
      const allMessages = JSON.parse(localStorage.getItem('messages') || '{}');
      allMessages[selectedConversation.id] = updatedMessages;
      localStorage.setItem('messages', JSON.stringify(allMessages));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : selectedTab === 'all'
      ? conversations
      : selectedTab === 'unread'
        ? conversations.filter(c => c.isUnread)
        : conversations.filter(c => true); // 'group' for future use

  if (loading) {
    return <div className="message-wrapper"><p>Đang tải...</p></div>;
  }

  return (
    <div className="message-wrapper">
      <Header onLogout={handleLogout} />
      <div className="message-container">
        {/* Left Sidebar - Conversations */}
        <aside className="message-sidebar-left">
          <div className="message-search-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="message-search-input"
            />
            <span className="message-search-icon">🔍</span>
          </div>

          <div className="message-tabs">
            <button 
              className={`message-tab ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              Tất cả
            </button>
            <button 
              className={`message-tab ${selectedTab === 'unread' ? 'active' : ''}`}
              onClick={() => setSelectedTab('unread')}
            >
              Chưa đọc
            </button>
            <button 
              className={`message-tab ${selectedTab === 'group' ? 'active' : ''}`}
              onClick={() => setSelectedTab('group')}
            >
              Nhóm
            </button>
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <p className="no-conversations">Không có cuộc trò chuyện</p>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.isUnread ? 'unread' : ''}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.avatar}
                    {conversation.isActive && <span className="online-status"></span>}
                  </div>
                  <div className="conversation-info">
                    <p className="conversation-name">{conversation.name}</p>
                    <p className="conversation-last">{conversation.lastMessage}</p>
                  </div>
                  <span className="conversation-time">{conversation.lastTime}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="message-main-content">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="message-header">
                <div className="message-header-info">
                  <div className="message-header-avatar">
                    {selectedConversation.avatar}
                    {selectedConversation.isActive && <span className="online-status"></span>}
                  </div>
                  <div>
                    <h3 className="message-header-name">{selectedConversation.name}</h3>
                    <p className="message-header-status">
                      {selectedConversation.isActive ? 'Đang hoạt động' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-area">
                {messages.map((message, index) => {
                  // Check if we need to show date separator
                  const showDateSeparator = index === 0 || messages[index - 1].date !== message.date;
                  
                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="message-date-separator">
                          {message.date}
                        </div>
                      )}
                      <div
                        className={`message-item ${message.senderId === currentUser?.id ? 'sent' : 'received'}`}
                      >
                        {message.senderId !== currentUser?.id && (
                          <div className="message-avatar-small">{selectedConversation.avatar}</div>
                        )}
                        <div className={`message-bubble ${message.senderId === currentUser?.id ? 'sent-bubble' : 'received-bubble'}`}>
                          <p>{message.text}</p>
                          <span className="message-time">{message.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="message-input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="message-input"
                />
                <button onClick={handleSendMessage} className="message-send-btn">
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
