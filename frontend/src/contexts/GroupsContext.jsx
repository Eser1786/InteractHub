import { createContext, useContext, useState, useEffect } from 'react';
import { getGroups, joinGroupApi, leaveGroupApi } from '../api';

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

  const refreshGroups = async () => {
    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      console.error('Error loading groups from backend:', err);
      setGroups([]);
    }
  };

  useEffect(() => {
    refreshGroups();
  }, []);

  const joinGroup = async (groupId) => {
    try {
      await joinGroupApi(groupId);
      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId ? { ...g, isJoined: true } : g
        )
      );
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await leaveGroupApi(groupId);
      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId ? { ...g, isJoined: false } : g
        )
      );
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  };

  return (
    <GroupsContext.Provider value={{ groups, joinGroup, leaveGroup, refreshGroups }}>
      {children}
    </GroupsContext.Provider>
  );
};
