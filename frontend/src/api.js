const API_BASE = '/api';
const MOCK_DB_STORAGE_KEY = 'interacthub_mockdb';

// Default mock data
const defaultMockDb = {
  users: {
    'admin': { id: '1', userName: 'admin', email: 'admin@interacthub.com', fullName: 'System Administrator', password: 'Admin@123456' },
    'testuser': { id: '2', userName: 'testuser', email: 'test@example.com', fullName: 'Test User', password: 'Test@123456' }
  },
  posts: [
    { id: 1, userId: '1', username: 'admin', content: 'Xin chào tất cả! 👋', imageUrl: null, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(), likesCount: 5, commentsCount: 2, likedBy: [] },
    { id: 2, userId: '2', username: 'testuser', content: 'Vừa mới join! 🎉', imageUrl: null, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString(), likesCount: 3, commentsCount: 1, likedBy: [] }
  ],
  friends: [{ id: 1, friendId: '2', friendName: 'testuser', status: 'Accepted' }]
};

// Initialize mockDb from localStorage or use defaults
function initializeMockDb() {
  try {
    const stored = localStorage.getItem(MOCK_DB_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Ensure all posts have likedBy array
      if (data.posts) {
        data.posts = data.posts.map(post => ({
          ...post,
          likedBy: post.likedBy || []
        }));
      }
      return data;
    }
  } catch (err) {
    console.log('Error loading from localStorage:', err);
  }
  return JSON.parse(JSON.stringify(defaultMockDb));
}

let mockDb = initializeMockDb();

// Save mockDb to localStorage
function saveMockDb() {
  try {
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(mockDb));
  } catch (err) {
    console.log('Error saving to localStorage:', err);
  }
}

export async function login({ userName, password }) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, password })
    });
    if (response.ok) {
      const data = await response.json();
      return { token: data.data.Token, user: data.data.User };
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  const user = mockDb.users[userName];
  if (user && user.password === password) {
    return { token: 'mock_token', user: { id: user.id, userName: user.userName, email: user.email, fullName: user.fullName } };
  }
  throw new Error('Invalid username or password');
}

export async function register({ userName, email, fullName, password }) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, email, fullName, password })
    });
    if (response.ok) {
      const data = await response.json();
      return { token: data.data.Token, user: data.data.User };
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  if (mockDb.users[userName]) throw new Error('Username already exists');
  const newUser = { id: `user_${Date.now()}`, userName, email, fullName, password };
  mockDb.users[userName] = newUser;
  saveMockDb();
  return { token: 'mock_token', user: { id: newUser.id, userName: newUser.userName, email: newUser.email, fullName: newUser.fullName } };
}

export async function getPosts() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json();
      return data?.data || [];
    }
  } catch (err) {
    console.log('Backend unavailable');
  }
  
  // Ensure all posts have likedBy array
  const posts = mockDb.posts.map(post => ({
    ...post,
    likedBy: post.likedBy || []
  }));
  
  return posts;
}

export async function createPost({ content, imageUrl }) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content, imageUrl })
    });
    if (response.ok) {
      const data = await response.json();
      return data?.data || null;
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const newPost = {
    id: mockDb.posts.length + 1,
    userId: currentUser.id,
    username: currentUser.userName,
    content,
    imageUrl: imageUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    likedBy: []
  };
  mockDb.posts.unshift(newPost);
  saveMockDb();
  return newPost;
}

export async function likePost(postId, userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ postId, userId })
    });
    if (response.ok) {
      const data = await response.json();
      return data?.data || null;
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  const post = mockDb.posts.find(p => p.id === postId);
  if (post) {
    // Ensure likedBy array exists
    if (!post.likedBy) {
      post.likedBy = [];
    }
    if (!post.likedBy.includes(userId)) {
      post.likedBy.push(userId);
      post.likesCount += 1;
      saveMockDb();
    }
  }
  return post || null;
}

export async function unlikePost(postId, userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/likes/${postId}/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      return data?.data || null;
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  const post = mockDb.posts.find(p => p.id === postId);
  if (post) {
    // Ensure likedBy array exists
    if (!post.likedBy) {
      post.likedBy = [];
    }
    const index = post.likedBy.indexOf(userId);
    if (index > -1) {
      post.likedBy.splice(index, 1);
      post.likesCount -= 1;
      saveMockDb();
    }
  }
  return post || null;
}

export async function getUser(userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json();
      return data?.data || null;
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  for (const user of Object.values(mockDb.users)) {
    if (user.id === userId) {
      return { id: user.id, userName: user.userName, email: user.email, fullName: user.fullName };
    }
  }
  return null;
}

export async function getAllUsers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (response.ok) {
      const data = await response.json();
      return data?.data || [];
    }
  } catch (err) {
    console.log('Backend unavailable');
  }

  return Object.values(mockDb.users).map(u => ({ id: u.id, userName: u.userName, email: u.email, fullName: u.fullName }));
}

export async function getAcceptedFriends(userId, pageNumber = 1, pageSize = 20) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/friendships/user/${userId}/accepted?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      return data?.data || [];
    }
  } catch (err) {
    console.log('Backend unavailable');
  }
  return { Data: mockDb.friends };
}

export async function getPendingRequests(userId, pageNumber = 1, pageSize = 20) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/friendships/user/${userId}/pending?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      return data?.data || [];
    }
  } catch (err) {
    console.log('Backend unavailable');
  }
  return [];
}

// Helper function to reset mock database to defaults
export function resetMockDatabase() {
  mockDb = JSON.parse(JSON.stringify(defaultMockDb));
  saveMockDb();
  console.log('Mock database reset to defaults');
}