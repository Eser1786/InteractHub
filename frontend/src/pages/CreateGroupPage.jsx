import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, getAcceptedFriends, getUser } from '../api';
import { useGroups } from '../contexts/GroupsContext';
import Header from '../components/Header';
import '../styles/CreateGroupPage.css';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { refreshGroups } = useGroups();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setCurrentUser(userData);
    const loadFriends = async () => {
      if (!userData?.Id) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }
      try {
        const accepted = await getAcceptedFriends(userData.Id, 1, 100);
        const friendIds = (accepted || [])
          .map((f) => f.FriendId || f.friendId)
          .filter(Boolean);

        const users = await Promise.all(
          friendIds.map(async (id) => {
            try {
              return await getUser(id);
            } catch {
              return null;
            }
          })
        );
        setFriends(users.filter(Boolean));
      } catch (err) {
        console.error('Failed to load friends for group creation', err);
        setFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenUpdated'));
    navigate('/login');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    try {
      setCreating(true);
      await createGroup({
        name: groupName.trim(),
        description: '',
        memberIds: selectedFriendIds
      });
      await refreshGroups();
      alert(`Tạo nhóm "${groupName}" thành công!`);
      navigate('/group');
    } catch (err) {
      console.error('Failed to create group', err);
      alert('Tạo nhóm thất bại. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const selectedCount = useMemo(() => selectedFriendIds.length + 1, [selectedFriendIds]);

  return (
    <div className="create-group-wrapper">
      <Header onLogout={handleLogout} />
      
      <div className="create-group-container">
        <aside className="create-group-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Tạo Nhóm</h3>
          </div>

          <div className="member-item current-member">
            <div className="member-avatar"><i className="fa-solid fa-user"></i></div>
            <div className="member-info">
              <p className="member-name">{currentUser?.FullName || currentUser?.fullName || 'Người dùng'}</p>
              <p className="member-status">Quản lý nhóm</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Nhập tên nhóm"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="group-name-input"
          />

          <p className="member-status">Bạn có thể tạo nhóm chỉ với tên nhóm, hoặc chọn thêm bạn bè.</p>
          <button className="btn-create-group" onClick={handleCreateGroup} disabled={creating}>
            {creating ? 'Đang tạo...' : 'Tạo'}
          </button>
        </aside>

        <main className="create-group-main">
          <div className="group-info-section">
            <h2 className="group-display-name">{groupName || 'Tên nhóm'}</h2>
            <p className="group-member-count">{selectedCount} thành viên (bao gồm bạn)</p>

            <section className="create-post-section">
              <div className="create-post-header">
                <p className="create-post-prompt">Thêm bạn bè vào nhóm (tùy chọn)</p>
              </div>

              {loadingFriends ? (
                <p>Đang tải danh sách bạn bè...</p>
              ) : friends.length === 0 ? (
                <p>Bạn chưa có bạn bè nào để thêm.</p>
              ) : (
                <div>
                  {friends.map((friend) => {
                    const friendId = friend.Id || friend.id;
                    const checked = selectedFriendIds.includes(friendId);
                    return (
                      <label key={friendId} className="member-item" style={{ marginBottom: 10 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFriend(friendId)}
                          style={{ marginRight: 8 }}
                        />
                        <span className="member-name">
                          {friend.FullName || friend.fullName || friend.UserName || friend.userName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
