import { createContext, useContext, useState, useEffect } from 'react';

const GroupsContext = createContext();

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);

  // Mock groups data
  const mockGroups = [
    {
      id: '1',
      name: 'Nhóm lập trình Java',
      slug: 'nhom-lap-trinh-java',
      description: 'Vừa vào',
      images: ['img1', 'img2', 'img3'],
      likes: 5,
      comments: 36,
      isJoined: true
    },
    {
      id: '2',
      name: 'Nhóm giải tích',
      slug: 'nhom-giai-tich',
      description: '2 tuần trước',
      images: ['img1', 'img2', 'img3'],
      likes: 5,
      comments: 36,
      isJoined: true
    },
    {
      id: '3',
      name: 'Nhóm thiết kế đồ họa',
      slug: 'nhom-thiet-ke-do-hoa',
      description: '1 ngày trước',
      images: ['img1', 'img2', 'img3'],
      likes: 12,
      comments: 48,
      isJoined: false
    },
    {
      id: '4',
      name: 'Nhóm phát triển web',
      slug: 'nhom-phat-trien-web',
      description: '3 ngày trước',
      images: ['img1', 'img2', 'img3'],
      likes: 8,
      comments: 24,
      isJoined: false
    }
  ];

  useEffect(() => {
    // Load joined groups from localStorage
    const userJoinedGroups = JSON.parse(localStorage.getItem('userJoinedGroups') || '[]');
    
    // Update isJoined status based on localStorage
    const updatedGroups = mockGroups.map(group => ({
      ...group,
      isJoined: userJoinedGroups.includes(group.id)
    }));

    setGroups(updatedGroups);
  }, []);

  const joinGroup = (groupId) => {
    setGroups(prevGroups =>
      prevGroups.map(g =>
        g.id === groupId ? { ...g, isJoined: true } : g
      )
    );

    // Save to localStorage
    const userJoinedGroups = JSON.parse(localStorage.getItem('userJoinedGroups') || '[]');
    if (!userJoinedGroups.includes(groupId)) {
      userJoinedGroups.push(groupId);
      localStorage.setItem('userJoinedGroups', JSON.stringify(userJoinedGroups));
    }
  };

  const leaveGroup = (groupId) => {
    setGroups(prevGroups =>
      prevGroups.map(g =>
        g.id === groupId ? { ...g, isJoined: false } : g
      )
    );

    // Remove from localStorage
    const userJoinedGroups = JSON.parse(localStorage.getItem('userJoinedGroups') || '[]');
    const updatedGroups = userJoinedGroups.filter(id => id !== groupId);
    localStorage.setItem('userJoinedGroups', JSON.stringify(updatedGroups));
  };

  return (
    <GroupsContext.Provider value={{ groups, joinGroup, leaveGroup }}>
      {children}
    </GroupsContext.Provider>
  );
};
