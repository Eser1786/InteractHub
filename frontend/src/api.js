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
  console.log('Login data.Data:', data?.Data);
  console.log('Login data.Data.User:', data?.Data?.User);
  console.log('Login data.Data.User.Id:', data?.Data?.User?.Id);
  
  // Check if data structure is correct - handle both PascalCase (from backend) and camelCase
  if (!data || !data.Data) {
    console.error('Invalid response structure:', data);
    throw new Error('Invalid response from server - missing Data object');
  }

  // Backend uses PascalCase (PropertyNamingPolicy = null in Program.cs)
  const token = data.Data.Token || data.Data.token;
  const user = data.Data.User || data.Data.user;

  if (!token || !user) {
    console.error('Missing token or user in response:', data.Data);
    console.error('Token:', token);
    console.error('User:', user);
    throw new Error('Invalid response from server - missing Token or User');
  }

  console.log('Final user object to be returned:', user);
  console.log('Final user.Id:', user.Id);
  
  return { token, user };
}

export async function register({ userName, email, fullName, password }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, email, fullName, password })
  });
  
  const data = await handleResponse(response);
  // Backend uses PascalCase (PropertyNamingPolicy = null in Program.cs)
  const token = data?.Data?.Token || data?.Data?.token;
  const user = data?.Data?.User || data?.Data?.user;

  if (!token || !user) {
    throw new Error('Invalid registration response from server - missing Token or User');
  }

  return { token, user };
}

export async function getPostsByGroup(groupId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts/group/${groupId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function getUserPosts(userId) {
  const token = localStorage.getItem('token');
  console.log('getUserPosts called with userId:', userId);
  
  if (!userId) {
    console.warn('getUserPosts: userId is empty/null');
    return [];
  }
  
  const url = `${API_BASE}/posts/user/${userId}`;
  console.log('getUserPosts - fetching from URL:', url);
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  console.log('getUserPosts response data:', data);
  console.log('getUserPosts Data array:', data?.Data);
  
  return data?.Data || [];
}

export async function getPosts() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function createPost({ content, imageUrl, groupId }) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content, imageUrl, groupId })
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function getStories() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/stories`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function getStoryById(storyId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/stories/${storyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function deleteStory(storyId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/stories/${storyId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await handleResponse(response);
  return true;
}

export async function createStory({ content, imageUrl, expireAt }) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content, imageUrl, expireAt })
  });
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function likePost(postId, userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postId, userId })
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function unlikePost(postId, userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/likes/post/${postId}/user/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function deletePost(postId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function getUser(userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function getNotifications(userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/notifications/user/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return data?.Data || [];
}

const normalizeComment = (comment) => ({

  id: comment.Id ?? comment.id,
  content: comment.Content ?? comment.content,
  postId: comment.PostId ?? comment.postId,
  userId: comment.UserId ?? comment.userId,
  createdAt: comment.CreatedAt ?? comment.createdAt
});

export async function getCommentsByPost(postId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/comments/post/${postId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  const comments = data?.Data || [];
  return (comments || []).map(normalizeComment);
}

export async function createComment(postId, content) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postId, content })
  });
  const data = await handleResponse(response);
  return normalizeComment(data?.Data || {});
}

export async function updateComment(commentId, content) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content })
  });
  await handleResponse(response);
  return true;
}

export async function deleteComment(commentId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await handleResponse(response);
  return true;
}

const normalizeGroup = (group) => ({
  id: group.Id,
  name: group.Name,
  slug: group.Slug,
  description: group.Description || '',
  creatorId: group.CreatorId,
  isJoined: group.IsJoined ?? false,
  memberCount: group.MemberCount ?? 0,
  createdAt: group.CreatedAt,
  images: group.Images || ['img1', 'img2', 'img3'],
  likes: group.Likes ?? 0,
  comments: group.Comments ?? 0
});

export async function getGroups() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/groups`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return (data?.Data || []).map(normalizeGroup);
}

export async function createGroup({ name, description }) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, description })
  });
  const data = await handleResponse(response);
  return normalizeGroup(data?.Data);
}

export async function joinGroupApi(groupId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/groups/${groupId}/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await handleResponse(response);
}

export async function leaveGroupApi(groupId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await handleResponse(response);
}

export async function getAllUsers(search = '') {
  const token = localStorage.getItem('token');
  const url = `${API_BASE}/users${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function getAcceptedFriends(userId, pageNumber = 1, pageSize = 20) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/user/${userId}/accepted?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function getConversationsSorted(userId) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE}/friendships/user/${userId}/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔄 API Response status:', response.status);
    console.log('🔄 API Response ok:', response.ok);
    
    const data = await handleResponse(response);
    console.log('🔄 API Response data:', data);
    return data?.Data || [];
  } catch (err) {
    console.error('🔄 Error calling getConversationsSorted:', err);
    throw err;
  }
}

export async function getConversationMessages(friendId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/messages/conversation/${friendId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function sendMessage(receiverId, content) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ receiverId, content })
  });
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function getPendingRequests(userId, pageNumber = 1, pageSize = 20) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/user/${userId}/pending?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || [];
}

export async function updateUser(userId, { fullName, bio, profilePictureUrl }) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ fullName, bio, profilePictureUrl })
  });
  
  const data = await handleResponse(response);
  return data;
}

export async function uploadProfilePicture(userId, file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/users/${userId}/upload-profile-picture`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function sendFriendRequest(friendId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/send-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ friendId })
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function acceptFriendRequest(friendshipId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/${friendshipId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}

export async function declineFriendRequest(friendshipId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/friendships/${friendshipId}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(response);
  return data?.Data || null;
}
