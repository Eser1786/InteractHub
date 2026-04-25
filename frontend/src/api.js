const API_BASE = '/api';

// Helper function to handle API responses and errors
async function handleResponse(response) {
  // Check if response has content
  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      console.error('Error parsing JSON response:', err);
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      throw new Error('Invalid response format from server');
    }
  } else {
    console.warn('Response is not JSON, content-type:', contentType);
    data = {};
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
    console.error('API Error:', {
      status: response.status,
      message: errorMessage,
      data: data
    });
    throw new Error(errorMessage);
  }

  return data;
}

export async function login({ userName, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password })
  });
  
  const data = await handleResponse(response);
  
  // Debug logging
  console.log('Login response:', data);
  console.log('Login data.data:', data?.data);
  
  // Check if data structure is correct - handle both camelCase and PascalCase
  if (!data || !data.data) {
    console.error('Invalid response structure:', data);
    throw new Error('Invalid response from server - missing data object');
  }

  const token = data.data.Token || data.data.token;
  const user = data.data.User || data.data.user;

  if (!token || !user) {
    console.error('Missing token or user in response:', data.data);
    console.error('Token:', token);
    console.error('User:', user);
    throw new Error('Invalid response from server - missing Token or User');
  }

  return { token, user };
}

export async function register({ userName, email, fullName, password }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, email, fullName, password })
  });
  
  const data = await handleResponse(response);
  const token = data?.data?.Token || data?.data?.token;
  const user = data?.data?.User || data?.data?.user;

  if (!token || !user) {
    throw new Error('Invalid registration response from server - missing Token or User');
  }

  return { token, user };
}

export async function getPosts() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || [];
}

export async function createPost({ content, imageUrl }) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content, imageUrl })
  });
  
  const data = await handleResponse(response);
  return data?.data || null;
}

export async function likePost(postId, userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postId, userId })
  });
  
  const data = await handleResponse(response);
  return data?.data || null;
}

export async function unlikePost(postId, userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/likes/${postId}/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || null;
}

export async function getUser(userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || null;
}

export async function getAllUsers() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || [];
}

export async function getAcceptedFriends(userId, pageNumber = 1, pageSize = 20) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/user/${userId}/accepted?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || [];
}

export async function getPendingRequests(userId, pageNumber = 1, pageSize = 20) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/user/${userId}/pending?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.data || [];
}
