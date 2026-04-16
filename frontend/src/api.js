const API_BASE = '/api';

function formatResponseError(json, response) {
  if (!json) {
    return response.statusText || 'Lỗi không xác định';
  }

  if (json?.message) {
    return json.message;
  }

  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    return json.errors.map((err) => err.message || err.code || 'Lỗi không xác định').join(', ');
  }

  return response.statusText || 'Lỗi không xác định';
}

async function safeFetch(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatResponseError(json, response));
  }

  return json?.data ?? json;
}

export async function login({ userName, password }) {
  const data = await safeFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, password }),
  });

  if (!data?.Token) {
    throw new Error('Không nhận được token từ backend');
  }

  return { token: data.Token, user: data.User };
}

export async function register({ userName, email, password, fullName }) {
  await safeFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, email, password, fullName }),
  });
}
