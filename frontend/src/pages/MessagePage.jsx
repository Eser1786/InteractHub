import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationsSorted, getConversationMessages, sendMessage } from '../api';
import { messageHubConnection } from '../utils/messageHubConnection';
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
  const unsubscribeRef = useRef(null);
  const previousConversationRef = useRef(null);

  // Initialize SignalR connection and load friends
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const normalizedUser = {
          ...userData,
          id: userData.Id ?? userData.id,
          Id: userData.Id ?? userData.id
        };
        setCurrentUser(normalizedUser);

        // 🔄 Connect to SignalR MessageHub
        if (token && !messageHubConnection.isActive()) {
          try {
            console.log('[MessagePage] 📡 Attempting SignalR connection...');
            await messageHubConnection.connect(token);
            console.log('[MessagePage] ✅ SignalR connected successfully');
            
            // CRITICAL: Wait a moment to ensure connection is truly established
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.warn('[MessagePage] ⚠️ SignalR connection failed, but REST API will still work:', err);
            // Continue with REST API even if SignalR fails
          }
        }

        // 🔄 Get conversations sorted by latest message
        const conversationsData = await getConversationsSorted(normalizedUser.Id);
        console.log('[MessagePage] 💬 Conversations loaded:', conversationsData?.length || 0);
        
        const conversationList = (conversationsData || []).map((convo) => ({
          id: convo.FriendId || convo.friendId,
          name: convo.FriendName || convo.friendName || 'Bạn',
          avatarUrl: convo.FriendProfilePictureUrl || convo.friendProfilePictureUrl || '',
          isUnread: false,
          isActive: true,
          lastMessage: convo.LastMessage || convo.lastMessage || '',
          lastTime: convo.LastMessageTime 
            ? new Date(convo.LastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : convo.lastTime || ''
        }));

        setConversations(conversationList);
        
        if (conversationList.length > 0) {
          const firstConversation = conversationList[0];
          setSelectedConversation(firstConversation);
          
          // 🔄 Join SignalR group for first conversation (if connected)
          if (messageHubConnection.isActive()) {
            try {
              console.log('[MessagePage] 👥 Joining conversation group:', firstConversation.id);
              await messageHubConnection.joinConversation(firstConversation.id);
              previousConversationRef.current = firstConversation.id;
              console.log('[MessagePage] ✅ Joined conversation group');
            } catch (err) {
              console.warn('[MessagePage] ⚠️ Failed to join group:', err);
            }
          } else {
            console.warn('[MessagePage] ⚠️ messageHubConnection.isActive() returned false!');
          }
          
          await loadMessages(firstConversation);
        }
      } catch (err) {
        console.error('[MessagePage] ❌ Error loading data:', err);
        setError(`Lỗi tải dữ liệu: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (previousConversationRef.current && messageHubConnection.isActive()) {
        messageHubConnection.leaveConversation(previousConversationRef.current).catch(err => 
          console.warn('[MessagePage] ⚠️ Error leaving conversation:', err)
        );
      }
      // Don't disconnect on unmount - keep connection alive for other pages
    };
  }, []);

  const loadMessages = async (conversation) => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    try {
      const messageData = await getConversationMessages(conversation.id);
      const normalized = (messageData || []).map((message) => ({
        id: message.Id || message.id,
        senderId: message.SenderId || message.senderId,
        text: message.Content || message.content,
        timestamp: new Date(message.CreatedAt || message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }));
      setMessages(normalized);

      if (normalized.length > 0) {
        const last = normalized[normalized.length - 1];
        setConversations((prev) => prev.map((item) =>
          item.id === conversation.id
            ? { ...item, lastMessage: last.text, lastTime: last.timestamp, isUnread: false }
            : item
        ));
      }
    } catch (err) {
      console.error('Không thể tải cuộc trò chuyện:', err);
      setMessages([]);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // 🔄 Leave previous conversation group and join new one
    if (previousConversationRef.current && messageHubConnection.isActive()) {
      try {
        console.log('[MessagePage] 👋 Leaving previous group:', previousConversationRef.current);
        await messageHubConnection.leaveConversation(previousConversationRef.current);
      } catch (err) {
        console.warn('[MessagePage] ⚠️ Error leaving previous group:', err);
      }
    }

    if (messageHubConnection.isActive()) {
      try {
        console.log('[MessagePage] 👥 Joining new group:', conversation.id);
        await messageHubConnection.joinConversation(conversation.id);
        previousConversationRef.current = conversation.id;
        console.log('[MessagePage] ✅ Joined new group');
      } catch (err) {
        console.warn('[MessagePage] ⚠️ Error joining new group:', err);
      }
    }

    await loadMessages(conversation);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const sentMessage = await sendMessage(selectedConversation.id, newMessage.trim());
      const nextMessage = {
        id: sentMessage?.Id || sentMessage?.id || messages.length + 1,
        senderId: sentMessage?.SenderId || sentMessage?.senderId || currentUser?.Id || currentUser?.id,
        text: sentMessage?.Content || sentMessage?.content || newMessage.trim(),
        timestamp: new Date(sentMessage?.CreatedAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, nextMessage]);
      
      // Update conversations and re-sort by latest message
      setConversations((prev) => {
        const updated = prev.map((item) =>
          item.id === selectedConversation.id
            ? { ...item, lastMessage: nextMessage.text, lastTime: nextMessage.timestamp, isUnread: false }
            : item
        );
        
        // Re-sort by last message time (newest first), then by name
        return updated.sort((a, b) => {
          const timeA = a.lastTime ? new Date(a.lastTime) : new Date(0);
          const timeB = b.lastTime ? new Date(b.lastTime) : new Date(0);
          
          if (timeA.getTime() !== timeB.getTime()) {
            return timeB.getTime() - timeA.getTime(); // Newest first
          }
          return a.name.localeCompare(b.name); // Then by name
        });
      });
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // 🔄 Effect to listen for incoming messages via SignalR
  useEffect(() => {
    if (!selectedConversation) return;

    console.log('[MessagePage] 🎧 Registering message listener for conversation:', selectedConversation.id);

    // Subscribe to incoming messages
    const unsubscribe = messageHubConnection.onMessage((incomingMessage) => {
      console.log('[MessagePage] 📨 Incoming message from SignalR:', incomingMessage);
      
      // Check if this message belongs to current conversation
      const isForCurrentConversation = 
        (String(incomingMessage.SenderId) === String(selectedConversation.id) ||
         String(incomingMessage.ReceiverId) === String(selectedConversation.id)) &&
        (String(incomingMessage.SenderId) === String(currentUser?.Id ?? currentUser?.id) ||
         String(incomingMessage.ReceiverId) === String(currentUser?.Id ?? currentUser?.id));

      console.log('[MessagePage] 🔍 Is for current conversation?', { isForCurrentConversation, senderId: incomingMessage.SenderId, receiverId: incomingMessage.ReceiverId });

      if (isForCurrentConversation) {
        console.log('[MessagePage] ✅ Adding message to current conversation:', incomingMessage);
        const formattedMessage = {
          id: incomingMessage.Id || incomingMessage.id,
          senderId: incomingMessage.SenderId || incomingMessage.senderId,
          text: incomingMessage.Content || incomingMessage.content,
          timestamp: new Date(incomingMessage.CreatedAt || incomingMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Add message only if not already in list (to avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some(m => m.id === formattedMessage.id);
          if (!exists) {
            console.log('[MessagePage] 💾 Message added to state');
          }
          return exists ? prev : [...prev, formattedMessage];
        });

        // Update last message in conversation list and re-sort
        setConversations((prev) => {
          const updated = prev.map((item) =>
            item.id === selectedConversation.id
              ? { ...item, lastMessage: formattedMessage.text, lastTime: formattedMessage.timestamp }
              : item
          );
          
          // Re-sort by last message time (newest first), then by name
          return updated.sort((a, b) => {
            const timeA = a.lastTime ? new Date(a.lastTime) : new Date(0);
            const timeB = b.lastTime ? new Date(b.lastTime) : new Date(0);
            
            if (timeA.getTime() !== timeB.getTime()) {
              return timeB.getTime() - timeA.getTime(); // Newest first
            }
            return a.name.localeCompare(b.name); // Then by name
          });
        });
      } else {
        console.log('[MessagePage] ⏭️ Message is for different conversation, skipping');
      }
    });

    unsubscribeRef.current = unsubscribe;
    console.log('[MessagePage] ✅ Message listener registered');

    return () => {
      if (unsubscribe) {
        console.log('[MessagePage] 🧹 Unregistering message listener');
        unsubscribe();
      }
    };
  }, [selectedConversation, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
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
            <span className="message-search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
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
                    {conversation.avatarUrl ? (
                      <img src={conversation.avatarUrl} alt={conversation.name} className="conversation-avatar-img" />
                    ) : (
                      <span className="conversation-avatar-fallback">{conversation.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
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
                    {selectedConversation.avatarUrl ? (
                      <img src={selectedConversation.avatarUrl} alt={selectedConversation.name} className="message-header-avatar-img" />
                    ) : (
                      <span className="conversation-avatar-fallback">{selectedConversation.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
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
                {messages.map((message) => {
                  const isSentByCurrentUser = String(message.senderId) === String(currentUser?.Id ?? currentUser?.id);
                  return (
                    <div
                      key={message.id}
                      className={`message-item ${isSentByCurrentUser ? 'sent' : 'received'}`}>
                      {!isSentByCurrentUser && (
                        <div className="message-avatar-small">
                          {selectedConversation?.avatarUrl ? (
                            <img src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
                          ) : (
                            <span className="conversation-avatar-fallback">
                              {selectedConversation?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className={`message-bubble ${isSentByCurrentUser ? 'sent-bubble' : 'received-bubble'}`}>
                        <p>{message.text}</p>
                        <span className="message-time">{message.timestamp}</span>
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
