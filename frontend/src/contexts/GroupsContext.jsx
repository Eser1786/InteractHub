import { createContext, useContext, useState, useEffect } from 'react';
import { getGroupMembershipsForUser, addGroupMembership, removeGroupMembership } from '../utils/userDataManager';

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
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.Id) {
        const userJoinedGroups = getGroupMembershipsForUser(userData.Id).map(g => g.id);
        
        // Update isJoined status based on user's group memberships
        const updatedGroups = mockGroups.map(group => ({
          ...group,
          isJoined: userJoinedGroups.includes(group.id)
        }));

        setGroups(updatedGroups);
      } else {
        // If no user, set all to not joined
        setGroups(mockGroups.map(group => ({ ...group, isJoined: false })));
      }
    } catch (err) {
      console.error('Error loading user data in GroupsContext:', err);
      setGroups(mockGroups.map(group => ({ ...group, isJoined: false })));
    }
  }, []);

  const joinGroup = (groupId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.Id) {
        const group = mockGroups.find(g => g.id === groupId);
        if (group) {
          addGroupMembership(userData.Id, group);
          
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.id === groupId ? { ...g, isJoined: true } : g
            )
          );
        }
      }
    } catch (err) {
      console.error('Error in joinGroup:', err);
    }
  };

  const leaveGroup = (groupId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.Id) {
        removeGroupMembership(userData.Id, groupId);
        
        setGroups(prevGroups =>
          prevGroups.map(g =>
            g.id === groupId ? { ...g, isJoined: false } : g
          )
        );
      }
    } catch (err) {
      console.error('Error in leaveGroup:', err);
    }
  };

  return (
    <GroupsContext.Provider value={{ groups, joinGroup, leaveGroup }}>
      {children}
    </GroupsContext.Provider>
  );
};
